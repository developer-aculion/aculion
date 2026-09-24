import os, psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Check column types
cur.execute("""
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'traffic_overview_history'
ORDER BY ordinal_position;
""")
print("=== traffic_overview_history column types ===")
for r in cur.fetchall():
    print(r)
print()

# Check recorded_at timestamps for 2026-09-24
cur.execute("""
SELECT 
    date_trunc('hour', recorded_at AT TIME ZONE 'Asia/Kolkata') AS ist_hour,
    EXTRACT(HOUR FROM recorded_at AT TIME ZONE 'Asia/Kolkata') AS hour_num,
    COUNT(*) AS row_count,
    MIN(recorded_at) AS min_recorded_at,
    MAX(recorded_at) AS max_recorded_at,
    MIN(total_vehicles) AS min_veh,
    MAX(total_vehicles) AS max_veh
FROM traffic_overview_history
GROUP BY 1, 2
ORDER BY 1;
""")
print("=== traffic_overview_history rows grouped by IST hour ===")
for r in cur.fetchall():
    print(r)
print()

# Check traffic_hour rows
cur.execute("""
SELECT 
    date, hour, hour_range, total_vehicles, bikes, economy, commercial, is_live, created_at, last_updated
FROM traffic_hour
WHERE date >= '2026-09-23'
ORDER BY date ASC, hour ASC;
""")
print("=== traffic_hour rows (2026-09-23 & 2026-09-24) ===")
for r in cur.fetchall():
    print(r)
print()
