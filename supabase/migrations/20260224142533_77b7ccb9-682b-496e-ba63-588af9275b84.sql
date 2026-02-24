
-- Fix: Change public read policies to PERMISSIVE so unauthenticated users can access published events and photos
-- Currently all policies are RESTRICTIVE (AND logic), which blocks public access

-- Drop and recreate the public events SELECT policy as PERMISSIVE
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (is_published = true);

-- Drop and recreate the public photos SELECT policy as PERMISSIVE  
DROP POLICY IF EXISTS "Public can view photos" ON public.photos;
CREATE POLICY "Public can view photos"
  ON public.photos FOR SELECT
  USING (true);

-- Also fix profiles public read (needed for watermark text)
DROP POLICY IF EXISTS "Public can read profiles for watermark" ON public.profiles;
CREATE POLICY "Public can read profiles for watermark"
  ON public.profiles FOR SELECT
  USING (true);
