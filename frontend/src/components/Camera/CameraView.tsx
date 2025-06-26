import React, { useRef, useEffect, useState } from 'react';
import { useMediaStream } from '../../hooks/useMediaPipe';
import { useWebSocket } from '../../hooks/useWebSocket';
import PoseOverlay from './PoseOverlay';
import StatsPanel from '../Stats/StatsPanel';
import DebugOverlay from './DebugOverlay';
import VideoControls from './VideoControls';
import PerformanceSettings from './PerformanceSetting';
import DebugModeToggle from './DebugModeToggle';
import VideoInputSelector from './VideoInputSelector';
import { WorkoutUpdate } from '../../types';

export default function CameraView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [stats, setStats] = useState<WorkoutUpdate>({
    validSquats: 0,
    invalidSquats: 0,
    validThrows: 0,
    invalidThrows: 0,
    totalWallBallReps: 0,
    currentState: 'ready',
    athleteHeight: undefined,
    roiBox: undefined,
    debugInfo: {},
  });
  const [currentDepth, setCurrentDepth] = useState<number | null>(null);
  const [phase, setPhase] = useState('READY');
  const [state, setState] = useState('READY');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [ballDetected, setBallDetected] = useState<boolean | null>(null);
  const [ballHeight, setBallHeight] = useState<number | null>(null);
  const [kneeAngle, setKneeAngle] = useState<number | null>(null);
  const [hipAngle, setHipAngle] = useState<number | null>(null);
  const [ankleAngle, setAnkleAngle] = useState<number | null>(null);
  const [side, setSide] = useState<'left' | 'right' | null>(null);
  const [repCount, setRepCount] = useState<number | null>(null);
  const [repValid, setRepValid] = useState<boolean | null>(null);
  const [repErrors, setRepErrors] = useState<string[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isVideoFile, setIsVideoFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { 
    videoRef, 
    isLoading, 
    error, 
    processVideoFile,
    mode,
    returnToCamera
  } = useMediaStream();
  
  const { isConnected, sendMessage, lastMessage } = useWebSocket(
    `ws://127.0.0.1:8000/ws/session/${sessionId}`
  );

  // Reset stats when switching cameras
  const resetStats = () => {
    setStats({
      validSquats: 0,
      invalidSquats: 0,
      validThrows: 0,
      invalidThrows: 0,
      totalWallBallReps: 0,
      currentState: 'ready',
      athleteHeight: undefined,
      roiBox: undefined,
      debugInfo: {},
    });
    setCurrentDepth(null);
    setPhase('READY');
    setState('READY');
    setConfidence(null);
    setBallDetected(null);
    setBallHeight(null);
    setKneeAngle(null);
    setHipAngle(null);
    setAnkleAngle(null);
    setSide(null);
    setRepCount(null);
    setRepValid(null);
    setRepErrors([]);
  };

  // Monitor isVideoFile changes
  useEffect(() => {
    console.log('[CameraView] isVideoFile changed:', isVideoFile);
  }, [isVideoFile]);

  // Draw video frame to canvas and send to backend
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let animationFrameId: number;

    console.log('[CameraView] draw loop started. isVideoFile:', isVideoFile);

    const drawFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas size to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Skip frames for performance (process every 3rd frame)
        frameCount++;
        if (frameCount % 3 === 0) {
          // Clear and draw video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          if (!isVideoFile) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          // Send frame to backend as base64
          if (isConnected) {
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // base64 JPEG
              const base64 = dataUrl.split(',')[1];
              sendMessage({
                type: 'frame',
                data: base64,
                timestamp: Date.now(),
              });
            } catch (err) {
              console.error('Failed to send frame:', err);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      console.log('[CameraView] draw loop stopped. isVideoFile:', isVideoFile);
    };
  }, [videoRef, isVideoFile, isConnected, sendMessage]);

  // Update video time
  useEffect(() => {
    if (!videoRef.current || !isVideoFile) return;

    const video = videoRef.current;
    
    const updateTime = () => {
      setVideoTime(video.currentTime);
      setVideoDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateTime);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateTime);
    };
  }, [videoRef, isVideoFile]);

  // Handle backend responses
  useEffect(() => {
    if (lastMessage?.type === 'update') {
      const data: WorkoutUpdate = lastMessage;
      setStats(data);
      setPhase(data.currentState?.toUpperCase() || 'READY');
      setCurrentDepth(data.debugInfo?.hipPosition ? Math.round(data.debugInfo.hipPosition) : null);
      // Optionally extract more debug info if needed
    }
  }, [lastMessage]);

  const handleSettingsChange = (settings: any) => {
    // TODO: Implement settings change logic
    console.log('Settings changed:', settings);
  };

  const handleVideoSelect = (file: File) => {
    setIsVideoFile(true);
    setIsPlaying(true);
    processVideoFile(file);
    resetStats();
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (cameraError) {
    return <div className="error">{cameraError}</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {/* Video or Camera Feed */}
      <video ref={videoRef} autoPlay playsInline style={{ display: 'none' }} />
      
      {/* Overlays */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      {/* PoseOverlay removed: pose is not available in frontend */}
      
      {/* Debug Toggle (top right) */}
      <DebugModeToggle isDebugMode={isDebugMode} onToggle={() => setIsDebugMode(!isDebugMode)} />
      {/* Video Input Selector (just below Debug toggle) */}
      <VideoInputSelector
        mode={mode}
        onSelectCamera={returnToCamera}
        onSelectVideo={processVideoFile}
      />
      
      {isDebugMode && (
        <>
          <DebugOverlay 
            poseDetected={false} 
            isConnected={isConnected} 
            phase={phase} 
          />
          <PerformanceSettings onSettingsChange={handleSettingsChange} />
        </>
      )}

      {isVideoFile && (
        <VideoControls 
          isPlaying={isPlaying} 
          onPlayPause={handlePlayPause} 
          currentTime={videoTime}
          duration={videoDuration}
        />
      )}

      <StatsPanel 
        stats={stats}
        phase={phase}
        isDebugMode={isDebugMode}
      />
      
      {/* Loading and Error States */}
      {(isLoading || cameraLoading) && (
        <div className="loading">
          <div>Loading...</div>
        </div>
      )}

      {error && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'red', background: 'rgba(0,0,0,0.7)', padding: '20px', borderRadius: '10px' }}>
          Camera Error: {error}
        </div>
      )}
    </div>
  );
}