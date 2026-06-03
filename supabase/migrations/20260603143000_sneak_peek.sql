-- Sneak peek auto-scheduler schema
-- studio_id stores the photographer user id (events.user_id)

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ceremony_end_time timestamptz,
  ADD COLUMN IF NOT EXISTS sneak_peek_delay_hours integer NOT NULL DEFAULT 2;

DROP TABLE IF EXISTS public.sneak_peeks;

CREATE TABLE public.sneak_peeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  photo_ids uuid[] NOT NULL DEFAULT '{}',
  recipient_name text NOT NULL,
  recipient_whatsapp text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sneak_peeks_status_check CHECK (
    status IN ('scheduled', 'sent', 'failed', 'cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_sneak_peeks_event_id ON public.sneak_peeks(event_id);
CREATE INDEX IF NOT EXISTS idx_sneak_peeks_studio_id ON public.sneak_peeks(studio_id);
CREATE INDEX IF NOT EXISTS idx_sneak_peeks_scheduled ON public.sneak_peeks(status, scheduled_at)
  WHERE status = 'scheduled';

ALTER TABLE public.sneak_peeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view sneak peeks"
  ON public.sneak_peeks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = sneak_peeks.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can insert sneak peeks"
  ON public.sneak_peeks
  FOR INSERT
  WITH CHECK (
    studio_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = sneak_peeks.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can update sneak peeks"
  ON public.sneak_peeks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = sneak_peeks.event_id
        AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can delete sneak peeks"
  ON public.sneak_peeks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = sneak_peeks.event_id
        AND events.user_id = auth.uid()
    )
  );
