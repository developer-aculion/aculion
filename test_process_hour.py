import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Test process_traffic_hour for 2026-09-24 09:00 IST (where history rows exist)
cur.execute("SELECT public.process_traffic_hour('2026-09-24 09:00:00+05:30'::timestamptz);")
conn.commit()

cur.execute("""
SELECT date, hour, billboard_code, camera_ff_code, camera_bf_code,
       total_vehicles, bikes, economy, premium, luxury, ultra_luxury, commercial,
       estimated_reach, flow_rate, last_updated
FROM public.traffic_hour
WHERE date = '2026-09-24' AND hour = 9;
""")
cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols, r)))

cur.close()
conn.close()
