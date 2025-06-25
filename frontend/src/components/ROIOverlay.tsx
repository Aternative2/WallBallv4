// components/ROIOverlay.tsx
import React from 'react';

interface ROIOverlayProps {
  roi: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function ROIOverlay({ roi }: ROIOverlayProps) {
  return (
    <div
      className="absolute border-4 border-green-500 rounded"
      style={{
        left: `${roi.x}px`,
        top: `${roi.y}px`,
        width: `${roi.width}px`,
        height: `${roi.height}px`,
      }}
    >
      <div className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-1 rounded text-sm">
        Ball Detection Zone
      </div>
    </div>
  );
}