
-- Add website_template and testimonials_data to studio_profiles
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS website_template text DEFAULT 'dark-portfolio';
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS testimonials_data jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create portfolio_albums table
CREATE TABLE IF NOT EXISTS public.portfolio_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Album',
  description text,
  cover_url text,
  category text DEFAULT 'general',
  sort_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  photo_urls text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.portfolio_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolio albums" ON public.portfolio_albums
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view visible portfolio albums" ON public.portfolio_albums
  FOR SELECT TO anon, authenticated
  USING (is_visible = true);
