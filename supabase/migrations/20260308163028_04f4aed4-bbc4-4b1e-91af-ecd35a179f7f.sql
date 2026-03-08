-- Allow public read of albums by share_token (for preview pages)
CREATE POLICY "Public can view albums by share_token"
ON public.albums
FOR SELECT
USING (share_token IS NOT NULL);

-- Allow public read of album_pages for shared albums
CREATE POLICY "Public can view pages of shared albums"
ON public.album_pages
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.albums
  WHERE albums.id = album_pages.album_id
  AND albums.share_token IS NOT NULL
));

-- Allow public read of album_layers for shared albums
CREATE POLICY "Public can view layers of shared albums"
ON public.album_layers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.album_pages ap
  JOIN public.albums a ON a.id = ap.album_id
  WHERE ap.id = album_layers.page_id
  AND a.share_token IS NOT NULL
));