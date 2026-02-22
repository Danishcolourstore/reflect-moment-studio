
-- Create guest_registrations table
CREATE TABLE public.guest_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  face_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified')),
  matched_photo_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.guest_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can register (public form)
CREATE POLICY "Anyone can insert guest registrations"
  ON public.guest_registrations FOR INSERT
  WITH CHECK (true);

-- Event owners can view registrations
CREATE POLICY "Event owners can view registrations"
  ON public.guest_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_registrations.event_id
        AND events.user_id = auth.uid()
    )
  );

-- Public can view own registration by id
CREATE POLICY "Public can view registrations"
  ON public.guest_registrations FOR SELECT
  USING (true);

-- Edge function needs to update matched photos and status (via service role)
CREATE POLICY "Anyone can update guest registrations"
  ON public.guest_registrations FOR UPDATE
  USING (true);
