
-- Art Gallery content tables

CREATE TABLE public.ag_featured_photographers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ag_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  story_date TEXT DEFAULT '',
  snippet TEXT NOT NULL DEFAULT '',
  cover_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ag_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  duration TEXT DEFAULT '',
  tag TEXT NOT NULL DEFAULT 'Free Tutorial',
  url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ag_discover_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  profile_link TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ag_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ag_manual_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  url TEXT DEFAULT '',
  news_date TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: public read, super_admin write
ALTER TABLE public.ag_featured_photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_discover_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ag_manual_news ENABLE ROW LEVEL SECURITY;

-- Public SELECT for all AG tables (community content)
CREATE POLICY "Public read ag_featured_photographers" ON public.ag_featured_photographers FOR SELECT USING (true);
CREATE POLICY "Public read ag_stories" ON public.ag_stories FOR SELECT USING (true);
CREATE POLICY "Public read ag_education" ON public.ag_education FOR SELECT USING (true);
CREATE POLICY "Public read ag_discover_profiles" ON public.ag_discover_profiles FOR SELECT USING (true);
CREATE POLICY "Public read ag_settings" ON public.ag_settings FOR SELECT USING (true);
CREATE POLICY "Public read ag_manual_news" ON public.ag_manual_news FOR SELECT USING (true);

-- Super admin full access via has_role
CREATE POLICY "Admin manage ag_featured_photographers" ON public.ag_featured_photographers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin manage ag_stories" ON public.ag_stories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin manage ag_education" ON public.ag_education FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin manage ag_discover_profiles" ON public.ag_discover_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin manage ag_settings" ON public.ag_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admin manage ag_manual_news" ON public.ag_manual_news FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Seed initial data
INSERT INTO public.ag_featured_photographers (name, location, bio, website, status, sort_order) VALUES
  ('Naman Verma', 'Delhi', 'Fine art and editorial wedding photographer capturing love across India.', 'https://namanverma.com', 'active', 0),
  ('Joseph Radhik', 'Hyderabad', 'Storyteller of emotions, creating timeless wedding narratives.', '', 'active', 1),
  ('Recall Pictures', 'Mumbai', 'Cinematic wedding films and photography for the modern couple.', '', 'active', 2);

INSERT INTO public.ag_stories (couple, location, story_date, snippet, status, sort_order) VALUES
  ('Meera & Arjun', 'Udaipur', 'Dec 2025', 'A royal celebration at City Palace that blended centuries of tradition with modern elegance.', 'active', 0),
  ('Priya & Karthik', 'Kerala', 'Jan 2026', 'A houseboat ceremony on the backwaters that felt like a dream.', 'active', 1),
  ('Zara & Imran', 'Lucknow', 'Nov 2025', 'A Nawabi nikah that honored centuries of tradition.', 'active', 2),
  ('Simran & Raj', 'Amritsar', 'Feb 2026', 'An Anand Karaj at the Golden Temple, bathed in golden light.', 'active', 3);

INSERT INTO public.ag_education (title, author, description, duration, tag, status, sort_order) VALUES
  ('Mastering Natural Light in Indian Wedding Venues', 'Naman Verma', 'Dark mandaps, mixed lighting, and 500 guests.', '12 min read', 'Free Tutorial', 'active', 0),
  ('Business of Wedding Photography in India', 'Joseph Radhik', 'Pricing, packages, and scaling your studio.', '20 min read', 'Premium', 'active', 1),
  ('Editing Indian Skin Tones in Lightroom', 'Colour Store', 'Warm tones, golden hour, indoor ceremony presets.', '8 min read', 'Free Tutorial', 'active', 2);

INSERT INTO public.ag_discover_profiles (name, location, sort_order) VALUES
  ('Naman Verma', 'Delhi', 0), ('Joseph Radhik', 'Hyderabad', 1), ('Recall Pictures', 'Mumbai', 2),
  ('The Wedding Filmer', 'Mumbai', 3), ('Plush Affairs', 'Delhi', 4), ('Beginnings For You', 'Kochi', 5),
  ('Infinite Memories', 'Pune', 6), ('Shades Photography', 'Bangalore', 7);

INSERT INTO public.ag_settings (setting_key, setting_value) VALUES
  ('gallery_config', '{"name":"Art Gallery","tagline":"Shoot. Share. Inspire.","heroText":"India Celebrates Love Like No Other Nation On Earth","showEducation":true,"showNews":true,"showDiscover":true,"showRss":true,"showManual":true,"rssFeeds":["https://petapixel.com/feed/","https://fstoppers.com/feed","https://www.diyphotography.net/feed/"]}');
