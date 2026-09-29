-- Migration: 003_create_billboard_visibility_config.sql
-- Description: Creates the billboard_visibility_config table to store physical geometry,
-- road alignment, and clear-view corridor calibration data per billboard.
-- Adds vehicle_speed_kmh to traffic_overview and traffic_hour tables.

-- 1. Create billboard_visibility_config table
CREATE TABLE IF NOT EXISTS public.billboard_visibility_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billboard_id UUID NOT NULL REFERENCES public.billboards(id) ON DELETE CASCADE,
    billboard_code TEXT,
    board_width NUMERIC DEFAULT 40,
    board_height NUMERIC DEFAULT 20,
    board_latitude NUMERIC,
    board_longitude NUMERIC,
    board_orientation NUMERIC DEFAULT 90, -- degrees (0-360)
    road_direction NUMERIC DEFAULT 90,    -- travel heading degrees (0-360)
    visibility_start_distance NUMERIC,    -- D_first in meters upstream
    visibility_end_distance NUMERIC,      -- D_last in meters downstream
    effective_visibility_distance NUMERIC,-- D_last - D_first (total corridor in meters)
    field_of_view_angle NUMERIC DEFAULT 60, -- degrees
    obstruction_status TEXT DEFAULT 'Clear', -- 'Clear', 'Partially obstructed', 'Heavily obstructed'
    visibility_confidence TEXT DEFAULT 'High', -- 'High', 'Medium', 'Low'
    calibration_date TIMESTAMPTZ DEFAULT NOW(),
    calibrated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_billboard_visibility_config_bb_id UNIQUE (billboard_id)
);

-- Index for fast code and id lookups
CREATE INDEX IF NOT EXISTS idx_bb_vis_config_code ON public.billboard_visibility_config (billboard_code);
CREATE INDEX IF NOT EXISTS idx_bb_vis_config_bb_id ON public.billboard_visibility_config (billboard_id);

-- Enable RLS and define open policies for authenticated and anon roles
ALTER TABLE public.billboard_visibility_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'billboard_visibility_config' AND policyname = 'Allow read for all users'
    ) THEN
        CREATE POLICY "Allow read for all users" 
        ON public.billboard_visibility_config 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'billboard_visibility_config' AND policyname = 'Allow insert/update for all users'
    ) THEN
        CREATE POLICY "Allow insert/update for all users" 
        ON public.billboard_visibility_config 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 2. Add vehicle_speed_kmh to traffic_overview if not exists
ALTER TABLE public.traffic_overview 
ADD COLUMN IF NOT EXISTS vehicle_speed_kmh NUMERIC DEFAULT NULL;

-- 3. Add vehicle_speed_kmh to traffic_hour if not exists
ALTER TABLE public.traffic_hour 
ADD COLUMN IF NOT EXISTS vehicle_speed_kmh NUMERIC DEFAULT NULL;

-- 4. Seed initial calibration for ACU-BB-0001 (Testing Billboard -1)
INSERT INTO public.billboard_visibility_config (
    billboard_id,
    billboard_code,
    board_width,
    board_height,
    board_latitude,
    board_longitude,
    board_orientation,
    road_direction,
    visibility_start_distance,
    visibility_end_distance,
    effective_visibility_distance,
    field_of_view_angle,
    obstruction_status,
    visibility_confidence,
    calibration_date
)
SELECT 
    b.id,
    b.billboard_code,
    60,
    20,
    b.latitude,
    b.longitude,
    105,
    100,
    220,
    20,
    240,
    60,
    'Clear',
    'High',
    NOW()
FROM public.billboards b
WHERE b.billboard_code = 'ACU-BB-0001'
ON CONFLICT (billboard_id) DO UPDATE SET
    board_width = EXCLUDED.board_width,
    board_height = EXCLUDED.board_height,
    board_orientation = EXCLUDED.board_orientation,
    road_direction = EXCLUDED.road_direction,
    visibility_start_distance = EXCLUDED.visibility_start_distance,
    visibility_end_distance = EXCLUDED.visibility_end_distance,
    effective_visibility_distance = EXCLUDED.effective_visibility_distance,
    field_of_view_angle = EXCLUDED.field_of_view_angle,
    obstruction_status = EXCLUDED.obstruction_status,
    visibility_confidence = EXCLUDED.visibility_confidence,
    calibration_date = NOW(),
    updated_at = NOW();

-- 5. Seed observed average vehicle speed for ACU-BB-0001 in traffic_overview
UPDATE public.traffic_overview
SET vehicle_speed_kmh = 43.0
WHERE billboard_code = 'ACU-BB-0001' AND (vehicle_speed_kmh IS NULL OR vehicle_speed_kmh = 0);
