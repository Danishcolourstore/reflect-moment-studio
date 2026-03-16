
CREATE TABLE public.photographer_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_name text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  specialty text NOT NULL DEFAULT 'Wedding',
  about_bio text DEFAULT '',
  tagline text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  whatsapp text DEFAULT '',
  accent_color text DEFAULT '#D4AF37',
  theme_mode text DEFAULT 'dark',
  subdomain text DEFAULT '',
  custom_domain text DEFAULT '',
  selected_photos jsonb DEFAULT '[]'::jsonb,
  seo_data jsonb DEFAULT '{}'::jsonb,
  is_published boolean DEFAULT false,
  build_status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.photographer_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own websites"
  ON public.photographer_websites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.website_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id uuid REFERENCES public.photographer_websites(id) ON DELETE CASCADE NOT NULL,
  photographer_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  message text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers can view own leads"
  ON public.website_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = photographer_id);

CREATE POLICY "Public can submit leads"
  ON public.website_leads FOR INSERT
  TO public
  WITH CHECK (true);
