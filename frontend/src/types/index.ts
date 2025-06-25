export interface WorkoutUpdate {
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
    debugInfo?: Record<string, any>;
  }
  