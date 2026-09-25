from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TrafficRecord(BaseModel):
    id: Optional[str] = None
    location_name: str
    camera_code: str
    total_vehicles: int
    bikes: int
    economy: int
    premium: int
    luxury: int
    ultra_luxury: Optional[int] = 0
    commercial: int
    avg_exposure_time: float
    max_exposure_time: float
    estimated_reach: int
    flow_rate: float
    is_live: bool = True
    last_updated: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CameraInfo(BaseModel):
    camera_code: str
    location_name: str
