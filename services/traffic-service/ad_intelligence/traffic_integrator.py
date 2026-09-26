"""
Traffic Intelligence Integration Layer for DOOH Advertisement Intelligence.
Correlates advertisement playback events with concurrent vehicle and audience traffic data.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor
from supabase import create_client, Client

from .models import AdPlayEvent, TrafficExposureMetrics
from .config import settings

logger = logging.getLogger("AdIntelligence.TrafficIntegrator")


class TrafficIntegrator:
    """
    Integrates advertisement playbacks with vehicle count and audience exposure data.
    """

    def __init__(
        self,
        supabase_url: str = settings.SUPABASE_URL,
        supabase_key: str = settings.SUPABASE_KEY,
        database_url: str = settings.DATABASE_URL
    ):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.database_url = database_url

        self._supabase_client: Optional[Client] = None
        if self.supabase_url and self.supabase_key:
            try:
                self._supabase_client = create_client(self.supabase_url, self.supabase_key)
            except Exception as e:
                logger.warning(f"Could not init Supabase client in TrafficIntegrator: {e}")

    def correlate_playback_with_traffic(
        self,
        event: AdPlayEvent,
        brand_name: Optional[str] = "Brand Ad",
        ad_name: Optional[str] = "Digital Creative"
    ) -> TrafficExposureMetrics:
        """
        Calculates traffic and vehicle exposure during the ad playback window [started_at, ended_at].
        """
        duration = float(event.duration_seconds or 0.0)
        if duration <= 0.0 and event.ended_at:
            duration = (event.ended_at - event.started_at).total_seconds()
        duration = max(1.0, duration)

        billboard_id = event.billboard_id
        started_at = event.started_at
        ended_at = event.ended_at or started_at

        # Default fallback traffic metrics
        base_traffic = {
            "total_vehicles": 45,
            "bikes": 22,
            "economy": 12,
            "premium": 6,
            "luxury": 4,
            "commercial": 1,
            "flow_rate": 0.75,  # vehicles / sec
            "avg_exposure_time": 8.5,
            "estimated_reach": 72
        }

        # Query latest traffic snapshot from database for this billboard
        try:
            t_data: Optional[Dict[str, Any]] = None
            if self._supabase_client:
                res = self._supabase_client.table("traffic_overview") \
                    .select("*") \
                    .eq("billboard_code", billboard_id) \
                    .order("last_updated", desc=True) \
                    .limit(1) \
                    .execute()
                
                if res.data and isinstance(res.data, list) and len(res.data) > 0:
                    first_item = res.data[0]
                    if isinstance(first_item, dict):
                        t_data = first_item
            elif self.database_url:
                with psycopg2.connect(self.database_url) as conn:
                    with conn.cursor(cursor_factory=RealDictCursor) as cur:
                        cur.execute(
                            "SELECT * FROM public.traffic_overview WHERE billboard_code = %s ORDER BY last_updated DESC LIMIT 1;",
                            (billboard_id,)
                        )
                        db_row = cur.fetchone()
                        if db_row and isinstance(db_row, dict):
                            t_data = dict(db_row)

            if t_data is not None:
                int_fields = ["total_vehicles", "bikes", "economy", "premium", "luxury", "commercial", "estimated_reach"]
                for fld in int_fields:
                    val = t_data.get(fld)
                    if isinstance(val, (int, float, str)):
                        try:
                            base_traffic[fld] = int(float(val))
                        except (ValueError, TypeError):
                            pass

                float_fields = ["flow_rate", "avg_exposure_time"]
                for fld in float_fields:
                    val = t_data.get(fld)
                    if isinstance(val, (int, float, str)):
                        try:
                            base_traffic[fld] = float(val)
                        except (ValueError, TypeError):
                            pass
        except Exception as e:
            logger.warning(f"Failed to fetch realtime traffic overview: {e}")

        # Compute proportional vehicle exposures during the playback window
        # In traffic_overview, flow_rate is stored in vehicles per minute (v/m)
        raw_flow = float(base_traffic.get("flow_rate") or 45.0)
        flow_per_sec = (raw_flow / 60.0) if raw_flow > 2.0 else raw_flow
        vehicles_passed = max(1, int(round(flow_per_sec * duration)))
        
        # Breakdown proportions
        total_veh = max(1, base_traffic["total_vehicles"])
        bike_ratio = base_traffic["bikes"] / total_veh
        cars_ratio = (base_traffic["economy"] + base_traffic["premium"] + base_traffic["luxury"]) / total_veh
        comm_ratio = base_traffic["commercial"] / total_veh

        bikes_exp = max(0, int(vehicles_passed * bike_ratio))
        cars_exp = max(0, int(vehicles_passed * cars_ratio))
        comm_exp = max(0, vehicles_passed - (bikes_exp + cars_exp))
        buses_exp = max(0, int(comm_exp * 0.4))
        trucks_exp = max(0, comm_exp - buses_exp)
        reach_est = int(vehicles_passed * 1.6)

        return TrafficExposureMetrics(
            event_id=event.event_id,
            billboard_id=billboard_id,
            creative_id=event.creative_id,
            brand_name=brand_name,
            ad_name=ad_name,
            started_at=started_at,
            ended_at=ended_at,
            duration_seconds=round(duration, 2),
            total_vehicles=vehicles_passed,
            cars_exposure=cars_exp,
            bikes_exposure=bikes_exp,
            buses_exposure=buses_exp,
            trucks_exposure=trucks_exp,
            commercial_exposure=comm_exp,
            estimated_reach=reach_est,
            avg_exposure_time=base_traffic["avg_exposure_time"]
        )
