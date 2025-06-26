Perfect! Based on your frontend structure and requirements, here's the **simplified architecture** for your wall ball counter prototype:

## **Simplified System Architecture**

```
Next.js Frontend ↔ WebSocket ↔ Python Backend ↔ Hugging Face API
    (Camera + UI)              (Analysis Engine)    (YOLOv8 + YOLO-World)
```

## **Core Logic Flow**

### **1. Sequential Exercise Detection**
```
Standing Position → Squat Analysis → Ball Throw Window → Wall Ball Scoring
```

### **2. State Machine**
```
READY → SQUATTING → THROW_WINDOW → SCORING → READY
```

## **Detailed Component Architecture**

### **Frontend (Your Existing Next.js App)**

#### **A. Core Components** (Already exist, minimal changes needed)
- **CameraView.tsx**: Capture frames + display overlays
- **StatsPanel.tsx**: Display the 5 counters
- **VideoControls.tsx**: Camera/video source selection
- **PoseOverlay.tsx**: Show skeleton + ROI box

#### **B. Data Flow**
```typescript
// WebSocket messages
interface WorkoutUpdate {
  validSquats: number;
  invalidSquats: number; 
  validThrows: number;
  invalidThrows: number;
  totalWallBallReps: number;
  currentState: 'ready' | 'squatting' | 'throw_window' | 'scoring';
  athleteHeight?: number;
  roiBox?: {x: number, y: number, width: number, height: number};
}
```

### **Backend (Minimal Python FastAPI)**

#### **A. Core Classes**
```python
class AthleteState:
    - position: 'standing' | 'squatting' | 'transitioning'
    - hip_position: float
    - knee_position: float  
    - height_estimate: float
    - head_position: {x, y}

class WallBallAnalyzer:
    - valid_squats: int
    - invalid_squats: int
    - valid_throws: int
    - invalid_throws: int
    - total_reps: int
    - current_state: State
    - throw_window_start: timestamp
```

#### **B. Analysis Pipeline**
```python
1. detect_athlete_pose(frame) → pose_keypoints
2. analyze_squat_phase(pose) → squat_status
3. if squat_detected: start_throw_window()
4. analyze_ball_throw(frame, roi) → throw_status  
5. score_wall_ball_rep()
```

## **Simplified Detection Logic**

### **1. Athlete Standing Detection**
```python
def is_athlete_standing(pose):
    # Ensure person is upright and stable
    - both_feet_on_ground()
    - torso_vertical() 
    - knee_angle > 160°
    - hip_above_knee()
```

### **2. Squat Analysis**
```python
def analyze_squat(pose):
    hip_y = pose.hip.y
    knee_y = pose.knee.y
    
    if movement_started and hip_y > knee_y:
        return "valid_squat"
    elif movement_started and hip_stops_before_knee():
        return "invalid_squat" 
    else:
        return "no_squat"
```

### **3. Ball Throw Analysis (3-second window)**
```python
def analyze_throw_in_roi(frame, athlete_head_pos, athlete_height):
    # ROI: box above athlete's head
    roi = create_roi_above_head(athlete_head_pos)
    
    # Detect ball in ROI
    ball_position = detect_ball_in_roi(frame, roi)
    
    if ball_height >= 1.7 * athlete_height:
        return "valid_throw"
    elif ball_height >= 1.0 * athlete_height:
        return "invalid_throw"
    else:
        return "no_throw"
```

## **Minimal API Design**

### **Hugging Face Integration**
```python
# Only 2 API calls per frame
1. YOLOv8-Pose → get athlete pose keypoints
2. YOLO-World → detect medicine ball (only during throw window)
```

### **WebSocket Messages**
```json
// Frontend → Backend
{
  "type": "frame",
  "data": "base64_image",
  "timestamp": 1234567890
}

// Backend → Frontend  
{
  "type": "update",
  "validSquats": 5,
  "invalidSquats": 2,
  "validThrows": 4,
  "invalidThrows": 1,
  "totalWallBallReps": 4,
  "currentState": "throw_window",
  "debugInfo": {
    "hipPosition": 0.65,
    "kneePosition": 0.7,
    "athleteHeight": 1.75,
    "ballDetected": true
  }
}
```

## **Minimal File Structure**

### **Backend Structure**
```
backend/
├── main.py                 # FastAPI app + WebSocket
├── wallball_analyzer.py    # Core analysis logic
├── pose_detector.py        # YOLOv8 pose detection
├── ball_detector.py        # YOLO-World ball detection  
├── models.py              # Data models
└── requirements.txt
```

### **Frontend Integration Points**
```typescript
// hooks/useWallBallCounter.ts
export function useWallBallCounter() {
  // WebSocket connection
  // Frame sending logic
  // State management
}

// components/WallBallAnalyzer.tsx  
// Combines CameraView + StatsPanel + overlays
```

## **Simplified State Management**

### **Exercise State Machine**
```python
class ExerciseState(Enum):
    READY = "ready"           # Waiting for athlete
    SQUATTING = "squatting"   # Squat in progress
    THROW_WINDOW = "throw_window"  # 3sec window after squat
    SCORING = "scoring"       # Processing rep completion

def transition_state(current_state, event):
    if current_state == READY and event == "squat_started":
        return SQUATTING
    elif current_state == SQUATTING and event == "squat_completed":
        return THROW_WINDOW  
    elif current_state == THROW_WINDOW and event == "throw_detected":
        return SCORING
    elif current_state == THROW_WINDOW and event == "timeout_3sec":
        return READY
    # etc...
```

## **Performance Optimizations** 

### **Frame Processing**
- **10 FPS processing** (every 3rd frame at 30fps)
- **Ball detection only during throw window** (reduce API calls by 70%)
- **Single person tracking** (no multi-person complexity)
- **ROI-based ball detection** (smaller image region = faster)

### **Cost Optimization**
```python
# Estimated API calls per workout session
- Pose detection: 10 calls/second × 60 seconds = 600 calls
- Ball detection: 10 calls/second × 3 seconds × 5 reps = 150 calls  
- Total: ~750 calls/session ≈ $0.045/session
```

## **Error Handling (Minimal)**
- **Missing pose data**: Skip frame, continue
- **API timeout**: Use last known pose, continue  
- **No athlete detected**: Reset to READY state
- **WebSocket disconnect**: Auto-reconnect

## **Development Phases**

### **Phase 1: Basic Pose Detection**
1. WebSocket connection Frontend ↔ Backend
2. YOLOv8 pose detection integration
3. Basic squat counting (valid/invalid)

### **Phase 2: Ball Tracking**
1. YOLO-World ball detection in ROI
2. 3-second throw window logic
3. Height-based throw validation

### **Phase 3: Wall Ball Scoring**
1. Sequential squat → throw detection
2. Wall ball rep counting
3. UI polish + debug overlays

## **Integration with Your Existing Code**

### **Minimal Changes Needed**
1. **useWebSocket.ts**: Connect to Python backend instead of MediaPipe
2. **StatsPanel.tsx**: Update to show 5 counters (already seems correct)
3. **PoseOverlay.tsx**: Add ROI box visualization
4. **CameraView.tsx**: Send frames via WebSocket

### **New Components Needed**
```typescript
// hooks/useWallBallAnalyzer.ts - Main workout logic
// components/ROIOverlay.tsx - Show throw region
// types/wallball.ts - Type definitions
```

This simplified architecture focuses on your exact requirements while leveraging your existing Next.js structure.