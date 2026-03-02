
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS gallery_style TEXT NOT NULL DEFAULT 'vogue-editorial',
  ADD COLUMN IF NOT EXISTS hero_couple_name TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS hero_button_label TEXT;
