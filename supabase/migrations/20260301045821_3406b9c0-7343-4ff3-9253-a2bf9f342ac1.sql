
-- photo_comments
CREATE TABLE IF NOT EXISTS public.photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_session_id text,
  guest_name text,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert comments" ON public.photo_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view comments" ON public.photo_comments FOR SELECT USING (true);

-- album_selections
CREATE TABLE IF NOT EXISTS public.album_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_session_id text,
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(guest_session_id, photo_id)
);
ALTER TABLE public.album_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert album selections" ON public.album_selections FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view album selections" ON public.album_selections FOR SELECT USING (true);
CREATE POLICY "Public can delete album selections" ON public.album_selections FOR DELETE USING (true);

-- gallery_chapters
CREATE TABLE IF NOT EXISTS public.gallery_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.gallery_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage chapters" ON public.gallery_chapters FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = gallery_chapters.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Public can view chapters" ON public.gallery_chapters FOR SELECT USING (true);

-- chapter_photos
CREATE TABLE IF NOT EXISTS public.chapter_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES public.gallery_chapters(id) ON DELETE CASCADE NOT NULL,
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  sort_order integer DEFAULT 0
);
ALTER TABLE public.chapter_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view chapter photos" ON public.chapter_photos FOR SELECT USING (true);
CREATE POLICY "Owners can manage chapter photos" ON public.chapter_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.gallery_chapters gc JOIN public.events e ON e.id = gc.event_id WHERE gc.id = chapter_photos.chapter_id AND e.user_id = auth.uid())
);

-- blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  slug text UNIQUE,
  content text,
  cover_url text,
  seo_title text,
  seo_description text,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage own posts" ON public.blog_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (published = true);

-- sneak_peeks
CREATE TABLE IF NOT EXISTS public.sneak_peeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.sneak_peeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage sneak peeks" ON public.sneak_peeks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = sneak_peeks.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Public can view sneak peeks" ON public.sneak_peeks FOR SELECT USING (true);

-- event_views
CREATE TABLE IF NOT EXISTS public.event_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_session_id text,
  viewed_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert event views" ON public.event_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view event views" ON public.event_views FOR SELECT USING (true);

-- photo_interactions
CREATE TABLE IF NOT EXISTS public.photo_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  interaction_type text,
  guest_session_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.photo_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert interactions" ON public.photo_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view interactions" ON public.photo_interactions FOR SELECT USING (true);

-- studio_profiles
CREATE TABLE IF NOT EXISTS public.studio_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  username text UNIQUE,
  display_name text,
  bio text,
  website text,
  instagram text,
  cover_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.studio_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view studio profiles" ON public.studio_profiles FOR SELECT USING (true);
CREATE POLICY "Owners can manage own profile" ON public.studio_profiles FOR ALL USING (auth.uid() = user_id);

-- referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_email text,
  status text DEFAULT 'pending',
  reward_granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);

-- Add missing columns to profiles (IF NOT EXISTS handles safety)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS studio_accent_color text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS watermark_text text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS watermark_opacity integer DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS watermark_position text DEFAULT 'bottom-right';
