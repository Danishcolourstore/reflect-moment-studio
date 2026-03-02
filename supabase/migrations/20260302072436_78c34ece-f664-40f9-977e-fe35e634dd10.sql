
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS footer_text TEXT;
ALTER TABLE public.studio_profiles ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'serif';

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS website_template TEXT DEFAULT 'editorial-studio';
