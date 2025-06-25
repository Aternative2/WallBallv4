// components/Camera/DebugOverlay.tsx (if keeping it)
import React from 'react';

interface DebugOverlayProps {
  debugInfo?: {
    hipPosition?: number;
    kneePosition?: number;
    athleteHeight?: number;
    throwWindowActive?: boolean;
  };
}

export function DebugOverlay({ debugInfo }: DebugOverlayProps) {
  if (!debugInfo) return null;

  return (
    <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg text-sm text-white">
      <h4 className="font-semibold mb-2">Debug Info</h4>
      <div className="space-y-1">
        {debugInfo.hipPosition && (
          <div>Hip Position: {debugInfo.hipPosition.toFixed(2)}</div>
        )}
        {debugInfo.kneePosition && (
          <div>Knee Position: {debugInfo.kneePosition.toFixed(2)}</div>
        )}
        {debugInfo.athleteHeight && (
          <div>Athlete Height: {debugInfo.athleteHeight.toFixed(2)}m</div>
        )}
        <div>Throw Window: {debugInfo.throwWindowActive ? 'Active' : 'Inactive'}</div>
      </div>
    </div>
  );
}