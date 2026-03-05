
-- Storybooks table (draft stories, private to photographer)
CREATE TABLE public.storybooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Story',
  description text,
  cover_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.storybooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own storybooks" ON public.storybooks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storybook blocks (individual layout sections)
CREATE TABLE public.storybook_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storybook_id uuid NOT NULL REFERENCES public.storybooks(id) ON DELETE CASCADE,
  layout_type text NOT NULL DEFAULT 'hero-cover',
  sort_order integer NOT NULL DEFAULT 0,
  caption text,
  subtitle text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  event_id uuid REFERENCES public.events(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.storybook_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own storybook blocks" ON public.storybook_blocks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.storybooks s WHERE s.id = storybook_blocks.storybook_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.storybooks s WHERE s.id = storybook_blocks.storybook_id AND s.user_id = auth.uid()));

-- Trigger to update updated_at on storybooks
CREATE TRIGGER update_storybooks_updated_at
  BEFORE UPDATE ON public.storybooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
