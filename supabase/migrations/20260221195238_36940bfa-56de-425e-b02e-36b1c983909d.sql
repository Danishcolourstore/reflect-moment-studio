
-- Fix events: drop restrictive public SELECT policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (is_published = true);

-- Fix photos: drop restrictive public SELECT policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Public can view photos" ON public.photos;
CREATE POLICY "Public can view photos"
  ON public.photos FOR SELECT
  USING (true);

-- Fix profiles: add permissive public read for studio_name (needed for watermark display)
CREATE POLICY "Public can read profiles for watermark"
  ON public.profiles FOR SELECT
  USING (true);
