// components/StateIndicator.tsx
import React from 'react';

interface StateIndicatorProps {
  state: 'ready' | 'squatting' | 'throw_window' | 'scoring';
}

const stateConfig = {
  ready: { color: 'bg-gray-500', text: 'Ready' },
  squatting: { color: 'bg-blue-500', text: 'Squatting' },
  throw_window: { color: 'bg-green-500', text: 'Throw Ball!' },
  scoring: { color: 'bg-yellow-500', text: 'Scoring' },
};

export function StateIndicator({ state }: StateIndicatorProps) {
  const config = stateConfig[state];
  
  return (
    <div className="absolute bottom-4 left-4">
      <div className={`px-4 py-2 rounded-full ${config.color} text-white font-semibold`}>
        {config.text}
      </div>
    </div>
  );
}