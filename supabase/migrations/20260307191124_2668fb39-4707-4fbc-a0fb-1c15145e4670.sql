
ALTER TABLE public.studio_profiles
  ADD COLUMN IF NOT EXISTS section_order jsonb DEFAULT '["hero","portfolio","about","featured","services","contact","social"]'::jsonb,
  ADD COLUMN IF NOT EXISTS section_visibility jsonb DEFAULT '{"hero":true,"portfolio":true,"about":true,"featured":true,"services":false,"contact":true,"social":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS services_data jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS featured_gallery_ids text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS hero_button_label text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hero_button_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portfolio_layout text DEFAULT 'grid';
