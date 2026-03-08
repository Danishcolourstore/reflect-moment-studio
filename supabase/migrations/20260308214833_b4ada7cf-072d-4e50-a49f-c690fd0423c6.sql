
ALTER TABLE public.studio_profiles
ADD COLUMN IF NOT EXISTS website_images jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.studio_profiles.website_images IS 'Stores website template image URLs organized by section: { hero_cover: "url", about_photo: "url", portfolio_photos: ["url1","url2"], featured_photos: ["url1","url2"] }';
