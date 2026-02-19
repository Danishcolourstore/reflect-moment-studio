
-- Add missing columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS downloads_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS download_resolution text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS watermark_enabled boolean NOT NULL DEFAULT false;

-- Backfill downloads_enabled from existing allow_full_download
UPDATE public.events SET downloads_enabled = allow_full_download;

-- Generate slugs for existing events
UPDATE public.events SET slug =
  LOWER(REGEXP_REPLACE(LEFT(name, 40), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4)
WHERE slug IS NULL;

-- Make slug NOT NULL and unique
ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.events ADD CONSTRAINT events_slug_key UNIQUE (slug);

-- Add sort_order to photos
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS sort_order integer;

-- Fix RLS: Current SELECT policies are all RESTRICTIVE (no PERMISSIVE),
-- meaning no rows are ever returned. Replace with proper PERMISSIVE policies.
DROP POLICY IF EXISTS "Public can view events by id" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;

CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view published events" ON public.events
  FOR SELECT USING (is_published = true);
