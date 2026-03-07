
-- Allow authenticated users to upload studio covers in event-covers bucket
-- Path pattern: studio-covers/{user_id}/...
CREATE POLICY "Users can upload studio covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = 'studio-covers'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Allow authenticated users to update/overwrite their studio covers
CREATE POLICY "Users can update studio covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = 'studio-covers'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Allow authenticated users to upload studio logos in event-covers bucket
CREATE POLICY "Users can upload studio logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = 'studio-logos'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Allow authenticated users to update/overwrite their studio logos
CREATE POLICY "Users can update studio logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-covers'
  AND (storage.foldername(name))[1] = 'studio-logos'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);
