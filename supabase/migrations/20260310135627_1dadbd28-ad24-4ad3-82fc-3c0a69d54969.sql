-- Fix platform_settings RLS: allow super_admin full access and public read
CREATE POLICY "Super admin can manage platform settings"
ON public.platform_settings
FOR ALL
TO public
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow all authenticated users to read settings (needed for feature flags)
CREATE POLICY "Authenticated users can read platform settings"
ON public.platform_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow anon to read settings (for public-facing feature checks)  
CREATE POLICY "Public can read platform settings"
ON public.platform_settings
FOR SELECT
TO anon
USING (true);