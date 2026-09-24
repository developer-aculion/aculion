import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# 1. Create public.process_traffic_hour(p_hour_start timestamptz)
process_traffic_hour_sql = """
CREATE OR REPLACE FUNCTION public.process_traffic_hour(p_hour_start timestamptz)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_hour_start TIMESTAMPTZ;
    v_hour_end   TIMESTAMPTZ;
    v_date       DATE;
    v_hour       SMALLINT;
    v_hour_range TEXT;
BEGIN
    /*
     * p_hour_start represents the beginning of the target hour in Asia/Kolkata.
     */
    v_hour_start := date_trunc('hour', p_hour_start AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
    v_hour_end   := v_hour_start + INTERVAL '1 hour';
    v_date       := (v_hour_start AT TIME ZONE 'Asia/Kolkata')::DATE;
    v_hour       := EXTRACT(HOUR FROM (v_hour_start AT TIME ZONE 'Asia/Kolkata'))::SMALLINT;
    v_hour_range := LPAD(v_hour::TEXT, 2, '0') || ':00 - ' || LPAD(v_hour::TEXT, 2, '0') || ':59';

    WITH history_windowed AS (
        SELECT
            h.*,
            -- Lookbehind & lookahead for total_vehicles
            LAG(h.total_vehicles, 1) OVER w AS p1_total_vehicles,
            LAG(h.total_vehicles, 2) OVER w AS p2_total_vehicles,
            LAG(h.total_vehicles, 3) OVER w AS p3_total_vehicles,
            LEAD(h.total_vehicles, 1) OVER w AS l1_total_vehicles,
            LEAD(h.total_vehicles, 2) OVER w AS l2_total_vehicles,
            LEAD(h.total_vehicles, 3) OVER w AS l3_total_vehicles,

            -- Lookbehind & lookahead for bikes
            LAG(h.bikes, 1) OVER w AS p1_bikes,
            LAG(h.bikes, 2) OVER w AS p2_bikes,
            LAG(h.bikes, 3) OVER w AS p3_bikes,
            LEAD(h.bikes, 1) OVER w AS l1_bikes,
            LEAD(h.bikes, 2) OVER w AS l2_bikes,
            LEAD(h.bikes, 3) OVER w AS l3_bikes,

            -- Lookbehind & lookahead for economy
            LAG(h.economy, 1) OVER w AS p1_economy,
            LAG(h.economy, 2) OVER w AS p2_economy,
            LAG(h.economy, 3) OVER w AS p3_economy,
            LEAD(h.economy, 1) OVER w AS l1_economy,
            LEAD(h.economy, 2) OVER w AS l2_economy,
            LEAD(h.economy, 3) OVER w AS l3_economy,

            -- Lookbehind & lookahead for premium
            LAG(h.premium, 1) OVER w AS p1_premium,
            LAG(h.premium, 2) OVER w AS p2_premium,
            LAG(h.premium, 3) OVER w AS p3_premium,
            LEAD(h.premium, 1) OVER w AS l1_premium,
            LEAD(h.premium, 2) OVER w AS l2_premium,
            LEAD(h.premium, 3) OVER w AS l3_premium,

            -- Lookbehind & lookahead for luxury
            LAG(h.luxury, 1) OVER w AS p1_luxury,
            LAG(h.luxury, 2) OVER w AS p2_luxury,
            LAG(h.luxury, 3) OVER w AS p3_luxury,
            LEAD(h.luxury, 1) OVER w AS l1_luxury,
            LEAD(h.luxury, 2) OVER w AS l2_luxury,
            LEAD(h.luxury, 3) OVER w AS l3_luxury,

            -- Lookbehind & lookahead for ultra_luxury
            LAG(h.ultra_luxury, 1) OVER w AS p1_ultra_luxury,
            LAG(h.ultra_luxury, 2) OVER w AS p2_ultra_luxury,
            LAG(h.ultra_luxury, 3) OVER w AS p3_ultra_luxury,
            LEAD(h.ultra_luxury, 1) OVER w AS l1_ultra_luxury,
            LEAD(h.ultra_luxury, 2) OVER w AS l2_ultra_luxury,
            LEAD(h.ultra_luxury, 3) OVER w AS l3_ultra_luxury,

            -- Lookbehind & lookahead for commercial
            LAG(h.commercial, 1) OVER w AS p1_commercial,
            LAG(h.commercial, 2) OVER w AS p2_commercial,
            LAG(h.commercial, 3) OVER w AS p3_commercial,
            LEAD(h.commercial, 1) OVER w AS l1_commercial,
            LEAD(h.commercial, 2) OVER w AS l2_commercial,
            LEAD(h.commercial, 3) OVER w AS l3_commercial
        FROM public.traffic_overview_history h
        WHERE h.recorded_at >= v_hour_start - INTERVAL '10 minutes'
          AND h.recorded_at <  v_hour_end + INTERVAL '10 minutes'
        WINDOW w AS (
            PARTITION BY
                h.radxa_code,
                h.billboard_code,
                h.camera_ff_code,
                h.camera_bf_code
            ORDER BY h.recorded_at
        )
    ),
    history_classified AS (
        SELECT
            w.*,
            -- Dips detection for total_vehicles
            CASE
                WHEN p1_total_vehicles IS NOT NULL AND total_vehicles < p1_total_vehicles AND (l1_total_vehicles >= p1_total_vehicles OR l2_total_vehicles >= p1_total_vehicles OR l3_total_vehicles >= p1_total_vehicles) THEN TRUE
                WHEN p2_total_vehicles IS NOT NULL AND total_vehicles < p2_total_vehicles AND (l1_total_vehicles >= p2_total_vehicles OR l2_total_vehicles >= p2_total_vehicles OR l3_total_vehicles >= p2_total_vehicles) THEN TRUE
                ELSE FALSE
            END AS is_dip_total_vehicles,
            CASE
                WHEN p2_total_vehicles IS NOT NULL AND p1_total_vehicles < p2_total_vehicles AND (total_vehicles >= p2_total_vehicles OR l1_total_vehicles >= p2_total_vehicles OR l2_total_vehicles >= p2_total_vehicles) THEN TRUE
                WHEN p3_total_vehicles IS NOT NULL AND p1_total_vehicles < p3_total_vehicles AND (total_vehicles >= p3_total_vehicles OR l1_total_vehicles >= p3_total_vehicles OR l2_total_vehicles >= p3_total_vehicles) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_total_vehicles,
            CASE
                WHEN p3_total_vehicles IS NOT NULL AND p2_total_vehicles < p3_total_vehicles AND (p1_total_vehicles >= p3_total_vehicles OR total_vehicles >= p3_total_vehicles OR l1_total_vehicles >= p3_total_vehicles) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_total_vehicles,

            -- Dips detection for bikes
            CASE
                WHEN p1_bikes IS NOT NULL AND bikes < p1_bikes AND (l1_bikes >= p1_bikes OR l2_bikes >= p1_bikes OR l3_bikes >= p1_bikes) THEN TRUE
                WHEN p2_bikes IS NOT NULL AND bikes < p2_bikes AND (l1_bikes >= p2_bikes OR l2_bikes >= p2_bikes OR l3_bikes >= p2_bikes) THEN TRUE
                ELSE FALSE
            END AS is_dip_bikes,
            CASE
                WHEN p2_bikes IS NOT NULL AND p1_bikes < p2_bikes AND (bikes >= p2_bikes OR l1_bikes >= p2_bikes OR l2_bikes >= p2_bikes) THEN TRUE
                WHEN p3_bikes IS NOT NULL AND p1_bikes < p3_bikes AND (bikes >= p3_bikes OR l1_bikes >= p3_bikes OR l2_bikes >= p3_bikes) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_bikes,
            CASE
                WHEN p3_bikes IS NOT NULL AND p2_bikes < p3_bikes AND (p1_bikes >= p3_bikes OR bikes >= p3_bikes OR l1_bikes >= p3_bikes) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_bikes,

            -- Dips detection for economy
            CASE
                WHEN p1_economy IS NOT NULL AND economy < p1_economy AND (l1_economy >= p1_economy OR l2_economy >= p1_economy OR l3_economy >= p1_economy) THEN TRUE
                WHEN p2_economy IS NOT NULL AND economy < p2_economy AND (l1_economy >= p2_economy OR l2_economy >= p2_economy OR l3_economy >= p2_economy) THEN TRUE
                ELSE FALSE
            END AS is_dip_economy,
            CASE
                WHEN p2_economy IS NOT NULL AND p1_economy < p2_economy AND (economy >= p2_economy OR l1_economy >= p2_economy OR l2_economy >= p2_economy) THEN TRUE
                WHEN p3_economy IS NOT NULL AND p1_economy < p3_economy AND (economy >= p3_economy OR l1_economy >= p3_economy OR l2_economy >= p3_economy) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_economy,
            CASE
                WHEN p3_economy IS NOT NULL AND p2_economy < p3_economy AND (p1_economy >= p3_economy OR economy >= p3_economy OR l1_economy >= p3_economy) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_economy,

            -- Dips detection for premium
            CASE
                WHEN p1_premium IS NOT NULL AND premium < p1_premium AND (l1_premium >= p1_premium OR l2_premium >= p1_premium OR l3_premium >= p1_premium) THEN TRUE
                WHEN p2_premium IS NOT NULL AND premium < p2_premium AND (l1_premium >= p2_premium OR l2_premium >= p2_premium OR l3_premium >= p2_premium) THEN TRUE
                ELSE FALSE
            END AS is_dip_premium,
            CASE
                WHEN p2_premium IS NOT NULL AND p1_premium < p2_premium AND (premium >= p2_premium OR l1_premium >= p2_premium OR l2_premium >= p2_premium) THEN TRUE
                WHEN p3_premium IS NOT NULL AND p1_premium < p3_premium AND (premium >= p3_premium OR l1_premium >= p3_premium OR l2_premium >= p3_premium) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_premium,
            CASE
                WHEN p3_premium IS NOT NULL AND p2_premium < p3_premium AND (p1_premium >= p3_premium OR premium >= p3_premium OR l1_premium >= p3_premium) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_premium,

            -- Dips detection for luxury
            CASE
                WHEN p1_luxury IS NOT NULL AND luxury < p1_luxury AND (l1_luxury >= p1_luxury OR l2_luxury >= p1_luxury OR l3_luxury >= p1_luxury) THEN TRUE
                WHEN p2_luxury IS NOT NULL AND luxury < p2_luxury AND (l1_luxury >= p2_luxury OR l2_luxury >= p2_luxury OR l3_luxury >= p2_luxury) THEN TRUE
                ELSE FALSE
            END AS is_dip_luxury,
            CASE
                WHEN p2_luxury IS NOT NULL AND p1_luxury < p2_luxury AND (luxury >= p2_luxury OR l1_luxury >= p2_luxury OR l2_luxury >= p2_luxury) THEN TRUE
                WHEN p3_luxury IS NOT NULL AND p1_luxury < p3_luxury AND (luxury >= p3_luxury OR l1_luxury >= p3_luxury OR l2_luxury >= p3_luxury) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_luxury,
            CASE
                WHEN p3_luxury IS NOT NULL AND p2_luxury < p3_luxury AND (p1_luxury >= p3_luxury OR luxury >= p3_luxury OR l1_luxury >= p3_luxury) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_luxury,

            -- Dips detection for ultra_luxury
            CASE
                WHEN p1_ultra_luxury IS NOT NULL AND ultra_luxury < p1_ultra_luxury AND (l1_ultra_luxury >= p1_ultra_luxury OR l2_ultra_luxury >= p1_ultra_luxury OR l3_ultra_luxury >= p1_ultra_luxury) THEN TRUE
                WHEN p2_ultra_luxury IS NOT NULL AND ultra_luxury < p2_ultra_luxury AND (l1_ultra_luxury >= p2_ultra_luxury OR l2_ultra_luxury >= p2_ultra_luxury OR l3_ultra_luxury >= p2_ultra_luxury) THEN TRUE
                ELSE FALSE
            END AS is_dip_ultra_luxury,
            CASE
                WHEN p2_ultra_luxury IS NOT NULL AND p1_ultra_luxury < p2_ultra_luxury AND (ultra_luxury >= p2_ultra_luxury OR l1_ultra_luxury >= p2_ultra_luxury OR l2_ultra_luxury >= p2_ultra_luxury) THEN TRUE
                WHEN p3_ultra_luxury IS NOT NULL AND p1_ultra_luxury < p3_ultra_luxury AND (ultra_luxury >= p3_ultra_luxury OR l1_ultra_luxury >= p3_ultra_luxury OR l2_ultra_luxury >= p3_ultra_luxury) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_ultra_luxury,
            CASE
                WHEN p3_ultra_luxury IS NOT NULL AND p2_ultra_luxury < p3_ultra_luxury AND (p1_ultra_luxury >= p3_ultra_luxury OR ultra_luxury >= p3_ultra_luxury OR l1_ultra_luxury >= p3_ultra_luxury) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_ultra_luxury,

            -- Dips detection for commercial
            CASE
                WHEN p1_commercial IS NOT NULL AND commercial < p1_commercial AND (l1_commercial >= p1_commercial OR l2_commercial >= p1_commercial OR l3_commercial >= p1_commercial) THEN TRUE
                WHEN p2_commercial IS NOT NULL AND commercial < p2_commercial AND (l1_commercial >= p2_commercial OR l2_commercial >= p2_commercial OR l3_commercial >= p2_commercial) THEN TRUE
                ELSE FALSE
            END AS is_dip_commercial,
            CASE
                WHEN p2_commercial IS NOT NULL AND p1_commercial < p2_commercial AND (commercial >= p2_commercial OR l1_commercial >= p2_commercial OR l2_commercial >= p2_commercial) THEN TRUE
                WHEN p3_commercial IS NOT NULL AND p1_commercial < p3_commercial AND (commercial >= p3_commercial OR l1_commercial >= p3_commercial OR l2_commercial >= p3_commercial) THEN TRUE
                ELSE FALSE
            END AS is_p1_dip_commercial,
            CASE
                WHEN p3_commercial IS NOT NULL AND p2_commercial < p3_commercial AND (p1_commercial >= p3_commercial OR commercial >= p3_commercial OR l1_commercial >= p3_commercial) THEN TRUE
                ELSE FALSE
            END AS is_p2_dip_commercial
        FROM history_windowed w
    ),
    history_deltas AS (
        SELECT
            c.*,
            -- Delta calculation for total_vehicles
            CASE
                WHEN is_dip_total_vehicles THEN 0
                WHEN NOT is_p1_dip_total_vehicles AND p1_total_vehicles IS NOT NULL THEN
                    CASE
                        WHEN total_vehicles >= p1_total_vehicles THEN total_vehicles - p1_total_vehicles
                        ELSE total_vehicles
                    END
                WHEN is_p1_dip_total_vehicles AND NOT is_p2_dip_total_vehicles AND p2_total_vehicles IS NOT NULL THEN
                    CASE
                        WHEN total_vehicles >= p2_total_vehicles THEN total_vehicles - p2_total_vehicles
                        ELSE total_vehicles
                    END
                WHEN is_p1_dip_total_vehicles AND is_p2_dip_total_vehicles AND p3_total_vehicles IS NOT NULL THEN
                    CASE
                        WHEN total_vehicles >= p3_total_vehicles THEN total_vehicles - p3_total_vehicles
                        ELSE total_vehicles
                    END
                ELSE 0
            END AS delta_total_vehicles,

            -- Delta calculation for bikes
            CASE
                WHEN is_dip_bikes THEN 0
                WHEN NOT is_p1_dip_bikes AND p1_bikes IS NOT NULL THEN
                    CASE
                        WHEN bikes >= p1_bikes THEN bikes - p1_bikes
                        ELSE bikes
                    END
                WHEN is_p1_dip_bikes AND NOT is_p2_dip_bikes AND p2_bikes IS NOT NULL THEN
                    CASE
                        WHEN bikes >= p2_bikes THEN bikes - p2_bikes
                        ELSE bikes
                    END
                WHEN is_p1_dip_bikes AND is_p2_dip_bikes AND p3_bikes IS NOT NULL THEN
                    CASE
                        WHEN bikes >= p3_bikes THEN bikes - p3_bikes
                        ELSE bikes
                    END
                ELSE 0
            END AS delta_bikes,

            -- Delta calculation for economy
            CASE
                WHEN is_dip_economy THEN 0
                WHEN NOT is_p1_dip_economy AND p1_economy IS NOT NULL THEN
                    CASE
                        WHEN economy >= p1_economy THEN economy - p1_economy
                        ELSE economy
                    END
                WHEN is_p1_dip_economy AND NOT is_p2_dip_economy AND p2_economy IS NOT NULL THEN
                    CASE
                        WHEN economy >= p2_economy THEN economy - p2_economy
                        ELSE economy
                    END
                WHEN is_p1_dip_economy AND is_p2_dip_economy AND p3_economy IS NOT NULL THEN
                    CASE
                        WHEN economy >= p3_economy THEN economy - p3_economy
                        ELSE economy
                    END
                ELSE 0
            END AS delta_economy,

            -- Delta calculation for premium
            CASE
                WHEN is_dip_premium THEN 0
                WHEN NOT is_p1_dip_premium AND p1_premium IS NOT NULL THEN
                    CASE
                        WHEN premium >= p1_premium THEN premium - p1_premium
                        ELSE premium
                    END
                WHEN is_p1_dip_premium AND NOT is_p2_dip_premium AND p2_premium IS NOT NULL THEN
                    CASE
                        WHEN premium >= p2_premium THEN premium - p2_premium
                        ELSE premium
                    END
                WHEN is_p1_dip_premium AND is_p2_dip_premium AND p3_premium IS NOT NULL THEN
                    CASE
                        WHEN premium >= p3_premium THEN premium - p3_premium
                        ELSE premium
                    END
                ELSE 0
            END AS delta_premium,

            -- Delta calculation for luxury
            CASE
                WHEN is_dip_luxury THEN 0
                WHEN NOT is_p1_dip_luxury AND p1_luxury IS NOT NULL THEN
                    CASE
                        WHEN luxury >= p1_luxury THEN luxury - p1_luxury
                        ELSE luxury
                    END
                WHEN is_p1_dip_luxury AND NOT is_p2_dip_luxury AND p2_luxury IS NOT NULL THEN
                    CASE
                        WHEN luxury >= p2_luxury THEN luxury - p2_luxury
                        ELSE luxury
                    END
                WHEN is_p1_dip_luxury AND is_p2_dip_luxury AND p3_luxury IS NOT NULL THEN
                    CASE
                        WHEN luxury >= p3_luxury THEN luxury - p3_luxury
                        ELSE luxury
                    END
                ELSE 0
            END AS delta_luxury,

            -- Delta calculation for ultra_luxury
            CASE
                WHEN is_dip_ultra_luxury THEN 0
                WHEN NOT is_p1_dip_ultra_luxury AND p1_ultra_luxury IS NOT NULL THEN
                    CASE
                        WHEN ultra_luxury >= p1_ultra_luxury THEN ultra_luxury - p1_ultra_luxury
                        ELSE ultra_luxury
                    END
                WHEN is_p1_dip_ultra_luxury AND NOT is_p2_dip_ultra_luxury AND p2_ultra_luxury IS NOT NULL THEN
                    CASE
                        WHEN ultra_luxury >= p2_ultra_luxury THEN ultra_luxury - p2_ultra_luxury
                        ELSE ultra_luxury
                    END
                WHEN is_p1_dip_ultra_luxury AND is_p2_dip_ultra_luxury AND p3_ultra_luxury IS NOT NULL THEN
                    CASE
                        WHEN ultra_luxury >= p3_ultra_luxury THEN ultra_luxury - p3_ultra_luxury
                        ELSE ultra_luxury
                    END
                ELSE 0
            END AS delta_ultra_luxury,

            -- Delta calculation for commercial
            CASE
                WHEN is_dip_commercial THEN 0
                WHEN NOT is_p1_dip_commercial AND p1_commercial IS NOT NULL THEN
                    CASE
                        WHEN commercial >= p1_commercial THEN commercial - p1_commercial
                        ELSE commercial
                    END
                WHEN is_p1_dip_commercial AND NOT is_p2_dip_commercial AND p2_commercial IS NOT NULL THEN
                    CASE
                        WHEN commercial >= p2_commercial THEN commercial - p2_commercial
                        ELSE commercial
                    END
                WHEN is_p1_dip_commercial AND is_p2_dip_commercial AND p3_commercial IS NOT NULL THEN
                    CASE
                        WHEN commercial >= p3_commercial THEN commercial - p3_commercial
                        ELSE commercial
                    END
                ELSE 0
            END AS delta_commercial
        FROM history_classified c
    ),
    hourly_data AS (
        SELECT
            d.radxa_code,
            d.billboard_code,
            MAX(d.billboard_name) AS billboard_name,
            d.camera_ff_code,
            d.camera_bf_code,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_total_vehicles
                    ELSE 0
                END
            ) AS total_vehicles,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_bikes
                    ELSE 0
                END
            ) AS bikes,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_economy
                    ELSE 0
                END
            ) AS economy,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_premium
                    ELSE 0
                END
            ) AS premium,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_luxury
                    ELSE 0
                END
            ) AS luxury,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_ultra_luxury
                    ELSE 0
                END
            ) AS ultra_luxury,

            SUM(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.delta_commercial
                    ELSE 0
                END
            ) AS commercial,

            AVG(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.avg_exposure_time
                END
            ) AS avg_exposure_time,

            MAX(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.max_exposure_time
                END
            ) AS max_exposure_time,

            MAX(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.peak_traffic_hour
                END
            ) AS peak_traffic_hour,

            MAX(
                CASE
                    WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end
                    THEN d.recorded_at
                END
            ) AS last_updated

        FROM history_deltas d
        WHERE d.recorded_at >= v_hour_start - INTERVAL '10 minutes'
          AND d.recorded_at <  v_hour_end + INTERVAL '10 minutes'
        GROUP BY
            d.radxa_code,
            d.billboard_code,
            d.camera_ff_code,
            d.camera_bf_code
        HAVING COUNT(CASE WHEN d.recorded_at >= v_hour_start AND d.recorded_at < v_hour_end THEN 1 END) > 0
    )
    INSERT INTO public.traffic_hour (
        radxa_code,
        billboard_code,
        billboard_name,
        camera_ff_code,
        camera_bf_code,

        date,
        day,
        hour,
        hour_range,

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
    SELECT
        radxa_code,
        billboard_code,
        billboard_name,
        camera_ff_code,
        camera_bf_code,

        v_date,
        TRIM(TO_CHAR(v_date, 'Day')),
        v_hour,
        v_hour_range,

        COALESCE(total_vehicles, 0),
        COALESCE(bikes, 0),
        COALESCE(economy, 0),
        COALESCE(premium, 0),
        COALESCE(luxury, 0),
        COALESCE(ultra_luxury, 0),
        COALESCE(commercial, 0),

        COALESCE(avg_exposure_time, 0),
        COALESCE(max_exposure_time, 0),

        (
            COALESCE(bikes, 0) * 1.2
            + COALESCE(economy, 0) * 2.0
            + COALESCE(premium, 0) * 2.0
            + COALESCE(luxury, 0) * 1.8
            + COALESCE(ultra_luxury, 0) * 1.8
            + COALESCE(commercial, 0) * 1.5
        )::BIGINT,

        COALESCE(total_vehicles, 0),

        COALESCE(
            peak_traffic_hour,
            v_hour_range
        ),

        FALSE,

        COALESCE(last_updated, v_hour_end)
    FROM hourly_data

    ON CONFLICT (
        radxa_code,
        billboard_code,
        camera_ff_code,
        camera_bf_code,
        date,
        hour
    )
    DO UPDATE SET
        billboard_name    = EXCLUDED.billboard_name,
        total_vehicles    = EXCLUDED.total_vehicles,
        bikes             = EXCLUDED.bikes,
        economy           = EXCLUDED.economy,
        premium           = EXCLUDED.premium,
        luxury            = EXCLUDED.luxury,
        ultra_luxury      = EXCLUDED.ultra_luxury,
        commercial        = EXCLUDED.commercial,
        avg_exposure_time = EXCLUDED.avg_exposure_time,
        max_exposure_time = EXCLUDED.max_exposure_time,
        estimated_reach   = EXCLUDED.estimated_reach,
        flow_rate         = EXCLUDED.flow_rate,
        peak_traffic_hour = EXCLUDED.peak_traffic_hour,
        is_live           = EXCLUDED.is_live,
        last_updated      = EXCLUDED.last_updated;
END;
$function$;
"""

cur.execute(process_traffic_hour_sql)
conn.commit()
print("SUCCESS: process_traffic_hour created!")

# 2. Create public.process_previous_hour()
process_previous_hour_sql = """
CREATE OR REPLACE FUNCTION public.process_previous_hour()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_hour_start timestamptz;
BEGIN
    v_hour_start :=
        date_trunc(
            'hour',
            NOW() AT TIME ZONE 'Asia/Kolkata'
        ) AT TIME ZONE 'Asia/Kolkata'
        - INTERVAL '1 hour';

    PERFORM public.process_traffic_hour(v_hour_start);
END;
$function$;
"""

cur.execute(process_previous_hour_sql)
conn.commit()
print("SUCCESS: process_previous_hour created!")

cur.close()
conn.close()
