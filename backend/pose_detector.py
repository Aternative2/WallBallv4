# pose_detector.py
import os
import requests
import base64
import numpy as np
from typing import Optional
import logging

from models import Pose

logger = logging.getLogger(__name__)

class PoseDetector:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/Xenova/yolov8s-pose"
        self.headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_TOKEN')}"}
        
        # YOLOv8 keypoint indices
        self.KEYPOINTS = {
            'nose': 0,
            'left_shoulder': 5,
            'right_shoulder': 6,
            'left_hip': 11,
            'right_hip': 12,
            'left_knee': 13,
            'right_knee': 14,
            'left_ankle': 15,
            'right_ankle': 16
        }
    
    async def detect(self, base64_image: str) -> Optional[Pose]:
        """Detect pose keypoints from base64 image"""
        try:
            # Call Hugging Face API
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json={"inputs": base64_image},
                timeout=5
            )
            
            if response.status_code != 200:
                logger.error(f"API error: {response.status_code}")
                return None
            
            # Parse response
            detections = response.json()
            
            # Get first person detected
            if not detections or len(detections) == 0:
                return None
            
            person = detections[0]
            keypoints = person.get('keypoints', [])
            
            # Extract required keypoints
            pose = self._extract_pose(keypoints)
            return pose
            
        except Exception as e:
            logger.error(f"Pose detection error: {e}")
            return None
    
    def _extract_pose(self, keypoints) -> Optional[Pose]:
        """Extract pose data from keypoints"""
        try:
            # Get key body points
            left_hip = keypoints[self.KEYPOINTS['left_hip']]
            right_hip = keypoints[self.KEYPOINTS['right_hip']]
            left_knee = keypoints[self.KEYPOINTS['left_knee']]
            right_knee = keypoints[self.KEYPOINTS['right_knee']]
            left_ankle = keypoints[self.KEYPOINTS['left_ankle']]
            right_ankle = keypoints[self.KEYPOINTS['right_ankle']]
            nose = keypoints[self.KEYPOINTS['nose']]
            
            # Calculate centers
            hip_x = (left_hip[0] + right_hip[0]) / 2
            hip_y = (left_hip[1] + right_hip[1]) / 2
            knee_x = (left_knee[0] + right_knee[0]) / 2
            knee_y = (left_knee[1] + right_knee[1]) / 2
            ankle_x = (left_ankle[0] + right_ankle[0]) / 2
            ankle_y = (left_ankle[1] + right_ankle[1]) / 2
            
            # Calculate angles
            knee_angle = self._calculate_knee_angle(
                (hip_x, hip_y),
                (knee_x, knee_y),
                (ankle_x, ankle_y)
            )
            
            return Pose(
                hip_x=hip_x,
                hip_y=hip_y,
                knee_x=knee_x,
                knee_y=knee_y,
                ankle_x=ankle_x,
                ankle_y=ankle_y,
                head_x=nose[0],
                head_y=nose[1],
                knee_angle=knee_angle,
                confidence=min(left_hip[2], right_hip[2], left_knee[2], right_knee[2])
            )
            
        except Exception as e:
            logger.error(f"Pose extraction error: {e}")
            return None
    
    def _calculate_knee_angle(self, hip, knee, ankle):
        """Calculate knee bend angle"""
        # Vector from knee to hip
        v1 = np.array([hip[0] - knee[0], hip[1] - knee[1]])
        # Vector from knee to ankle
        v2 = np.array([ankle[0] - knee[0], ankle[1] - knee[1]])
        
        # Calculate angle
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        
        return np.degrees(angle)