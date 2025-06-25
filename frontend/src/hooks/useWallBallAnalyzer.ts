// hooks/useWallBallAnalyzer.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface WorkoutUpdate {
  validSquats: number;
  invalidSquats: number;
  validThrows: number;
  invalidThrows: number;
  totalWallBallReps: number;
  currentState: 'ready' | 'squatting' | 'throw_window' | 'scoring';
  athleteHeight?: number;
  roiBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  debugInfo?: {
    hipPosition?: number;
    kneePosition?: number;
    athleteHeight?: number;
    throwWindowActive?: boolean;
  };
}

export function useWallBallAnalyzer() {
  const [isConnected, setIsConnected] = useState(false);
  const [workoutData, setWorkoutData] = useState<WorkoutUpdate>({
    validSquats: 0,
    invalidSquats: 0,
    validThrows: 0,
    invalidThrows: 0,
    totalWallBallReps: 0,
    currentState: 'ready',
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef(uuidv4());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const frameIntervalRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(
        `ws://localhost:8000/ws/${clientIdRef.current}`
      );

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setWorkoutData(data);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendFrame = useCallback((canvas: HTMLCanvasElement) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      wsRef.current.send(JSON.stringify({
        type: 'frame',
        data: base64Image,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to send frame:', error);
    }
  }, []);

  const startProcessing = useCallback((videoElement: HTMLVideoElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Process at 10 FPS (every 100ms)
    frameIntervalRef.current = setInterval(() => {
      if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        sendFrame(canvas);
      }
    }, 100);
  }, [sendFrame]);

  const stopProcessing = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setWorkoutData({
      validSquats: 0,
      invalidSquats: 0,
      validThrows: 0,
      invalidThrows: 0,
      totalWallBallReps: 0,
      currentState: 'ready',
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    workoutData,
    startProcessing,
    stopProcessing,
    reset,
    sendFrame,
  };
}