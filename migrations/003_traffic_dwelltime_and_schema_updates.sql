-- Migration 003: Remove exposure times from traffic tables, add dwell-time range to billboards
-- 1. Update log_traffic_overview_history trigger function
CREATE OR REPLACE FUNCTION public.log_traffic_overview_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.traffic_overview_history (
        radxa_code,
        billboard_code,
        billboard_name,
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
        is_live,
        recorded_at,
        stat_date
    )
    VALUES (
        NEW.radxa_code,
        NEW.billboard_code,
        NEW.billboard_name,
        NEW.camera_ff_code,
        NEW.camera_bf_code,
        COALESCE(NEW.total_vehicles, 0),
        COALESCE(NEW.bikes, 0),
        COALESCE(NEW.economy, 0),
        COALESCE(NEW.premium, 0),
        COALESCE(NEW.luxury, 0),
        COALESCE(NEW.ultra_luxury, 0),
        COALESCE(NEW.commercial, 0),
        COALESCE(NEW.estimated_reach, 0),
        COALESCE(NEW.flow_rate, 0),
        NEW.is_live,
        COALESCE(NEW.last_updated, NOW()),
        COALESCE(NEW.stat_date, (COALESCE(NEW.last_updated, NOW()) AT TIME ZONE 'Asia/Kolkata')::DATE)
    );

    RETURN NEW;
END;
$function$;

-- 2. Update process_previous_day function
CREATE OR REPLACE FUNCTION public.process_previous_day()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_day_start TIMESTAMPTZ;
    v_day_end   TIMESTAMPTZ;
    v_date      DATE;
BEGIN
    v_day_end := date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata';
    v_day_start := v_day_end - INTERVAL '1 day';
    v_date := (v_day_start AT TIME ZONE 'Asia/Kolkata')::DATE;

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
        estimated_reach,
        flow_rate,
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
            SUM(COALESCE(th.estimated_reach, 0)) AS estimated_reach,
            SUM(COALESCE(th.flow_rate, 0)) AS flow_rate,
            MAX(th.last_updated) AS last_updated
        FROM public.traffic_hour th
        WHERE th.date = v_date
        GROUP BY th.billboard_code
    )
    SELECT
        radxa_code,
        billboard_code,
        billboard_name,
        camera_ff_code,
        camera_bf_code,
        v_date,
        TRIM(TO_CHAR(v_date, 'Day')),
        total_vehicles,
        bikes,
        economy,
        premium,
        luxury,
        ultra_luxury,
        commercial,
        estimated_reach,
        flow_rate,
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
        estimated_reach = EXCLUDED.estimated_reach,
        flow_rate = EXCLUDED.flow_rate,
        is_live = EXCLUDED.is_live,
        last_updated = EXCLUDED.last_updated;
END;
$function$;

-- 3. Drop columns from traffic tables
ALTER TABLE public.traffic_overview DROP COLUMN IF EXISTS avg_exposure_time;
ALTER TABLE public.traffic_overview DROP COLUMN IF EXISTS max_exposure_time;
ALTER TABLE public.traffic_overview_history DROP COLUMN IF EXISTS avg_exposure_time;
ALTER TABLE public.traffic_overview_history DROP COLUMN IF EXISTS max_exposure_time;
ALTER TABLE public.traffic_day DROP COLUMN IF EXISTS avg_exposure_time;
ALTER TABLE public.traffic_day DROP COLUMN IF EXISTS max_exposure_time;

-- 4. Add start_range_dwelltime and end_range_dwelltime to billboards table
ALTER TABLE public.billboards ADD COLUMN IF NOT EXISTS start_range_dwelltime numeric DEFAULT 4;
ALTER TABLE public.billboards ADD COLUMN IF NOT EXISTS end_range_dwelltime numeric DEFAULT 12;

UPDATE public.billboards SET start_range_dwelltime = 4 WHERE start_range_dwelltime IS NULL;
UPDATE public.billboards SET end_range_dwelltime = 12 WHERE end_range_dwelltime IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_billboard_dwelltime_range'
    ) THEN
        ALTER TABLE public.billboards ADD CONSTRAINT chk_billboard_dwelltime_range CHECK (end_range_dwelltime >= start_range_dwelltime);
    END IF;
END $$;
