
-- AI Developer Console Tables

-- Store AI development prompts and generated code
CREATE TABLE public.ai_developer_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  generated_code TEXT,
  file_changes JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  rollback_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_developer_prompts ENABLE ROW LEVEL SECURITY;

-- Only Super Admin can access
CREATE POLICY "Super Admin manage AI prompts" ON public.ai_developer_prompts
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_developer_prompts;

-- Create index for faster lookups
CREATE INDEX idx_ai_developer_prompts_user_id ON public.ai_developer_prompts(user_id);
CREATE INDEX idx_ai_developer_prompts_status ON public.ai_developer_prompts(status);
