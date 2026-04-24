-- ============================================
-- PHASE A: Signed URL Infrastructure
-- ============================================

-- 1. Add storage_path columns
ALTER TABLE public.photos ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_storage_path text;
ALTER TABLE public.cheetah_photos
  ADD COLUMN IF NOT EXISTS original_storage_path text,
  ADD COLUMN IF NOT EXISTS thumbnail_storage_path text,
  ADD COLUMN IF NOT EXISTS preview_storage_path text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS cover_storage_path text;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path text,
  ADD COLUMN IF NOT EXISTS studio_logo_storage_path text;

-- Helper: extract storage path from a Supabase public URL
CREATE OR REPLACE FUNCTION public.extract_storage_path(p_url text, p_bucket text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_url IS NULL THEN NULL
    WHEN position('/storage/v1/object/public/' || p_bucket || '/' IN p_url) > 0
      THEN substring(p_url FROM position('/storage/v1/object/public/' || p_bucket || '/' IN p_url) + length('/storage/v1/object/public/' || p_bucket || '/'))
    ELSE NULL
  END;
$$;

-- Backfill paths from existing URLs
UPDATE public.photos SET storage_path = public.extract_storage_path(url, 'gallery-photos')
  WHERE storage_path IS NULL AND url IS NOT NULL;
UPDATE public.events SET cover_storage_path = public.extract_storage_path(cover_url, 'event-covers')
  WHERE cover_storage_path IS NULL AND cover_url IS NOT NULL;
UPDATE public.cheetah_photos SET
  original_storage_path = public.extract_storage_path(original_url, 'cheetah-photos'),
  thumbnail_storage_path = public.extract_storage_path(thumbnail_url, 'cheetah-photos'),
  preview_storage_path = public.extract_storage_path(preview_url, 'cheetah-photos')
  WHERE original_storage_path IS NULL;
UPDATE public.blog_posts SET cover_storage_path = public.extract_storage_path(cover_url, 'studio-website-assets')
  WHERE cover_storage_path IS NULL AND cover_url IS NOT NULL;
UPDATE public.profiles SET
  avatar_storage_path = public.extract_storage_path(avatar_url, 'studio-website-assets'),
  studio_logo_storage_path = public.extract_storage_path(studio_logo_url, 'studio-website-assets')
  WHERE avatar_storage_path IS NULL OR studio_logo_storage_path IS NULL;

-- 2. Gallery access tokens table
CREATE TABLE IF NOT EXISTS public.gallery_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_hint text
);

CREATE INDEX IF NOT EXISTS idx_gallery_access_tokens_token ON public.gallery_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_gallery_access_tokens_event ON public.gallery_access_tokens(event_id);

ALTER TABLE public.gallery_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role / SECURITY DEFINER funcs touch this table — no direct access
CREATE POLICY "No direct client access to tokens"
ON public.gallery_access_tokens FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- 3. Validate gallery token (used by edge function)
CREATE OR REPLACE FUNCTION public.validate_gallery_token(p_token text, p_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.gallery_access_tokens
    WHERE token = p_token AND event_id = p_event_id AND expires_at > now()
  );
$$;

-- 4. Updated password verification — mints token on success
CREATE OR REPLACE FUNCTION public.verify_gallery_password(event_id uuid, password_input text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_password text;
  new_token text;
BEGIN
  SELECT gallery_password INTO stored_password FROM events WHERE id = event_id AND is_published = true;
  IF stored_password IS NULL OR stored_password = '' THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'no_password_set');
  END IF;
  IF stored_password = password_input THEN
    new_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public.gallery_access_tokens (token, event_id) VALUES (new_token, event_id);
    RETURN jsonb_build_object('valid', true, 'token', new_token);
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_gallery_pin(event_id uuid, pin_input text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin text;
  new_token text;
BEGIN
  SELECT gallery_pin INTO stored_pin FROM events WHERE id = event_id AND is_published = true;
  IF stored_pin IS NULL OR stored_pin = '' THEN
    RETURN jsonb_build_object('valid', true, 'reason', 'no_pin_set');
  END IF;
  IF stored_pin = pin_input THEN
    new_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public.gallery_access_tokens (token, event_id) VALUES (new_token, event_id);
    RETURN jsonb_build_object('valid', true, 'token', new_token);
  ELSE
    RETURN jsonb_build_object('valid', false);
  END IF;
END;
$$;

-- 5. Cleanup expired tokens periodically (best-effort)
CREATE OR REPLACE FUNCTION public.cleanup_expired_gallery_tokens()
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.gallery_access_tokens WHERE expires_at < now() - interval '1 day';
$$;
