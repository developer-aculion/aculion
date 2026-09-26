import os, psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Let's inspect the exact rows in traffic_overview_history around hour 11 and 12
cur.execute("""
SELECT 
    recorded_at, 
    recorded_at AT TIME ZONE 'Asia/Kolkata' AS ist_time,
    total_vehicles, 
    bikes, 
    economy, 
    commercial
FROM traffic_overview_history
WHERE recorded_at >= '2026-09-24 05:30:00+00' AND recorded_at < '2026-09-24 07:30:00+00'
ORDER BY recorded_at ASC
LIMIT 40;
""")
print("=== First 40 rows of history for hours 11 & 12 IST ===")
for r in cur.fetchall():
    print(r)
print()

# Check latest 40 rows of history
cur.execute("""
SELECT 
    recorded_at, 
    recorded_at AT TIME ZONE 'Asia/Kolkata' AS ist_time,
    total_vehicles, 
    bikes, 
    economy, 
    commercial
FROM traffic_overview_history
ORDER BY recorded_at DESC
LIMIT 40;
""")
print("=== Latest 40 rows of history ===")
for r in cur.fetchall():
    print(r)
print()
