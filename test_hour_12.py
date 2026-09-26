import os, psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Test process_traffic_hour for hour 12
cur.execute("SELECT public.process_traffic_hour('2026-09-24 12:00:00+05:30');")
conn.commit()

cur.execute("""
SELECT 
    date, hour, hour_range, total_vehicles, bikes, economy, commercial, is_live, created_at, last_updated
FROM traffic_hour
WHERE date = '2026-09-24' AND hour = 12;
""")
print("=== Result for hour 12 ===")
row = cur.fetchone()
print(row)
