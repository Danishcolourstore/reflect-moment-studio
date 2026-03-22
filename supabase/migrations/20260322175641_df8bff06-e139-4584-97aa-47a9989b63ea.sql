
CREATE TABLE public.retouch_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  style_name TEXT NOT NULL,
  reference_image_url TEXT,
  parameters JSONB NOT NULL DEFAULT '{}',
  compression_confidence INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.retouch_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own styles" ON public.retouch_styles FOR ALL USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('reference-images', 'reference-images', true);

CREATE POLICY "Public read reference images" ON storage.objects FOR SELECT USING (bucket_id = 'reference-images');
CREATE POLICY "Anyone can upload reference images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reference-images');
CREATE POLICY "Anyone can delete reference images" ON storage.objects FOR DELETE USING (bucket_id = 'reference-images');
