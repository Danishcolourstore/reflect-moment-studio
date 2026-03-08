
-- Contact inquiries table for public inquiry forms
CREATE TABLE public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  event_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an inquiry (public form)
CREATE POLICY "Public can insert inquiries"
  ON public.contact_inquiries FOR INSERT
  WITH CHECK (true);

-- Photographers can view their own inquiries
CREATE POLICY "Photographers can view own inquiries"
  ON public.contact_inquiries FOR SELECT
  USING (auth.uid() = photographer_id);

-- Photographers can delete own inquiries
CREATE POLICY "Photographers can delete own inquiries"
  ON public.contact_inquiries FOR DELETE
  USING (auth.uid() = photographer_id);
