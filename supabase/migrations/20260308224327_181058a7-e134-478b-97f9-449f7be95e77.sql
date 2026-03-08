
-- Allow super admins to upload template demo assets to studio-website-assets bucket
CREATE POLICY "Super admins can upload template assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'studio-website-assets'
  AND (storage.foldername(name))[1] = 'template-demos'
  AND public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can update template assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'studio-website-assets'
  AND (storage.foldername(name))[1] = 'template-demos'
  AND public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can delete template assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'studio-website-assets'
  AND (storage.foldername(name))[1] = 'template-demos'
  AND public.has_role(auth.uid(), 'super_admin'::app_role)
);
