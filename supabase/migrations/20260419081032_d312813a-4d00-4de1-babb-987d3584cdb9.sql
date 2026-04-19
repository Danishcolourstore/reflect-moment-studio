-- ─── Cheetah: FTP credentials & telemetry per session ──────────────
-- Adds forward-compatible FTP credential columns so future managed-FTP
-- relay can authenticate per session. HTTPS remains the primary path.

ALTER TABLE public.cheetah_sessions
  ADD COLUMN IF NOT EXISTS ftp_username TEXT,
  ADD COLUMN IF NOT EXISTS ftp_password TEXT,
  ADD COLUMN IF NOT EXISTS ftp_host TEXT DEFAULT 'ftp.mirror.studio',
  ADD COLUMN IF NOT EXISTS ftp_port INT DEFAULT 21,
  ADD COLUMN IF NOT EXISTS connection_tested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_upload_at TIMESTAMPTZ;

-- Helper: generate URL-safe random credential
CREATE OR REPLACE FUNCTION public.cheetah_generate_credential(prefix TEXT, len INT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  alphabet TEXT := 'abcdefghijkmnpqrstuvwxyz23456789';
  out TEXT := prefix;
  i INT;
BEGIN
  FOR i IN 1..len LOOP
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN out;
END;
$$;

-- Backfill existing sessions that lack creds
UPDATE public.cheetah_sessions
SET
  ftp_username = COALESCE(ftp_username, public.cheetah_generate_credential('cam_', 8)),
  ftp_password = COALESCE(ftp_password, public.cheetah_generate_credential('', 16))
WHERE ftp_username IS NULL OR ftp_password IS NULL;

-- Auto-generate FTP creds for new sessions
CREATE OR REPLACE FUNCTION public.cheetah_set_ftp_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ftp_username IS NULL THEN
    NEW.ftp_username := public.cheetah_generate_credential('cam_', 8);
  END IF;
  IF NEW.ftp_password IS NULL THEN
    NEW.ftp_password := public.cheetah_generate_credential('', 16);
  END IF;
  IF NEW.ftp_host IS NULL THEN
    NEW.ftp_host := 'ftp.mirror.studio';
  END IF;
  IF NEW.ftp_port IS NULL THEN
    NEW.ftp_port := 21;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cheetah_set_ftp_credentials ON public.cheetah_sessions;
CREATE TRIGGER trg_cheetah_set_ftp_credentials
BEFORE INSERT ON public.cheetah_sessions
FOR EACH ROW
EXECUTE FUNCTION public.cheetah_set_ftp_credentials();

-- Touch last_upload_at when a photo lands
CREATE OR REPLACE FUNCTION public.cheetah_touch_last_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.cheetah_sessions
  SET last_upload_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cheetah_touch_last_upload ON public.cheetah_photos;
CREATE TRIGGER trg_cheetah_touch_last_upload
AFTER INSERT ON public.cheetah_photos
FOR EACH ROW
EXECUTE FUNCTION public.cheetah_touch_last_upload();