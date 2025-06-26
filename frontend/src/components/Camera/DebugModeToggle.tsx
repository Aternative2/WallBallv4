import React from 'react';

interface DebugModeToggleProps {
  isDebugMode: boolean;
  onToggle: () => void;
}

export default function DebugModeToggle({ isDebugMode, onToggle }: DebugModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        padding: '12px 20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: isDebugMode ? '#4ade80' : '#888',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 10
      }}
    >
      {isDebugMode ? 'Debug On' : 'Debug Off'}
    </button>
  );
}
