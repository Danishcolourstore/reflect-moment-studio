
-- Client milestones (anniversaries, birthdays, baby milestones)
CREATE TABLE public.client_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL,
  milestone_type text NOT NULL DEFAULT 'anniversary',
  title text NOT NULL,
  milestone_date date NOT NULL,
  recurring boolean NOT NULL DEFAULT true,
  notes text,
  partner_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own milestones" ON public.client_milestones
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

-- Client reminders (auto-generated + manual)
CREATE TABLE public.client_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.client_milestones(id) ON DELETE SET NULL,
  reminder_type text NOT NULL DEFAULT 'anniversary',
  title text NOT NULL,
  message text,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  action_type text DEFAULT 'whatsapp',
  action_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.client_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own reminders" ON public.client_reminders
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

-- Client timeline events (activity log)
CREATE TABLE public.client_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own timeline" ON public.client_timeline
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

-- Message templates
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  template_type text NOT NULL DEFAULT 'anniversary',
  title text NOT NULL,
  message_body text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

CREATE POLICY "Public can view default templates" ON public.message_templates
  FOR SELECT TO public
  USING (is_default = true);

-- Follow-up automation rules
CREATE TABLE public.follow_up_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id uuid NOT NULL,
  rule_type text NOT NULL,
  trigger_days integer NOT NULL DEFAULT 3,
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  auto_send boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photographers manage own rules" ON public.follow_up_rules
  FOR ALL TO authenticated
  USING (auth.uid() = photographer_id)
  WITH CHECK (auth.uid() = photographer_id);

-- Indexes
CREATE INDEX idx_client_milestones_client ON public.client_milestones(client_id);
CREATE INDEX idx_client_milestones_date ON public.client_milestones(milestone_date);
CREATE INDEX idx_client_reminders_photographer ON public.client_reminders(photographer_id);
CREATE INDEX idx_client_reminders_due ON public.client_reminders(due_date);
CREATE INDEX idx_client_reminders_status ON public.client_reminders(status);
CREATE INDEX idx_client_timeline_client ON public.client_timeline(client_id);
CREATE INDEX idx_message_templates_photographer ON public.message_templates(photographer_id);
