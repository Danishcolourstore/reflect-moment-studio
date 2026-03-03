
CREATE TABLE IF NOT EXISTS public.culling_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  event_id uuid REFERENCES public.events(id),
  user_id uuid NOT NULL,
  total_photos int DEFAULT 0,
  best_count int DEFAULT 0,
  maybe_count int DEFAULT 0,
  reject_count int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.culled_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  session_id uuid REFERENCES public.culling_sessions(id) ON DELETE CASCADE,
  filename text NOT NULL,
  url text,
  rating text NOT NULL DEFAULT 'maybe',
  reason text,
  sharpness int,
  exposure int,
  composition int,
  eyes_open boolean,
  duplicate_risk boolean
);

ALTER TABLE public.culling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culled_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own culling sessions"
ON public.culling_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own culled photos"
ON public.culled_photos FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.culling_sessions cs
  WHERE cs.id = culled_photos.session_id AND cs.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.culling_sessions cs
  WHERE cs.id = culled_photos.session_id AND cs.user_id = auth.uid()
));
