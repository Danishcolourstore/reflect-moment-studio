-- 1. platform_settings
DROP POLICY IF EXISTS "Public can read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated users can read platform settings" ON public.platform_settings;

CREATE OR REPLACE FUNCTION public.get_public_platform_setting(_key text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT value FROM public.platform_settings
  WHERE key = _key
    AND key NOT IN ('admin_pin_hash', 'admin_reset_token')
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_platform_setting(text) TO anon, authenticated;

-- 2. storybook_otp
DROP POLICY IF EXISTS "Allow anonymous select" ON public.storybook_otp;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.storybook_otp;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.storybook_otp;

-- 3. guest_registrations
DROP POLICY IF EXISTS "Public can view registrations" ON public.guest_registrations;

-- 4. guest_selections
DROP POLICY IF EXISTS "Public can view own selections" ON public.guest_selections;

-- 5. cheetah_photos
DROP POLICY IF EXISTS "Service can read cheetah photos" ON public.cheetah_photos;

-- 6. photo_faces
DROP POLICY IF EXISTS "Public read photo_faces" ON public.photo_faces;

-- 7. guest_selfies
DROP POLICY IF EXISTS "Public read selfies" ON public.guest_selfies;

CREATE POLICY "Event owners can view selfies"
ON public.guest_selfies
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guest_selfies.event_id
      AND events.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.get_guest_selfie_status(_selfie_id uuid)
RETURNS TABLE (processing_status text, match_results jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT processing_status, match_results
  FROM public.guest_selfies
  WHERE id = _selfie_id
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_guest_selfie_status(uuid) TO anon, authenticated;

-- 8. studio_profiles
DROP POLICY IF EXISTS "Public can view studio profiles" ON public.studio_profiles;

CREATE OR REPLACE FUNCTION public.get_public_studio_profile(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  bio text,
  instagram text,
  website text,
  cover_url text,
  font_style text,
  heading_font text,
  body_font text,
  footer_text text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.user_id, sp.display_name, sp.username, sp.bio,
    sp.instagram, sp.website, sp.cover_url,
    sp.font_style, sp.heading_font, sp.body_font, sp.footer_text
  FROM public.studio_profiles sp
  WHERE sp.user_id = _user_id
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_studio_profile(uuid) TO anon, authenticated;

-- 9. Events: sanitized public projection (omits gallery_pin / gallery_password)
CREATE OR REPLACE FUNCTION public.get_public_event_by_slug(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  event_date date,
  cover_url text,
  cover_storage_path text,
  is_published boolean,
  gallery_layout text,
  gallery_style text,
  downloads_enabled boolean,
  allow_full_download boolean,
  allow_favorites_download boolean,
  download_resolution text,
  download_requires_password boolean,
  feed_visible boolean,
  selection_mode_enabled boolean,
  selection_token text,
  qr_enabled boolean,
  qr_token text,
  user_id uuid,
  hero_couple_name text,
  hero_subtitle text,
  hero_button_label text,
  location text,
  event_type text,
  watermark_enabled boolean,
  face_recognition_enabled boolean,
  guest_face_enabled boolean,
  has_pin boolean,
  has_password boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id, e.name, e.slug, e.event_date,
    e.cover_url, e.cover_storage_path, e.is_published,
    e.gallery_layout, e.gallery_style,
    e.downloads_enabled, e.allow_full_download, e.allow_favorites_download,
    e.download_resolution, e.download_requires_password,
    e.feed_visible, e.selection_mode_enabled, e.selection_token,
    e.qr_enabled, e.qr_token, e.user_id,
    e.hero_couple_name, e.hero_subtitle, e.hero_button_label,
    e.location, e.event_type,
    e.watermark_enabled, e.face_recognition_enabled, e.guest_face_enabled,
    (e.gallery_pin IS NOT NULL AND e.gallery_pin <> '') AS has_pin,
    (e.gallery_password IS NOT NULL AND e.gallery_password <> '') AS has_password
  FROM public.events e
  WHERE e.slug = _slug AND e.is_published = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_event_by_slug(text) TO anon, authenticated;
