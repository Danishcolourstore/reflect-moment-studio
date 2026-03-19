-- Drop old permissive policy
DROP POLICY IF EXISTS "Public can view events by id" ON public.events;

-- Drop existing policy if it was partially created
DROP POLICY IF EXISTS "Public can view published events" ON public.events;

-- Create restricted policy
CREATE POLICY "Public can view published events"
  ON public.events
  FOR SELECT
  USING (
    is_published = true
    OR auth.uid() = user_id
  );

-- Create public view stripping sensitive columns
CREATE OR REPLACE VIEW public.public_events AS
SELECT
  id, name, slug, event_date, cover_url,
  downloads_enabled, download_resolution, watermark_enabled,
  face_recognition_enabled, user_id, gallery_layout, gallery_style,
  is_published, download_requires_password, selection_mode_enabled,
  hero_couple_name, hero_subtitle, hero_button_label,
  (gallery_pin IS NOT NULL AND gallery_pin != '') AS has_pin,
  (gallery_password IS NOT NULL AND gallery_password != '') AS has_password
FROM public.events
WHERE is_published = true;

-- Grant read access
GRANT SELECT ON public.public_events TO anon;
GRANT SELECT ON public.public_events TO authenticated;