
-- Fix: Security Definer View — recreate public_events with security_invoker
DROP VIEW IF EXISTS public.public_events;

CREATE VIEW public.public_events
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  slug,
  event_date,
  cover_url,
  downloads_enabled,
  download_resolution,
  watermark_enabled,
  face_recognition_enabled,
  user_id,
  gallery_layout,
  gallery_style,
  is_published,
  download_requires_password,
  selection_mode_enabled,
  hero_couple_name,
  hero_subtitle,
  hero_button_label,
  (gallery_pin IS NOT NULL AND gallery_pin <> ''::text) AS has_pin,
  (gallery_password IS NOT NULL AND gallery_password <> ''::text) AS has_password
FROM public.events
WHERE is_published = true;

-- Fix: Overly permissive DELETE on album_selections — scope to event owner
DROP POLICY IF EXISTS "Public can delete album selections" ON public.album_selections;

CREATE POLICY "Event owners can delete album selections"
ON public.album_selections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = album_selections.event_id
      AND e.user_id = auth.uid()
  )
);
