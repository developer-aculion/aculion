import os
import asyncio
import json
import logging
import socket
import time
import datetime
from urllib.parse import urlparse
from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import StreamingResponse
from realtime_manager import manager, MOCK_CAMERAS, generate_mock_record
import schemas

logger = logging.getLogger("traffic-service.routes")
router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "realtime_active": manager.is_running,
        "clients_connected": len(manager.queues)
    }

@router.get("/traffic/cameras", response_model=List[schemas.CameraInfo])
def get_cameras():
    return MOCK_CAMERAS

@router.get("/traffic/latest", response_model=schemas.TrafficRecord)
def get_latest_traffic(camera_code: str = Query(..., description="Camera code to filter by")):
    try:
        # Check if we have a simulated record in memory
        record = manager.last_records.get(camera_code)
        if not record:
            record = generate_mock_record(camera_code)
            manager.last_records[camera_code] = record
        return record
    except Exception as e:
        logger.error(f"Error fetching latest traffic for {camera_code}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/traffic/stream")
async def traffic_stream(request: Request, camera_code: Optional[str] = Query(None, description="Optional camera code filter")):
    queue = asyncio.Queue()
    manager.register(queue)
    
    async def event_generator():
        try:
            # Yield initial snapshot if camera_code is specified
            if camera_code:
                try:
                    record = manager.last_records.get(camera_code)
                    if not record:
                        record = generate_mock_record(camera_code)
                        manager.last_records[camera_code] = record
                    serialized = manager._serialize_record(record)
                    yield f"data: {json.dumps(serialized)}\n\n"
                except Exception as ex:
                    logger.error(f"Error fetching initial record for stream: {ex}")
            
            # Streaming loop
            while True:
                if await request.is_disconnected():
                    break
                
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=1.0)
                    if camera_code:
                        parsed = json.loads(msg)
                        if parsed.get("camera_code") == camera_code:
                            yield f"data: {msg}\n\n"
                    else:
                        yield f"data: {msg}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive event
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            manager.unregister(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

from camera_streamer import stream_manager, generate_mjpeg_stream, mask_rtsp_url

PRIVATE_RTSP_URL = os.getenv("RTSP_CAMERA_URL", "rtsp://admin:123456@192.168.1.62:554/h264/ch1/main/av_stream")

@router.get("/traffic/camera/status")
def get_camera_status(url: Optional[str] = Query(None, description="Camera RTSP URL to check")):
    """
    Returns real-time connectivity status, streaming metrics, host reachability,
    and discovered local cameras for the specified RTSP feed.
    """
    target_url = url or PRIVATE_RTSP_URL
    return stream_manager.get_status(target_url)

@router.get("/traffic/camera/live-stream")
def get_camera_stream(url: Optional[str] = Query(None, include_in_schema=False)):
    """
    Connects to the RTSP camera feed via OpenCV and streams live MJPEG multipart frames for browser display.
    Keeps camera IP and credentials completely private on the backend.
    Seamlessly streams live surveillance video with live timestamps and auto-reconnects to the physical camera.
    """
    target_url = url or PRIVATE_RTSP_URL
    return StreamingResponse(
        generate_mjpeg_stream(target_url),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )



