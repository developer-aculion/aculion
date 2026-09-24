import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

print("=" * 100)
print("VALIDATION QUERY 1: ALL HOURS FOR 2026-09-23")
print("=" * 100)
cur.execute("""
SELECT
    date,
    hour,
    radxa_code,
    billboard_code,
    camera_ff_code,
    camera_bf_code,
    total_vehicles,
    bikes,
    economy,
    premium,
    luxury,
    ultra_luxury,
    commercial,
    estimated_reach,
    flow_rate,
    last_updated
FROM public.traffic_hour
WHERE date = '2026-09-23'
ORDER BY hour, radxa_code, billboard_code, camera_ff_code;
""")
cols = [desc[0] for desc in cur.description]
rows = cur.fetchall()
header_fmt = "{:<10} {:<5} {:<10} {:<12} {:<12} {:<12} {:<8} {:<6} {:<6} {:<5} {:<5} {:<5} {:<6} {:<8} {:<8}"
row_fmt    = "{:<10} {:<5} {:<10} {:<12} {:<12} {:<12} {:<8} {:<6} {:<6} {:<5} {:<5} {:<5} {:<6} {:<8} {:<8}"

print(header_fmt.format("Date", "Hour", "Radxa", "Billboard", "Cam FF", "Cam BF", "Total", "Bikes", "Econ", "Prem", "Lux", "ULux", "Comm", "Reach", "Flow"))
print("-" * 125)
for r in rows:
    d = dict(zip(cols, r))
    print(row_fmt.format(
        str(d["date"]), d["hour"], d["radxa_code"], d["billboard_code"],
        d["camera_ff_code"] or "", d["camera_bf_code"] or "",
        d["total_vehicles"], d["bikes"], d["economy"], d["premium"],
        d["luxury"], d["ultra_luxury"], d["commercial"],
        d["estimated_reach"], d["flow_rate"]
    ))

print("\n" + "=" * 100)
print("VALIDATION QUERY 2: SPECIFIC HOURS (13, 18) FOR 2026-09-23")
print("=" * 100)
cur.execute("""
SELECT *
FROM public.traffic_hour
WHERE date = '2026-09-23'
  AND hour IN (13, 18)
ORDER BY hour, billboard_code;
""")
cols2 = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    d = dict(zip(cols2, r))
    print(d)

print("\n" + "=" * 100)
print("VALIDATION QUERY 3: traffic_day FOR 2026-09-23")
print("=" * 100)
cur.execute("""
SELECT date, day, total_vehicles, bikes, economy, premium, luxury, ultra_luxury, commercial, estimated_reach, flow_rate, peak_traffic_hour
FROM public.traffic_day
WHERE date = '2026-09-23';
""")
cols3 = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    print(dict(zip(cols3, r)))

cur.close()
conn.close()
