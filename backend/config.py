# config.py
POSE_MODEL_URL = "https://api-inference.huggingface.co/models/Xenova/yolov8s-pose"
BALL_MODEL_URL = "https://api-inference.huggingface.co/models/hustvl/yolov5-ball"

# You can also add other constants here:
FRAME_PROCESS_RATE = 10  # Process 10 FPS
THROW_WINDOW_SECONDS = 3
MIN_CONFIDENCE_THRESHOLD = 0.5

# Keypoint mapping for pose model
KEYPOINT_MAP = {
    'nose': 0,
    'left_eye': 1,
    'right_eye': 2,
    'left_ear': 3,
    'right_ear': 4,
    'left_shoulder': 5,
    'right_shoulder': 6,
    'left_elbow': 7,
    'right_elbow': 8,
    'left_wrist': 9,
    'right_wrist': 10,
    'left_hip': 11,
    'right_hip': 12,
    'left_knee': 13,
    'right_knee': 14,
    'left_ankle': 15,
    'right_ankle': 16
}