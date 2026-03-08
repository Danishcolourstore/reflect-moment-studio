
ALTER TABLE public.studio_profiles 
ADD COLUMN IF NOT EXISTS heading_font text DEFAULT 'Cormorant Garamond',
ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'Jost',
ADD COLUMN IF NOT EXISTS brand_preset text DEFAULT 'editorial-vogue',
ADD COLUMN IF NOT EXISTS custom_domain text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_logo_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS watermark_opacity integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS watermark_position text DEFAULT 'bottom-right',
ADD COLUMN IF NOT EXISTS brand_assets jsonb DEFAULT '[]'::jsonb;
