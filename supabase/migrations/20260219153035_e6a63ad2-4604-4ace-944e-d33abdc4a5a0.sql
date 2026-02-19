
-- Create guest_sessions table
CREATE TABLE public.guest_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a guest session
CREATE POLICY "Anyone can create guest sessions"
  ON public.guest_sessions FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read their own session by id
CREATE POLICY "Anyone can read guest sessions"
  ON public.guest_sessions FOR SELECT
  USING (true);

-- Allow anyone to update last_seen_at
CREATE POLICY "Anyone can update guest sessions"
  ON public.guest_sessions FOR UPDATE
  USING (true);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_session_id UUID NOT NULL REFERENCES public.guest_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(photo_id, guest_session_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to manage favorites
CREATE POLICY "Anyone can create favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read favorites"
  ON public.favorites FOR SELECT
  USING (true);

CREATE POLICY "Anyone can delete favorites"
  ON public.favorites FOR DELETE
  USING (true);
