
CREATE TABLE public.storybook_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_code text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.storybook_otp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.storybook_otp FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous select" ON public.storybook_otp FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous update" ON public.storybook_otp FOR UPDATE TO anon USING (true) WITH CHECK (true);
