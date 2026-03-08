
-- Create studio-website-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-website-assets', 'studio-website-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own website assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'studio-website-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own website assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'studio-website-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own website assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'studio-website-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (website is public)
CREATE POLICY "Public can view website assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'studio-website-assets');
