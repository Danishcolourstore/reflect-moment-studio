
-- Entiran conversations
CREATE TABLE public.entiran_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page_context text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entiran_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conversations" ON public.entiran_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Entiran messages
CREATE TABLE public.entiran_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.entiran_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'chat',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entiran_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.entiran_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.entiran_conversations c WHERE c.id = entiran_messages.conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.entiran_conversations c WHERE c.id = entiran_messages.conversation_id AND c.user_id = auth.uid()));

-- Bug reports
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.entiran_conversations(id),
  description text NOT NULL,
  page_context text NOT NULL,
  device_type text,
  os text,
  browser text,
  screen_resolution text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bug reports" ON public.bug_reports
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Studio suggestions
CREATE TABLE public.studio_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_data jsonb,
  is_dismissed boolean NOT NULL DEFAULT false,
  is_acted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.studio_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own suggestions" ON public.studio_suggestions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_entiran_conversations_user ON public.entiran_conversations(user_id, created_at DESC);
CREATE INDEX idx_entiran_messages_conv ON public.entiran_messages(conversation_id, created_at);
CREATE INDEX idx_bug_reports_user ON public.bug_reports(user_id, created_at DESC);
CREATE INDEX idx_studio_suggestions_user ON public.studio_suggestions(user_id, is_dismissed, created_at DESC);

-- Storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('bug-screenshots', 'bug-screenshots', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Auth users upload bug screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bug-screenshots');
CREATE POLICY "Public read bug screenshots" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bug-screenshots');
