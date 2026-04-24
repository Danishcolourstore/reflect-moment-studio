ALTER TABLE public.cheetah_sessions
ADD COLUMN IF NOT EXISTS ftp_path TEXT;

COMMENT ON COLUMN public.cheetah_sessions.ftp_path IS 'Watch path on the FTP bridge (e.g. /uploads). Set by the photographer when configuring an external bridge.';