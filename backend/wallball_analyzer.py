# wallball_analyzer.py
import numpy as np
from enum import Enum
from datetime import datetime, timedelta
import asyncio
from typing import Optional, Dict, Any

from pose_detector import PoseDetector
from ball_detector import BallDetector
from models import AnalysisResult, ROIBox, Pose

class ExerciseState(Enum):
    READY = "ready"
    SQUATTING = "squatting"
    THROW_WINDOW = "throw_window"
    SCORING = "scoring"

class WallBallAnalyzer:
    def __init__(self):
        self.pose_detector = PoseDetector()
        self.ball_detector = BallDetector()
        
        # Counters
        self.valid_squats = 0
        self.invalid_squats = 0
        self.valid_throws = 0
        self.invalid_throws = 0
        self.total_wall_ball_reps = 0
        
        # State management
        self.current_state = ExerciseState.READY
        self.throw_window_start = None
        self.last_squat_valid = False
        
        # Athlete tracking
        self.athlete_height = None
        self.standing_hip_height = None
        self.last_pose = None
        
    async def process_frame(self, frame_data) -> AnalysisResult:
        """Main processing pipeline for each frame"""
        
        # 1. Detect pose
        pose = await self.pose_detector.detect(frame_data.image)
        
        if not pose:
            return self._create_result()
        
        # 2. Estimate athlete height on first detection
        if not self.athlete_height:
            self.athlete_height = self._estimate_height(pose)
            self.standing_hip_height = pose.hip_y
        
        # 3. Process based on current state
        if self.current_state == ExerciseState.READY:
            await self._process_ready_state(pose)
            
        elif self.current_state == ExerciseState.SQUATTING:
            await self._process_squatting_state(pose)
            
        elif self.current_state == ExerciseState.THROW_WINDOW:
            await self._process_throw_window(frame_data, pose)
            
        elif self.current_state == ExerciseState.SCORING:
            await self._process_scoring_state()
        
        self.last_pose = pose
        return self._create_result(pose)
    
    async def _process_ready_state(self, pose: Pose):
        """Wait for squat to start"""
        if self._is_squat_starting(pose):
            self.current_state = ExerciseState.SQUATTING
    
    async def _process_squatting_state(self, pose: Pose):
        """Analyze squat depth"""
        squat_status = self._analyze_squat(pose)
        
        if squat_status == "valid_squat":
            self.valid_squats += 1
            self.last_squat_valid = True
            self.current_state = ExerciseState.THROW_WINDOW
            self.throw_window_start = datetime.now()
            
        elif squat_status == "invalid_squat":
            self.invalid_squats += 1
            self.last_squat_valid = False
            self.current_state = ExerciseState.READY
    
    async def _process_throw_window(self, frame_data, pose: Pose):
        """3-second window to detect ball throw"""
        # Check timeout
        if datetime.now() - self.throw_window_start > timedelta(seconds=3):
            self.current_state = ExerciseState.READY
            return
        
        # Create ROI above athlete's head
        roi = self._create_roi_above_head(pose)
        
        # Detect ball in ROI
        ball_detected = await self.ball_detector.detect_in_roi(
            frame_data.image, 
            roi
        )
        
        if ball_detected:
            throw_height = ball_detected.y - pose.head_y
            min_height = 0.7 * self.athlete_height  # 70% of athlete height
            
            if throw_height >= min_height:
                self.valid_throws += 1
                if self.last_squat_valid:
                    self.total_wall_ball_reps += 1
            else:
                self.invalid_throws += 1
            
            self.current_state = ExerciseState.SCORING
    
    async def _process_scoring_state(self):
        """Brief pause after scoring before returning to ready"""
        await asyncio.sleep(0.5)
        self.current_state = ExerciseState.READY
    
    def _is_squat_starting(self, pose: Pose) -> bool:
        """Detect if athlete is starting to squat"""
        if not self.last_pose:
            return False
        
        # Hip moving down relative to standing position
        hip_descent = self.standing_hip_height - pose.hip_y
        return hip_descent > 0.05 * self.athlete_height
    
    def _analyze_squat(self, pose: Pose) -> str:
        """Determine if squat is valid based on hip-knee position"""
        # Check if hip is below knee (parallel or deeper)
        if pose.hip_y > pose.knee_y:
            return "valid_squat"
        
        # Check if returning to standing from partial squat
        if self.last_pose and pose.hip_y < self.last_pose.hip_y:
            hip_descent = self.standing_hip_height - self.last_pose.hip_y
            if hip_descent > 0.2 * self.athlete_height:
                return "invalid_squat"
        
        return "no_squat"
    
    def _estimate_height(self, pose: Pose) -> float:
        """Estimate athlete height from pose keypoints"""
        # Simple estimation: ankle to head distance
        height = abs(pose.head_y - pose.ankle_y)
        return height * 1.1  # Add 10% for head above keypoint
    
    def _create_roi_above_head(self, pose: Pose) -> ROIBox:
        """Create region of interest above athlete's head"""
        roi_height = 0.5 * self.athlete_height
        roi_width = 0.4 * self.athlete_height
        
        return ROIBox(
            x=int(pose.head_x - roi_width/2),
            y=int(pose.head_y - roi_height - 0.1*self.athlete_height),
            width=int(roi_width),
            height=int(roi_height)
        )
    
    def _create_result(self, pose: Optional[Pose] = None) -> AnalysisResult:
        """Create analysis result for current state"""
        roi_box = None
        if pose and self.current_state == ExerciseState.THROW_WINDOW:
            roi_box = self._create_roi_above_head(pose)
        
        debug_info = {}
        if pose:
            debug_info = {
                "hipPosition": pose.hip_y,
                "kneePosition": pose.knee_y,
                "athleteHeight": self.athlete_height,
                "throwWindowActive": self.current_state == ExerciseState.THROW_WINDOW
            }
        
        return AnalysisResult(
            valid_squats=self.valid_squats,
            invalid_squats=self.invalid_squats,
            valid_throws=self.valid_throws,
            invalid_throws=self.invalid_throws,
            total_wall_ball_reps=self.total_wall_ball_reps,
            current_state=self.current_state.value,
            athlete_height=self.athlete_height,
            roi_box=roi_box,
            debug_info=debug_info
        )