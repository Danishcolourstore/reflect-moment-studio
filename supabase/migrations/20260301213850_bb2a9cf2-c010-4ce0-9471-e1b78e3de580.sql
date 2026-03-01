
-- 1. Create guest-selfies storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('guest-selfies', 'guest-selfies', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can upload selfies
CREATE POLICY "Anyone can upload guest selfies"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'guest-selfies');

-- Storage RLS: anyone can read their own selfies (service role reads all)
CREATE POLICY "Anyone can read guest selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'guest-selfies');

-- 2. Referrals RLS policies
CREATE POLICY "Users can insert own referrals"
ON public.referrals FOR INSERT
TO authenticated
WITH CHECK (referrer_id = auth.uid());

CREATE POLICY "Users can update own referrals"
ON public.referrals FOR UPDATE
TO authenticated
USING (referrer_id = auth.uid())
WITH CHECK (referrer_id = auth.uid());

-- 3. Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guest_selections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;

-- 4. Create unique index on events.slug for demo event conflict handling
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique ON public.events (slug);

-- 5. Insert demo event (uses a nil UUID as placeholder owner)
INSERT INTO public.events (user_id, name, slug, is_published, event_type, gallery_layout)
VALUES ('00000000-0000-0000-0000-000000000000', 'MirrorAI Demo Gallery', 'demo', true, 'Demo', 'masonry')
ON CONFLICT (slug) DO NOTHING;

-- 6. Prevent demo event deletion
CREATE POLICY "Prevent demo deletion"
ON public.events FOR DELETE
USING (slug != 'demo' OR auth.uid() IS NULL);
