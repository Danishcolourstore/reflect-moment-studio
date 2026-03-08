CREATE INDEX IF NOT EXISTS idx_album_pages_album_id ON public.album_pages (album_id);
CREATE INDEX IF NOT EXISTS idx_album_layers_page_id ON public.album_layers (page_id);