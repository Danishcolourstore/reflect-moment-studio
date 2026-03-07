
CREATE TABLE public.gallery_text_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  paragraph TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  font_family TEXT DEFAULT 'Cormorant Garamond',
  font_size TEXT DEFAULT '24px',
  font_weight TEXT DEFAULT '400',
  text_color TEXT DEFAULT '#1a1a1a',
  text_align TEXT DEFAULT 'center',
  letter_spacing TEXT DEFAULT '0.05em',
  line_height TEXT DEFAULT '1.6',
  bg_style TEXT DEFAULT 'transparent',
  template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_text_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owners can manage text blocks" ON public.gallery_text_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = gallery_text_blocks.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Public can view text blocks" ON public.gallery_text_blocks
  FOR SELECT USING (true);
