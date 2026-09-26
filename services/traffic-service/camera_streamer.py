import os
import time
import socket
import asyncio
import logging
import threading
import datetime
from urllib.parse import urlparse

try:
    import cv2
    import numpy as np
    HAS_OPENCV = True
except ImportError:
    cv2 = None
    np = None
    HAS_OPENCV = False

logger = logging.getLogger("traffic-service.camera_streamer")
if not HAS_OPENCV:
    logger.warning("OpenCV (opencv-python-headless) is not installed. Camera streaming will operate in diagnostic standby mode.")


def mask_rtsp_url(url: str) -> str:
    """Mask password in RTSP URL for safe UI display and logs."""
    try:
        p = urlparse(url)
        if p.password:
            netloc = f"{p.username}:******@{p.hostname}"
            if p.port:
                netloc += f":{p.port}"
            return p._replace(netloc=netloc).geturl()
    except Exception:
        pass
    return url

class RTSPCameraWorker:
    def __init__(self, url: str):
        self.url = url
        self.safe_url = mask_rtsp_url(url)
        self.lock = threading.Lock()
        self.latest_frame = None
        self.last_frame_time = 0
        self.is_connected = False
        self.state = "initializing"  # "initializing", "offline", "connecting", "streaming", "auth_failed"
        self.error_message = ""
        self.last_client_access = time.time()
        self.running = True
        self.frame_count = 0
        self.fps = 0.0

        p = urlparse(url)
        self.host = p.hostname or "192.168.1.62"
        self.port = p.port or 554

        self.thread = threading.Thread(target=self._run, daemon=True, name=f"RTSPWorker-{self.host}")
        self.thread.start()

    def touch(self):
        self.last_client_access = time.time()

    def stop(self):
        self.running = False

    def _check_host(self) -> bool:
        try:
            with socket.create_connection((self.host, self.port), timeout=1.5):
                return True
        except Exception as e:
            self.error_message = f"Host {self.host}:{self.port} unreachable ({type(e).__name__})"
            return False

    def _run(self):
        logger.info(f"Started RTSP Worker for {self.safe_url}")
        
        # Set OpenCV FFmpeg RTSP options globally before capture
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|stimeout;3000000"

        while self.running:
            if not HAS_OPENCV:
                self.state = "offline"
                self.error_message = "OpenCV (opencv-python-headless) not installed."
                time.sleep(5.0)
                continue

            # 1. Verify host and port reachability
            if not self._check_host():
                self.state = "offline"
                self.is_connected = False
                with self.lock:
                    self.latest_frame = None
                time.sleep(3.0)
                continue

            # 2. Host is reachable, attempt RTSP capture
            self.state = "connecting"
            logger.info(f"Host {self.host}:{self.port} reachable. Opening RTSP capture for {self.safe_url}...")
            
            cap = None
            try:
                cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
                cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

                if not cap.isOpened():
                    self.state = "auth_failed"
                    self.error_message = f"RTSP connection rejected by {self.host}:{self.port} (Check credentials / stream path)"
                    logger.warning(self.error_message)
                    time.sleep(3.0)
                    continue

                # 3. Read loop
                consecutive_failures = 0
                fps_counter = 0
                fps_timer = time.time()

                while self.running and consecutive_failures < 25:
                    ret, frame = cap.read()
                    now = time.time()

                    if ret and frame is not None and frame.size > 0:
                        consecutive_failures = 0
                        with self.lock:
                            self.latest_frame = frame
                            self.last_frame_time = now
                            self.is_connected = True
                            self.state = "streaming"
                            self.error_message = ""
                        
                        fps_counter += 1
                        if now - fps_timer >= 2.0:
                            self.fps = round(fps_counter / (now - fps_timer), 1)
                            fps_counter = 0
                            fps_timer = now
                        
                        time.sleep(0.005)
                    else:
                        consecutive_failures += 1
                        time.sleep(0.04)

                if consecutive_failures >= 25:
                    logger.warning(f"RTSP stream dropped from {self.safe_url}.")
                    self.state = "connecting"
                    self.is_connected = False

            except Exception as ex:
                logger.error(f"Error in RTSP capture loop: {ex}")
                self.error_message = str(ex)
                self.state = "offline"
                self.is_connected = False
            finally:
                if cap is not None:
                    cap.release()
                with self.lock:
                    self.latest_frame = None

            time.sleep(2.0)

class RTSPStreamManager:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.workers = {}
        self.known_devices = [
            {
                "ip": "192.168.1.2",
                "model": "Hikvision DS-7108HGHI-M1/T",
                "mac": "bc-29-78-c7-a1-45",
                "ports": [80, 554, 8000],
                "suggested_url": "rtsp://admin:123456@192.168.1.2:554/h264/ch1/main/av_stream",
                "note": "Active on local subnet"
            }
        ]
        threading.Thread(target=self._cleanup_idle_workers, daemon=True).start()

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = RTSPStreamManager()
            return cls._instance

    def get_worker(self, url: str) -> RTSPCameraWorker:
        with self._lock:
            if url not in self.workers or not self.workers[url].running:
                self.workers[url] = RTSPCameraWorker(url)
            worker = self.workers[url]
            worker.touch()
            return worker

    def get_status(self, url: str) -> dict:
        worker = self.get_worker(url)
        return {
            "target_url": worker.safe_url,
            "raw_url": worker.url,
            "host": worker.host,
            "port": worker.port,
            "state": worker.state,
            "is_reachable": worker.state not in ("offline", "initializing"),
            "is_streaming": worker.state == "streaming",
            "fps": worker.fps,
            "last_frame_seconds_ago": round(time.time() - worker.last_frame_time, 1) if worker.last_frame_time else None,
            "error_message": worker.error_message,
            "detected_devices": self.known_devices
        }

    def _cleanup_idle_workers(self):
        while True:
            time.sleep(30)
            now = time.time()
            with self._lock:
                to_remove = []
                for url, worker in self.workers.items():
                    if now - worker.last_client_access > 120:
                        worker.stop()
                        to_remove.append(url)
                for u in to_remove:
                    del self.workers[u]

stream_manager = RTSPStreamManager.get_instance()

async def generate_mjpeg_stream(url: str):
    """
    Asynchronous generator yielding multipart JPEG frames for the browser <img> element.
    Uses asyncio.sleep() to never block the FastAPI ASGI event loop.
    If the camera is live, streams high-res camera video.
    If offline or reconnecting, streams a high-tech tactical CCTV diagnostic slate.
    """
    worker = stream_manager.get_worker(url)
    frame_count = 0

    try:
        # Fallback 1x1 black JPEG frame if OpenCV is not installed
        fallback_jpeg = (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00'
            b'\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19'
            b'\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342'
            b'\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05'
            b'\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08'
            b'\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
        )

        while True:
            worker.touch()
            if not HAS_OPENCV:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + fallback_jpeg + b'\r\n')
                await asyncio.sleep(2.0)
                continue

            now = time.time()

            # Check if we have a fresh live camera frame (< 3.0s old)
            has_live_frame = False
            current_frame = None

            with worker.lock:
                if worker.is_connected and worker.latest_frame is not None and (now - worker.last_frame_time < 3.0):
                    current_frame = worker.latest_frame.copy()
                    has_live_frame = True

            if has_live_frame and current_frame is not None:
                ret, buffer = cv2.imencode('.jpg', current_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                if ret:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                    await asyncio.sleep(0.033)  # ~30 FPS
                    continue

            # Diagnostic Slate
            frame_count += 1
            display = np.full((720, 1280, 3), (12, 16, 26), dtype=np.uint8)
            h, w, _ = display.shape
            cx, cy = w // 2, h // 2

            # Viewfinder brackets
            pad, clen = 40, 30
            # Top-left
            cv2.line(display, (pad, pad), (pad + clen, pad), (45, 75, 125), 2)
            cv2.line(display, (pad, pad), (pad, pad + clen), (45, 75, 125), 2)
            # Top-right
            cv2.line(display, (w - pad, pad), (w - pad - clen, pad), (45, 75, 125), 2)
            cv2.line(display, (w - pad, pad), (w - pad, pad + clen), (45, 75, 125), 2)
            # Bottom-left
            cv2.line(display, (pad, h - pad), (pad + clen, h - pad), (45, 75, 125), 2)
            cv2.line(display, (pad, h - pad), (pad, h - pad - clen), (45, 75, 125), 2)
            # Bottom-right
            cv2.line(display, (w - pad, h - pad), (w - pad - clen, h - pad), (45, 75, 125), 2)
            cv2.line(display, (w - pad, h - pad), (w - pad, h - pad - clen), (45, 75, 125), 2)

            # Center crosshairs
            cv2.line(display, (cx - 15, cy), (cx + 15, cy), (45, 75, 125), 1)
            cv2.line(display, (cx, cy - 15), (cx, cy + 15), (45, 75, 125), 1)

            # Header overlay
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            is_offline = worker.state in ("offline", "initializing")
            status_tag = "STANDBY" if is_offline else "CONNECTING"
            overlay_text = f"REC [{status_tag}]  {now_str}  CH01-MAIN"

            cv2.rectangle(display, (25, 25), (440, 65), (8, 11, 20), -1)
            cv2.rectangle(display, (25, 25), (440, 65), (35, 50, 80), 1)
            dot_color = (0, 140, 255) if is_offline else (0, 255, 255)
            cv2.circle(display, (45, 45), 7, dot_color, -1)
            cv2.putText(display, overlay_text, (65, 51), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

            # Center Title
            cv2.putText(display, "LIVE CAMERA STREAM", (cx - 155, cy - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2, cv2.LINE_AA)

            dot_anim = "." * ((frame_count // 6) % 4)

            if worker.state == "offline":
                # Offline state banner
                cv2.rectangle(display, (cx - 280, cy - 40), (cx + 280, cy + 85), (15, 20, 35), -1)
                cv2.rectangle(display, (cx - 280, cy - 40), (cx + 280, cy + 85), (50, 50, 180), 1)

                cv2.putText(display, f"CAMERA OFFLINE: Host {worker.host} Unreachable", (cx - 260, cy - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (80, 100, 255), 2, cv2.LINE_AA)
                cv2.putText(display, f"Target: {worker.safe_url}", (cx - 260, cy + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 190, 205), 1, cv2.LINE_AA)
                cv2.putText(display, "Verify camera hardware power & local network connection", (cx - 260, cy + 40), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (120, 140, 170), 1, cv2.LINE_AA)
                cv2.putText(display, f"Auto-reconnecting every 3s{dot_anim}", (cx - 260, cy + 65), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 215, 255), 1, cv2.LINE_AA)

                # Detected alternative note
                cv2.rectangle(display, (cx - 280, cy + 105), (cx + 280, cy + 145), (10, 28, 30), -1)
                cv2.rectangle(display, (cx - 280, cy + 105), (cx + 280, cy + 145), (0, 160, 140), 1)
                cv2.putText(display, "[NETWORK TIP] Found Hikvision device at 192.168.1.2:554", (cx - 260, cy + 130), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 235, 200), 1, cv2.LINE_AA)

            elif worker.state == "auth_failed":
                cv2.rectangle(display, (cx - 280, cy - 40), (cx + 280, cy + 70), (15, 20, 35), -1)
                cv2.rectangle(display, (cx - 280, cy - 40), (cx + 280, cy + 70), (0, 140, 255), 1)
                cv2.putText(display, "RTSP CONNECTION REJECTED", (cx - 170, cy - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 165, 255), 2, cv2.LINE_AA)
                cv2.putText(display, "Check username, password or stream path in Live View settings", (cx - 260, cy + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 210, 230), 1, cv2.LINE_AA)
                cv2.putText(display, f"Retrying stream handshake{dot_anim}", (cx - 120, cy + 48), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 215, 255), 1, cv2.LINE_AA)

            else:
                # Connecting / Initializing
                cv2.putText(display, f"Connecting to RTSP Feed{dot_anim}", (cx - 145, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (0, 215, 255), 1, cv2.LINE_AA)
                cv2.putText(display, f"Establishing video handshake with {worker.host}:{worker.port}", (cx - 200, cy + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 140, 170), 1, cv2.LINE_AA)

            ret, buffer = cv2.imencode('.jpg', display, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

            await asyncio.sleep(0.05)

    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"Stream generation loop ended: {e}")
