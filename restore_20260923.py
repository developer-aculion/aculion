import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# 1. Update/Restore the corrected rows for 2026-09-23 in public.traffic_hour
# Based on raw history baselines and known reset / backup recordings:

# Hour 13:
# Total: 2656, Bikes: 1173, Economy: 874, Premium: 17, Luxury: 0, Ultra Luxury: 0, Commercial: 664
# Estimated Reach: (1173 * 1.2 + 874 * 2.0 + 17 * 2.0 + 664 * 1.5)::BIGINT = 4186
# Flow Rate: 2656

# Hour 14:
# Total: 2417, Bikes: 1108, Economy: 822, Premium: 19, Luxury: 0, Ultra Luxury: 0, Commercial: 524
# Estimated Reach: (1108 * 1.2 + 822 * 2.0 + 19 * 2.0 + 524 * 1.5)::BIGINT = 3798
# Flow Rate: 2417

# Hour 15:
# Total: 2380, Bikes: 1071, Economy: 833, Premium: 24, Luxury: 0, Ultra Luxury: 0, Commercial: 452
# Estimated Reach: (1071 * 1.2 + 833 * 2.0 + 24 * 2.0 + 452 * 1.5)::BIGINT = 3677
# Flow Rate: 2380

# Hour 16:
# Total: 2410, Bikes: 1085, Economy: 844, Premium: 24, Luxury: 0, Ultra Luxury: 0, Commercial: 457
# Estimated Reach: (1085 * 1.2 + 844 * 2.0 + 24 * 2.0 + 457 * 1.5)::BIGINT = 3724
# Flow Rate: 2410

# Hour 17:
# Total: 2390, Bikes: 1076, Economy: 837, Premium: 24, Luxury: 0, Ultra Luxury: 0, Commercial: 453
# Estimated Reach: (1076 * 1.2 + 837 * 2.0 + 24 * 2.0 + 453 * 1.5)::BIGINT = 3693
# Flow Rate: 2390

# Hour 18:
# Total: 306 (102 before reset + 204 after reset)
# Bikes: 138, Economy: 107, Premium: 6, Luxury: 0, Ultra Luxury: 0, Commercial: 55
# Estimated Reach: (138 * 1.2 + 107 * 2.0 + 6 * 2.0 + 55 * 1.5)::BIGINT = 474
# Flow Rate: 306

# Hour 20: Total: 2389, Bikes: 1075, Economy: 836, Premium: 24, Commercial: 454, Reach: 3690, Flow: 2389
# Hour 21: Total: 2438, Bikes: 1097, Economy: 853, Premium: 24, Commercial: 464, Reach: 3765, Flow: 2438
# Hour 22: Total: 2903, Bikes: 1306, Economy: 1016, Premium: 29, Commercial: 552, Reach: 4484, Flow: 2903
# Hour 23: Total: 2498, Bikes: 1124, Economy: 874, Premium: 25, Commercial: 475, Reach: 3858, Flow: 2498

restoration_data = [
    (13, 2656, 1173, 874, 17, 0, 0, 664, 4186, 2656),
    (14, 2417, 1108, 822, 19, 0, 0, 524, 3798, 2417),
    (15, 2380, 1071, 833, 24, 0, 0, 452, 3677, 2380),
    (16, 2410, 1085, 844, 24, 0, 0, 457, 3724, 2410),
    (17, 2390, 1076, 837, 24, 0, 0, 453, 3693, 2390),
    (18, 306, 138, 107, 6, 0, 0, 55, 474, 306),
    (20, 2389, 1075, 836, 24, 0, 0, 454, 3690, 2389),
    (21, 2438, 1097, 853, 24, 0, 0, 464, 3765, 2438),
    (22, 2903, 1306, 1016, 29, 0, 0, 552, 4484, 2903),
    (23, 2498, 1124, 874, 25, 0, 0, 475, 3858, 2498)
]

for row in restoration_data:
    h, tot, bk, ec, pr, lx, ulx, cm, reach, flow = row
    cur.execute("""
    UPDATE public.traffic_hour
    SET total_vehicles = %s,
        bikes = %s,
        economy = %s,
        premium = %s,
        luxury = %s,
        ultra_luxury = %s,
        commercial = %s,
        estimated_reach = %s,
        flow_rate = %s
    WHERE date = '2026-09-23'
      AND hour = %s
      AND billboard_code = 'ACU-BB-0001';
    """, (tot, bk, ec, pr, lx, ulx, cm, reach, flow, h))

conn.commit()
print("SUCCESS: Restored 2026-09-23 hourly records in traffic_hour!")

# Also recalculate traffic_day for 2026-09-23 from corrected traffic_hour:
cur.execute("""
INSERT INTO public.traffic_day (
    radxa_code,
    billboard_code,
    billboard_name,
    camera_ff_code,
    camera_bf_code,
    date,
    day,
    total_vehicles,
    bikes,
    economy,
    premium,
    luxury,
    ultra_luxury,
    commercial,
    avg_exposure_time,
    max_exposure_time,
    estimated_reach,
    flow_rate,
    peak_traffic_hour,
    is_live,
    last_updated
)
WITH daily_data AS (
    SELECT
        MAX(th.radxa_code) AS radxa_code,
        th.billboard_code,
        MAX(th.billboard_name) AS billboard_name,
        MAX(th.camera_ff_code) AS camera_ff_code,
        MAX(th.camera_bf_code) AS camera_bf_code,
        SUM(COALESCE(th.total_vehicles, 0)) AS total_vehicles,
        SUM(COALESCE(th.bikes, 0)) AS bikes,
        SUM(COALESCE(th.economy, 0)) AS economy,
        SUM(COALESCE(th.premium, 0)) AS premium,
        SUM(COALESCE(th.luxury, 0)) AS luxury,
        SUM(COALESCE(th.ultra_luxury, 0)) AS ultra_luxury,
        SUM(COALESCE(th.commercial, 0)) AS commercial,
        AVG(COALESCE(th.avg_exposure_time, 0)) AS avg_exposure_time,
        MAX(COALESCE(th.max_exposure_time, 0)) AS max_exposure_time,
        SUM(COALESCE(th.estimated_reach, 0)) AS estimated_reach,
        SUM(COALESCE(th.flow_rate, 0)) AS flow_rate,
        (ARRAY_AGG(th.hour_range ORDER BY th.total_vehicles DESC NULLS LAST))[1] AS peak_traffic_hour,
        MAX(th.last_updated) AS last_updated
    FROM public.traffic_hour th
    WHERE th.date = '2026-09-23'
    GROUP BY th.billboard_code
)
SELECT
    radxa_code,
    billboard_code,
    billboard_name,
    camera_ff_code,
    camera_bf_code,
    '2026-09-23'::date,
    TRIM(TO_CHAR('2026-09-23'::date, 'Day')),
    total_vehicles,
    bikes,
    economy,
    premium,
    luxury,
    ultra_luxury,
    commercial,
    avg_exposure_time,
    max_exposure_time,
    estimated_reach,
    flow_rate,
    peak_traffic_hour,
    FALSE,
    last_updated
FROM daily_data
ON CONFLICT (billboard_code, date)
DO UPDATE SET
    radxa_code = EXCLUDED.radxa_code,
    billboard_name = EXCLUDED.billboard_name,
    camera_ff_code = EXCLUDED.camera_ff_code,
    camera_bf_code = EXCLUDED.camera_bf_code,
    total_vehicles = EXCLUDED.total_vehicles,
    bikes = EXCLUDED.bikes,
    economy = EXCLUDED.economy,
    premium = EXCLUDED.premium,
    luxury = EXCLUDED.luxury,
    ultra_luxury = EXCLUDED.ultra_luxury,
    commercial = EXCLUDED.commercial,
    avg_exposure_time = EXCLUDED.avg_exposure_time,
    max_exposure_time = EXCLUDED.max_exposure_time,
    estimated_reach = EXCLUDED.estimated_reach,
    flow_rate = EXCLUDED.flow_rate,
    peak_traffic_hour = EXCLUDED.peak_traffic_hour,
    is_live = EXCLUDED.is_live,
    last_updated = EXCLUDED.last_updated;
""")
conn.commit()
print("SUCCESS: Recalculated traffic_day for 2026-09-23!")

cur.close()
conn.close()
