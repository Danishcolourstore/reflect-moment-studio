
-- Community feed posts (managed by super admin or system)
CREATE TABLE public.reflections_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  card_type TEXT NOT NULL DEFAULT 'inspiration',
  tag TEXT DEFAULT 'new',
  cta_label TEXT,
  cta_action TEXT,
  cta_route TEXT,
  tab TEXT NOT NULL DEFAULT 'for_you',
  is_today BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reflections_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read active posts
CREATE POLICY "Public can view active reflections"
  ON public.reflections_posts FOR SELECT TO public
  USING (is_active = true);

-- Super admins manage posts
CREATE POLICY "Super admins manage reflections"
  ON public.reflections_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Saved posts per user
CREATE TABLE public.reflections_saved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.reflections_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.reflections_saved ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved reflections"
  ON public.reflections_saved FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed initial content
INSERT INTO public.reflections_posts (title, body, image_url, card_type, tag, cta_label, cta_action, tab, is_today, sort_order) VALUES
('Master the Golden Hour', 'The 20 minutes before sunset create the most flattering natural light. Position your subject facing the sun at a 45° angle for that warm, dimensional glow.', NULL, 'tips', 'trending', 'Try Now', 'feature', 'for_you', true, 1),
('Candid Moments Win Hearts', 'The best wedding photos are rarely posed. Stay alert during transitions — walking between venues, fixing outfits, quiet glances. These are the frames couples treasure most.', NULL, 'inspiration', 'recommended', NULL, NULL, 'for_you', true, 2),
('New: AI Album Builder', 'Create stunning wedding albums in minutes. Our AI selects your best shots, suggests layouts, and builds a print-ready album automatically.', NULL, 'announcements', 'new', 'Open AI Album', 'route', 'for_you', true, 3),
('Free Preset: Warm Film', 'Limited drop — download our warm film preset inspired by Kodak Portra 400. Perfect for outdoor ceremonies and receptions.', NULL, 'offers', 'offer', 'Download', 'download', 'for_you', true, 4),
('Composition Rule: Leading Lines', 'Use architectural elements — corridors, staircases, verandas — to draw the viewer''s eye directly to your couple. Indian venues are full of these opportunities.', NULL, 'tips', 'recommended', NULL, NULL, 'for_you', false, 5),
('Behind the Scenes: Real Workflow', 'A professional wedding photographer shares their complete workflow — from the shoot day to final delivery in under 7 days using Mirror AI.', NULL, 'inspiration', 'trending', 'Read More', 'feature', 'latest', false, 6),
('Storytelling Through Details', 'Don''t forget the details — mehndi patterns, jewelry, invitation cards, flower arrangements. These tell the story as much as portraits do.', NULL, 'tips', 'new', NULL, NULL, 'latest', false, 7),
('Cheetah Mode Tips', 'Use Cheetah for live events — it auto-analyzes sharpness, exposure, and composition in real-time so you never miss the best shot in a burst.', NULL, 'tips', 'recommended', 'Open Cheetah', 'route', 'latest', false, 8),
('Grid Builder Templates', 'Create stunning Instagram grids with our built-in Grid Builder. Choose from 20+ layouts designed specifically for wedding photographers.', NULL, 'products', 'new', 'Open Grid Builder', 'route', 'marketplace', false, 9),
('Storybook Templates', 'Transform your galleries into beautiful flipbook-style stories your clients can share. New templates added weekly.', NULL, 'products', 'trending', 'Create Storybook', 'route', 'marketplace', false, 10),
('Understanding Light Metering', 'Learn when to use spot, evaluative, and center-weighted metering modes. This guide covers real-world Indian wedding scenarios where each excels.', NULL, 'tips', 'recommended', NULL, NULL, 'learn', false, 11),
('Posing Guide: Indian Weddings', 'From traditional poses to modern candids — a comprehensive guide to directing couples across every ceremony from haldi to reception.', NULL, 'inspiration', 'trending', 'Read Guide', 'feature', 'learn', false, 12);
