
-- Albums table
CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Album',
  size text NOT NULL DEFAULT '12x12',
  cover_type text NOT NULL DEFAULT 'hardcover',
  leaf_count integer NOT NULL DEFAULT 30,
  page_count integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own albums" ON public.albums
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Album pages table
CREATE TABLE public.album_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  page_number integer NOT NULL DEFAULT 0,
  spread_index integer NOT NULL DEFAULT 0,
  background_color text DEFAULT '#ffffff',
  paper_texture text DEFAULT 'white',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.album_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own album pages" ON public.album_pages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.albums WHERE albums.id = album_pages.album_id AND albums.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.albums WHERE albums.id = album_pages.album_id AND albums.user_id = auth.uid()));

-- Album layers table
CREATE TABLE public.album_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.album_pages(id) ON DELETE CASCADE,
  layer_type text NOT NULL DEFAULT 'photo',
  photo_id uuid REFERENCES public.photos(id) ON DELETE SET NULL,
  text_content text,
  x double precision NOT NULL DEFAULT 0,
  y double precision NOT NULL DEFAULT 0,
  width double precision NOT NULL DEFAULT 100,
  height double precision NOT NULL DEFAULT 100,
  rotation double precision NOT NULL DEFAULT 0,
  z_index integer NOT NULL DEFAULT 0,
  settings_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.album_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own album layers" ON public.album_layers
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.album_pages ap
    JOIN public.albums a ON a.id = ap.album_id
    WHERE ap.id = album_layers.page_id AND a.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.album_pages ap
    JOIN public.albums a ON a.id = ap.album_id
    WHERE ap.id = album_layers.page_id AND a.user_id = auth.uid()
  ));

-- Auto-update updated_at on albums
CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
