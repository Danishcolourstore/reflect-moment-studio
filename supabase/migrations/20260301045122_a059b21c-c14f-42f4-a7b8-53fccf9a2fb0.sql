
-- Add event_analytics table
CREATE TABLE public.event_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE UNIQUE NOT NULL,
  gallery_views integer DEFAULT 0 NOT NULL,
  favorites_count integer DEFAULT 0 NOT NULL,
  downloads_count integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- Authenticated event owners can select their own analytics
CREATE POLICY "Event owners can view analytics" ON public.event_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_analytics.event_id AND events.user_id = auth.uid())
  );

-- Authenticated event owners can update their own analytics
CREATE POLICY "Event owners can update analytics" ON public.event_analytics
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_analytics.event_id AND events.user_id = auth.uid())
  );

-- Public can view analytics (for public gallery view tracking)
CREATE POLICY "Public can view analytics" ON public.event_analytics
  FOR SELECT USING (true);

-- Anyone can insert analytics (for public gallery view tracking)
CREATE POLICY "Anyone can insert analytics" ON public.event_analytics
  FOR INSERT WITH CHECK (true);

-- Anyone can update analytics (for view/fav/download counting from public)
CREATE POLICY "Anyone can update analytics public" ON public.event_analytics
  FOR UPDATE USING (true);

-- Add studio_logo_url to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS studio_logo_url text;
