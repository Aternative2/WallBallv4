# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import base64
from datetime import datetime
import logging

from wallball_analyzer import WallBallAnalyzer
from models import WorkoutUpdate, FrameData

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active connections
active_connections = {}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    
    # Initialize analyzer for this connection
    analyzer = WallBallAnalyzer()
    active_connections[client_id] = {
        "websocket": websocket,
        "analyzer": analyzer
    }
    
    try:
        while True:
            # Receive frame from frontend
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "frame":
                # Process frame
                frame_data = FrameData(
                    image=message["data"],
                    timestamp=message["timestamp"]
                )
                
                # Analyze frame
                result = await analyzer.process_frame(frame_data)
                
                # Send update back to frontend
                update = WorkoutUpdate(
                    validSquats=result.valid_squats,
                    invalidSquats=result.invalid_squats,
                    validThrows=result.valid_throws,
                    invalidThrows=result.invalid_throws,
                    totalWallBallReps=result.total_wall_ball_reps,
                    currentState=result.current_state,
                    athleteHeight=result.athlete_height,
                    roiBox=result.roi_box,
                    debugInfo=result.debug_info
                )
                
                await websocket.send_json(update.dict())
                
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected")
        del active_connections[client_id]
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        await websocket.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}