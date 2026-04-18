-- Cheetah Live: rebuild as pure real-time ingest (no culling)

-- 1. Add live-session fields to cheetah_sessions
ALTER TABLE public.cheetah_sessions
  ADD COLUMN IF NOT EXISTS session_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS upload_token text,
  ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS public_view_count integer NOT NULL DEFAULT 0;

-- Backfill session_code & upload_token for existing rows
UPDATE public.cheetah_sessions
SET session_code = COALESCE(session_code, lower(substr(md5(random()::text || id::text), 1, 6))),
    upload_token = COALESCE(upload_token, encode(gen_random_bytes(16), 'hex'))
WHERE session_code IS NULL OR upload_token IS NULL;

ALTER TABLE public.cheetah_sessions
  ALTER COLUMN session_code SET NOT NULL,
  ALTER COLUMN upload_token SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cheetah_sessions_code ON public.cheetah_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_cheetah_sessions_user_active ON public.cheetah_sessions(user_id, is_live);

-- 2. Public read policy for live sessions (so /live/:code works without auth)
DROP POLICY IF EXISTS "Public can read live sessions by code" ON public.cheetah_sessions;
CREATE POLICY "Public can read live sessions by code"
  ON public.cheetah_sessions
  FOR SELECT
  TO anon, authenticated
  USING (is_live = true AND (expires_at IS NULL OR expires_at > now()));

-- 3. Public read policy for photos in live sessions
DROP POLICY IF EXISTS "Public can read photos from live sessions" ON public.cheetah_photos;
CREATE POLICY "Public can read photos from live sessions"
  ON public.cheetah_photos
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cheetah_sessions s
      WHERE s.id = cheetah_photos.session_id
        AND s.is_live = true
        AND (s.expires_at IS NULL OR s.expires_at > now())
    )
  );

-- 4. Enable realtime for both tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cheetah_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cheetah_photos;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cheetah_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cheetah_sessions;
  END IF;
END $$;

-- 5. Helper RPC: increment public view counter for a session_code (rate-friendly)
CREATE OR REPLACE FUNCTION public.cheetah_increment_view(p_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.cheetah_sessions
  SET public_view_count = public_view_count + 1
  WHERE session_code = p_code AND is_live = true;
$$;

GRANT EXECUTE ON FUNCTION public.cheetah_increment_view(text) TO anon, authenticated;