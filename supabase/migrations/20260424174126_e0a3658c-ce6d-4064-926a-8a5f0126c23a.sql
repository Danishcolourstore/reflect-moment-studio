ALTER TABLE public.events ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS idx_events_source ON public.events(source);