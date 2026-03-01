
-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'Admin',
  target TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow public access (admin gate is frontend-only)
CREATE POLICY "Public can manage activity log" ON public.admin_activity_log FOR ALL USING (true) WITH CHECK (true);

-- Create bulk_emails table
CREATE TABLE IF NOT EXISTS public.bulk_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  target TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage bulk emails" ON public.bulk_emails FOR ALL USING (true) WITH CHECK (true);
