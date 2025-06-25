# ball_detector.py
import os
import requests
import base64
import cv2
import numpy as np
from typing import Optional
import logging

from models import ROIBox, BallDetection

logger = logging.getLogger(__name__)

class BallDetector:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models/hustvl/yolov5-ball"
        self.headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_TOKEN')}"}
        
    async def detect_in_roi(self, base64_image: str, roi: ROIBox) -> Optional[BallDetection]:
        """Detect ball within region of interest"""
        try:
            # Decode image
            img_data = base64.b64decode(base64_image.split(',')[1])
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Crop to ROI
            roi_img = img[roi.y:roi.y+roi.height, roi.x:roi.x+roi.width]
            
            # Encode ROI back to base64
            _, buffer = cv2.imencode('.jpg', roi_img)
            roi_base64 = base64.b64encode(buffer).decode()
            
            # Call Hugging Face API
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json={"inputs": f"data:image/jpeg;base64,{roi_base64}"},
                timeout=5
            )
            
            if response.status_code != 200:
                logger.error(f"Ball detection API error: {response.status_code}")
                return None
            
            # Parse response
            detections = response.json()
            
            # Look for ball detection
            for detection in detections:
                if detection.get('label', '').lower() in ['ball', 'medicine ball', 'sports ball']:
                    # Convert ROI coordinates back to full image coordinates
                    x = detection['box']['xmin'] + roi.x
                    y = detection['box']['ymin'] + roi.y
                    width = detection['box']['xmax'] - detection['box']['xmin']
                    height = detection['box']['ymax'] - detection['box']['ymin']
                    
                    return BallDetection(
                        x=x,
                        y=y,
                        width=width,
                        height=height,
                        confidence=detection['score']
                    )
            
            return None
            
        except Exception as e:
            logger.error(f"Ball detection error: {e}")
            return None