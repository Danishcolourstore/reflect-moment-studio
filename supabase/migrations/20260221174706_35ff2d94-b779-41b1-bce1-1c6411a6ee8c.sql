ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS download_requires_password boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS download_password text;