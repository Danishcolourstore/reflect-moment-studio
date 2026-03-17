import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───
export interface AIReplyDraft {
  id: string;
  lead_name: string;
  lead_message: string | null;
  channel: string;
  draft_reply: string;
  pricing_context: any;
  availability_context: any;
  status: string;
  created_at: string;
}

export interface PricingInsight {
  id: string;
  category: string;
  user_price_cents: number;
  local_avg_cents: number;
  local_median_cents: number;
  percentile_rank: number;
  city: string | null;
  sample_size: number;
  trend: string;
  insight: string | null;
  generated_at: string;
}

export interface BusinessHealthScore {
  id: string;
  overall_score: number;
  lead_volume: number;
  lead_volume_change: number;
  conversion_rate: number;
  conversion_avg: number;
  revenue_forecast_cents: number;
  revenue_confirmed_cents: number;
  gallery_views: number;
  gallery_views_change: number;
  response_time_hrs: number;
  insights: any[];
  week_start: string;
  created_at: string;
}

export interface SmartNudge {
  id: string;
  nudge_type: string;
  title: string;
  body: string;
  icon: string;
  priority: string;
  action_type: string | null;
  action_data: any;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// ─── AI Reply Drafts ───
export function useAIReplyDrafts() {
  const [drafts, setDrafts] = useState<AIReplyDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDrafts = useCallback(async () => {
    const { data } = await (supabase.from('ai_reply_drafts' as any).select('*') as any)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    setDrafts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const generateReply = useCallback(async (leadName: string, leadMessage: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('entiran-business', {
        body: { action: 'generate_reply', leadName, leadMessage },
      });
      if (data?.draft) {
        await fetchDrafts();
      }
      return data;
    } finally {
      setGenerating(false);
    }
  }, [fetchDrafts]);

  const markSent = useCallback(async (draftId: string) => {
    await (supabase.from('ai_reply_drafts' as any).update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    }) as any).eq('id', draftId);
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  }, []);

  const dismissDraft = useCallback(async (draftId: string) => {
    await (supabase.from('ai_reply_drafts' as any).update({ status: 'dismissed' }) as any).eq('id', draftId);
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  }, []);

  return { drafts, loading, generating, generateReply, markSent, dismissDraft, refresh: fetchDrafts };
}

// ─── Pricing Intelligence ───
export function usePricingIntelligence() {
  const [insights, setInsights] = useState<PricingInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from('pricing_intelligence' as any).select('*') as any)
      .order('generated_at', { ascending: false })
      .limit(5)
      .then(({ data }: any) => {
        setInsights(data || []);
        setLoading(false);
      });
  }, []);

  const requestAnalysis = useCallback(async () => {
    const { data } = await supabase.functions.invoke('entiran-business', {
      body: { action: 'pricing_analysis' },
    });
    return data;
  }, []);

  return { insights, loading, requestAnalysis };
}

// ─── Business Health Score ───
export function useBusinessHealthScore() {
  const [score, setScore] = useState<BusinessHealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from('business_health_scores' as any).select('*') as any)
      .order('week_start', { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        setScore(data?.[0] || null);
        setLoading(false);
      });
  }, []);

  return { score, loading };
}

// ─── Smart Nudges ───
export function useSmartNudges() {
  const [nudges, setNudges] = useState<SmartNudge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNudges = useCallback(async () => {
    const { data } = await (supabase.from('smart_nudges' as any).select('*') as any)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setNudges(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNudges(); }, [fetchNudges]);

  const dismissNudge = useCallback(async (nudgeId: string) => {
    await (supabase.from('smart_nudges' as any).update({ is_dismissed: true }) as any).eq('id', nudgeId);
    setNudges(prev => prev.filter(n => n.id !== nudgeId));
  }, []);

  const markRead = useCallback(async (nudgeId: string) => {
    await (supabase.from('smart_nudges' as any).update({ is_read: true }) as any).eq('id', nudgeId);
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, is_read: true } : n));
  }, []);

  return { nudges, loading, dismissNudge, markRead, refresh: fetchNudges };
}
