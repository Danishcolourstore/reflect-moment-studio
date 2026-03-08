
ALTER TABLE public.website_templates 
  ADD COLUMN IF NOT EXISTS styling_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'wedding',
  ADD COLUMN IF NOT EXISTS preview_image_url text;
