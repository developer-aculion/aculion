import os, psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get all history rows for 2026-09-24
cur.execute("""
SELECT 
    recorded_at, 
    recorded_at AT TIME ZONE 'Asia/Kolkata' AS ist_time,
    total_vehicles, 
    bikes, 
    economy, 
    premium,
    luxury,
    ultra_luxury,
    commercial
FROM traffic_overview_history
WHERE recorded_at >= '2026-09-23 18:30:00+00'
ORDER BY recorded_at ASC;
""")
rows = cur.fetchall()
print(f"Total history snapshots for today: {len(rows)}")

# Find all places where total_vehicles or any category decreased or changed drastically
print("\n=== Transitions with counter decreases or jumps ===")
for i in range(1, len(rows)):
    prev = rows[i-1]
    curr = rows[i]
    dt_prev = prev[2]
    dt_curr = curr[2]
    diff = dt_curr - dt_prev
    if diff < 0 or diff > 50:
        print(f"Index {i} at {curr[1]}: prev_tot={dt_prev}, curr_tot={dt_curr}, diff={diff} | prev_bikes={prev[3]}, curr_bikes={curr[3]}")
