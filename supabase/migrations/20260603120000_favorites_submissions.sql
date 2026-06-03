-- Guest favorites submissions (WhatsApp / gallery flow)
CREATE TABLE IF NOT EXISTS public.favorites_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name text,
  whatsapp_number text,
  photo_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  message text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_favorites_submissions_event_id
  ON public.favorites_submissions(event_id);

CREATE INDEX IF NOT EXISTS idx_favorites_submissions_submitted_at
  ON public.favorites_submissions(submitted_at DESC);

ALTER TABLE public.favorites_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert favorites submissions"
  ON public.favorites_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Event owners can view favorites submissions"
  ON public.favorites_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.events
      WHERE events.id = favorites_submissions.event_id
        AND events.user_id = auth.uid()
    )
  );
