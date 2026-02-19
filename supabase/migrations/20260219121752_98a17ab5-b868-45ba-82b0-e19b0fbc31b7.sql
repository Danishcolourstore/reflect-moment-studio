
-- Add gallery layout preset column
ALTER TABLE public.events
  ADD COLUMN gallery_layout text NOT NULL DEFAULT 'masonry';
-- Valid values: 'classic', 'masonry', 'justified', 'editorial'
