
-- Add download permission columns to events table
ALTER TABLE public.events
  ADD COLUMN allow_full_download boolean NOT NULL DEFAULT true,
  ADD COLUMN allow_favorites_download boolean NOT NULL DEFAULT true;
