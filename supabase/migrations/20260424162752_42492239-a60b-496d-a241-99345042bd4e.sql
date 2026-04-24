DROP POLICY IF EXISTS "Authenticated users can upload live event photos" ON storage.objects;

CREATE POLICY "Authenticated users can upload live event photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-photos'
  AND (storage.foldername(name))[1] = 'events'
  AND (storage.foldername(name))[3] = 'live'
  AND EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id::text = (storage.foldername(name))[2]
      AND e.user_id = auth.uid()
  )
);