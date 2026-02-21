
-- Add selection_mode_enabled to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS selection_mode_enabled boolean NOT NULL DEFAULT false;

-- Create guest_selections table
CREATE TABLE public.guest_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create junction table for selected photos
CREATE TABLE public.guest_selection_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id uuid NOT NULL REFERENCES public.guest_selections(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_selection_photos ENABLE ROW LEVEL SECURITY;

-- RLS for guest_selections: anyone can insert (guests), owners can read
CREATE POLICY "Anyone can create guest selections" ON public.guest_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "Event owners can view selections" ON public.guest_selections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = guest_selections.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Public can view own selections" ON public.guest_selections FOR SELECT USING (true);

-- RLS for guest_selection_photos: anyone can insert, owners can read
CREATE POLICY "Anyone can create selection photos" ON public.guest_selection_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view selection photos" ON public.guest_selection_photos FOR SELECT USING (true);
