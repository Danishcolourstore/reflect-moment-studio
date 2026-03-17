
-- Feature 9: AI Reply Drafts
CREATE TABLE public.ai_reply_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lead_id UUID,
  lead_name TEXT NOT NULL,
  lead_message TEXT,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  draft_reply TEXT NOT NULL,
  pricing_context JSONB DEFAULT '{}',
  availability_context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature 10: Pricing Intelligence
CREATE TABLE public.pricing_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'wedding',
  user_price_cents INTEGER NOT NULL DEFAULT 0,
  local_avg_cents INTEGER NOT NULL DEFAULT 0,
  local_median_cents INTEGER NOT NULL DEFAULT 0,
  percentile_rank INTEGER NOT NULL DEFAULT 50,
  city TEXT,
  sample_size INTEGER NOT NULL DEFAULT 0,
  trend TEXT DEFAULT 'stable',
  insight TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature 11: Business Health Scores
CREATE TABLE public.business_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 50,
  lead_volume INTEGER NOT NULL DEFAULT 0,
  lead_volume_change INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  conversion_avg NUMERIC(5,2) NOT NULL DEFAULT 0,
  revenue_forecast_cents INTEGER NOT NULL DEFAULT 0,
  revenue_confirmed_cents INTEGER NOT NULL DEFAULT 0,
  gallery_views INTEGER NOT NULL DEFAULT 0,
  gallery_views_change INTEGER NOT NULL DEFAULT 0,
  response_time_hrs NUMERIC(5,1) NOT NULL DEFAULT 0,
  insights JSONB DEFAULT '[]',
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Feature 12: Smart Nudges
CREATE TABLE public.smart_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nudge_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT DEFAULT '💡',
  priority TEXT NOT NULL DEFAULT 'medium',
  action_type TEXT,
  action_data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_reply_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reply drafts" ON public.ai_reply_drafts
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own pricing intelligence" ON public.pricing_intelligence
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts pricing intelligence" ON public.pricing_intelligence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own health scores" ON public.business_health_scores
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts health scores" ON public.business_health_scores
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own nudges" ON public.smart_nudges
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
