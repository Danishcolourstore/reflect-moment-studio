
CREATE TABLE public.beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  message text NOT NULL,
  screenshot_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.beta_feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON public.beta_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins full access feedback" ON public.beta_feedback
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-screenshots', 'feedback-screenshots', true);

CREATE POLICY "Auth users can upload feedback screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feedback-screenshots');

CREATE POLICY "Public can view feedback screenshots"
  ON storage.objects FOR SELECT USING (bucket_id = 'feedback-screenshots');
