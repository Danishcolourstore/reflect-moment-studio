DROP VIEW IF EXISTS public.public_profile_watermarks;

DROP POLICY IF EXISTS "Public can read watermark profile fields" ON public.profiles;

CREATE OR REPLACE FUNCTION public.get_public_profile_watermark(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  studio_name text,
  avatar_url text,
  studio_logo_url text,
  studio_accent_color text,
  watermark_text text,
  watermark_opacity integer,
  watermark_position text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.studio_name,
    p.avatar_url,
    p.studio_logo_url,
    p.studio_accent_color,
    p.watermark_text,
    p.watermark_opacity,
    p.watermark_position
  FROM public.profiles p
  WHERE p.user_id = p_user_id
  LIMIT 1;
$$;