// Update your imports in WallBallCounter.tsx:
import React, { useEffect, useRef, useState } from 'react';
import { useWallBallAnalyzer } from '@/hooks/useWallBallAnalyzer';
import { CameraView } from '@/components/Camera';
import { StatsPanel } from '@/components/Stats';
import { ROIOverlay } from '@/components/ROIOverlay';
import { StateIndicator } from '@/components/StateIndicator';

export function WallBallCounter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const {
    isConnected,
    workoutData,
    startProcessing,
    stopProcessing,
    reset,
  } = useWallBallAnalyzer();

  // Start processing when video is ready
  useEffect(() => {
    if (isVideoReady && videoRef.current) {
      startProcessing(videoRef.current);
      return () => {
        stopProcessing();
      };
    }
  }, [isVideoReady, startProcessing, stopProcessing]);

  const handleVideoReady = (video: HTMLVideoElement) => {
    setIsVideoReady(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4">
      <div className="relative flex-1">
        <CameraView onVideoReady={handleVideoReady} />
        
        {/* Overlay ROI box when in throw window */}
        {workoutData.roiBox && workoutData.currentState === 'throw_window' && (
          <ROIOverlay roi={workoutData.roiBox} />
        )}
        
        {/* Connection status */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        {/* State indicator */}
        <StateIndicator state={workoutData.currentState} />
      </div>
      
      <div className="w-full lg:w-80">
        <StatsPanel
          validSquats={workoutData.validSquats}
          invalidSquats={workoutData.invalidSquats}
          validThrows={workoutData.validThrows}
          invalidThrows={workoutData.invalidThrows}
          totalWallBallReps={workoutData.totalWallBallReps}
        />
        
        <button
          onClick={reset}
          className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reset Workout
        </button>
        
        {/* Debug info */}
        {workoutData.debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
            <h4 className="font-semibold mb-2">Debug Info</h4>
            <pre>{JSON.stringify(workoutData.debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}