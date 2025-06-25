# models.py
from pydantic import BaseModel
from typing import Optional, Dict, Any

class Pose(BaseModel):
    hip_x: float
    hip_y: float
    knee_x: float
    knee_y: float
    ankle_x: float
    ankle_y: float
    head_x: float
    head_y: float
    knee_angle: float
    confidence: float

class ROIBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class BallDetection(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float

class FrameData(BaseModel):
    image: str  # base64 encoded
    timestamp: int

class WorkoutUpdate(BaseModel):
    validSquats: int
    invalidSquats: int
    validThrows: int
    invalidThrows: int
    totalWallBallReps: int
    currentState: str
    athleteHeight: Optional[float] = None
    roiBox: Optional[ROIBox] = None
    debugInfo: Optional[Dict[str, Any]] = {}

class AnalysisResult(BaseModel):
    valid_squats: int
    invalid_squats: int
    valid_throws: int
    invalid_throws: int
    total_wall_ball_reps: int
    current_state: str
    athlete_height: Optional[float] = None
    roi_box: Optional[ROIBox] = None
    debug_info: Dict[str, Any] = {}