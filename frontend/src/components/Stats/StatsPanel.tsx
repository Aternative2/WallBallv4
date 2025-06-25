// Update StatsPanel.tsx to use the new props
interface StatsPanelProps {
  validSquats: number;
  invalidSquats: number;
  validThrows: number;
  invalidThrows: number;
  totalWallBallReps: number;
}

export function StatsPanel({
  validSquats,
  invalidSquats,
  validThrows,
  invalidThrows,
  totalWallBallReps,
}: StatsPanelProps) {
  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Wall Ball Counter</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Valid Squats:</span>
          <span className="font-mono text-green-400">{validSquats}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Invalid Squats:</span>
          <span className="font-mono text-red-400">{invalidSquats}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Valid Throws:</span>
          <span className="font-mono text-green-400">{validThrows}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Invalid Throws:</span>
          <span className="font-mono text-red-400">{invalidThrows}</span>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between text-xl">
            <span>Total Wall Ball Reps:</span>
            <span className="font-mono text-yellow-400">{totalWallBallReps}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
