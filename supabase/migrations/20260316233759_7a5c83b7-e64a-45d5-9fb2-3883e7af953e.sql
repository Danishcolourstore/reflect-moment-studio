
ALTER TABLE public.reflections_posts
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'announcement',
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_link TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Sync is_active with is_published for existing data  
UPDATE public.reflections_posts SET is_published = is_active WHERE is_published = false AND is_active = true;

-- Add updated_at trigger if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reflections_posts_updated_at') THEN
    CREATE TRIGGER update_reflections_posts_updated_at
      BEFORE UPDATE ON public.reflections_posts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
