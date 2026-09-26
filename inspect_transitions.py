import os, psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("""
SELECT 
    recorded_at, 
    recorded_at AT TIME ZONE 'Asia/Kolkata' AS ist_time,
    total_vehicles, 
    bikes, 
    economy, 
    commercial
FROM traffic_overview_history
WHERE recorded_at >= '2026-09-23 18:30:00+00'
ORDER BY recorded_at ASC;
""")
rows = cur.fetchall()

def show_around(idx, span=8):
    print(f"=== Around Index {idx} ===")
    for i in range(max(0, idx - span), min(len(rows), idx + span + 1)):
        r = rows[i]
        mark = " -> [TRANSITION]" if i == idx else ""
        print(f"[{i}] {r[1]} | tot={r[2]}, bikes={r[3]}, econ={r[4]}, comm={r[5]}{mark}")
    print()

show_around(11)
show_around(18)
show_around(1057)
show_around(1232)
show_around(2292)
