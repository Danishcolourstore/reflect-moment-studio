
-- Create cheetah-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cheetah-photos', 'cheetah-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload cheetah photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cheetah-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read access for thumbnails/previews
CREATE POLICY "Public can view cheetah photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'cheetah-photos');

-- RLS: users can delete own photos
CREATE POLICY "Users can delete own cheetah photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cheetah-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
