import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

print("=" * 80)
print("COMPARING traffic_hour vs traffic_hour_backup_20260923 FOR 2026-09-23")
print("=" * 80)

cur.execute("""
SELECT 
    th.hour,
    th.total_vehicles AS cur_total,
    bk.total_vehicles AS bak_total,
    th.bikes AS cur_bikes,
    bk.bikes AS bak_bikes,
    th.economy AS cur_economy,
    bk.economy AS bak_economy,
    th.commercial AS cur_commercial,
    bk.commercial AS bak_commercial,
    th.estimated_reach AS cur_reach,
    bk.estimated_reach AS bak_reach
FROM public.traffic_hour th
LEFT JOIN public.traffic_hour_backup_20260923 bk
  ON th.radxa_code = bk.radxa_code
 AND th.billboard_code = bk.billboard_code
 AND th.camera_ff_code = bk.camera_ff_code
 AND th.camera_bf_code = bk.camera_bf_code
 AND th.date = bk.date
 AND th.hour = bk.hour
WHERE th.date = '2026-09-23'
ORDER BY th.hour;
""")

cols = [desc[0] for desc in cur.description]
for r in cur.fetchall():
    row = dict(zip(cols, r))
    print(f"Hour {row['hour']:02d}: Total: {row['cur_total']} (bak: {row['bak_total']}) | Bikes: {row['cur_bikes']} (bak: {row['bak_bikes']}) | Econ: {row['cur_economy']} (bak: {row['bak_economy']}) | Comm: {row['cur_commercial']} (bak: {row['bak_commercial']})")

cur.close()
conn.close()
