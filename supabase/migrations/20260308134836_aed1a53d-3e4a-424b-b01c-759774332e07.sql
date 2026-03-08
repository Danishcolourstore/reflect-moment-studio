
-- Cheetah Sessions
CREATE TABLE public.cheetah_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Live Session',
  status text NOT NULL DEFAULT 'active',
  total_photos integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cheetah_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cheetah sessions" ON public.cheetah_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cheetah Photos
CREATE TABLE public.cheetah_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.cheetah_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  original_url text NOT NULL,
  thumbnail_url text,
  preview_url text,
  file_size bigint,
  -- AI scoring
  ai_score integer,
  sharpness integer,
  exposure text,
  composition integer,
  eyes_open boolean,
  ai_recommendation text,
  ai_status text NOT NULL DEFAULT 'pending',
  -- Burst detection
  burst_group text,
  is_best_in_burst boolean DEFAULT false,
  -- Cull actions
  cull_status text NOT NULL DEFAULT 'unreviewed',
  -- Timestamps
  captured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.cheetah_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cheetah photos" ON public.cheetah_photos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public read for edge functions (service role)
CREATE POLICY "Service can read cheetah photos" ON public.cheetah_photos
  FOR SELECT TO anon
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cheetah_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cheetah_sessions;

-- Update trigger
CREATE TRIGGER update_cheetah_sessions_updated_at
  BEFORE UPDATE ON public.cheetah_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
