import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface InstagramSnapshot {
  id: string;
  period: string;
  followers: number;
  followers_gained: number;
  reach: number;
  profile_visits: number;
  likes: number;
  saves: number;
  shares: number;
  comments: number;
  link_clicks: number;
  reels_count: number;
  posts_count: number;
  stories_count: number;
  snapshot_date: string;
  notes: string | null;
  created_at: string;
}

export interface InstagramCompetitor {
  id: string;
  username: string;
  display_name: string | null;
  followers: number;
  avg_likes: number;
  avg_comments: number;
  posts_per_week: number;
  reels_percentage: number;
  content_focus: string | null;
  last_updated: string;
}

export interface GrowthScore {
  total: number;
  engagement: number;
  consistency: number;
  growth: number;
  competitiveness: number;
}

export function useInstagramIntelligence() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<InstagramSnapshot[]>([]);
  const [competitors, setCompetitors] = useState<InstagramCompetitor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [snapRes, compRes] = await Promise.all([
      (supabase.from('instagram_snapshots').select('*') as any)
        .eq('photographer_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(20),
      (supabase.from('instagram_competitors').select('*') as any)
        .eq('photographer_id', user.id)
        .order('created_at', { ascending: true }),
    ]);

    setSnapshots((snapRes.data || []) as InstagramSnapshot[]);
    setCompetitors((compRes.data || []) as InstagramCompetitor[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addSnapshot = useCallback(async (data: Partial<InstagramSnapshot>) => {
    if (!user) return;
    const { error } = await supabase.from('instagram_snapshots').insert({
      ...data, photographer_id: user.id,
    } as any);
    if (error) { toast.error('Failed to save snapshot'); return; }
    toast.success('Snapshot saved');
    loadAll();
  }, [user, loadAll]);

  const addCompetitor = useCallback(async (data: Partial<InstagramCompetitor>) => {
    if (!user) return;
    const { error } = await supabase.from('instagram_competitors').insert({
      ...data, photographer_id: user.id,
    } as any);
    if (error) {
      if (error.code === '23505') toast.info('Competitor already added');
      else toast.error('Failed to add competitor');
      return;
    }
    toast.success('Competitor added');
    loadAll();
  }, [user, loadAll]);

  const updateCompetitor = useCallback(async (id: string, data: Partial<InstagramCompetitor>) => {
    await (supabase.from('instagram_competitors').update({
      ...data, last_updated: new Date().toISOString(),
    } as any).eq('id', id));
    loadAll();
  }, [loadAll]);

  const removeCompetitor = useCallback(async (id: string) => {
    await (supabase.from('instagram_competitors').delete() as any).eq('id', id);
    setCompetitors(prev => prev.filter(c => c.id !== id));
    toast.success('Competitor removed');
  }, []);

  // Compute growth score
  const computeGrowthScore = useCallback((): GrowthScore => {
    if (snapshots.length === 0) return { total: 0, engagement: 0, consistency: 0, growth: 0, competitiveness: 0 };

    const latest = snapshots[0];
    const totalEngagement = latest.likes + latest.saves + latest.shares + latest.comments;
    const engagementRate = latest.followers > 0 ? (totalEngagement / latest.followers) * 100 : 0;

    // Engagement score (0-25) - 5%+ rate = full score
    const engagement = Math.min(25, Math.round((engagementRate / 5) * 25));

    // Consistency score (0-25) - based on content frequency
    const totalContent = latest.reels_count + latest.posts_count + latest.stories_count;
    const consistency = Math.min(25, Math.round((totalContent / 10) * 25));

    // Growth score (0-25) - follower growth
    const growthRate = latest.followers > 0 ? (latest.followers_gained / latest.followers) * 100 : 0;
    const growth = Math.min(25, Math.round((growthRate / 3) * 25));

    // Competitiveness (0-25)
    let competitiveness = 15; // Default moderate
    if (competitors.length > 0) {
      const avgCompFollowers = competitors.reduce((s, c) => s + c.followers, 0) / competitors.length;
      const ratio = latest.followers / Math.max(avgCompFollowers, 1);
      competitiveness = Math.min(25, Math.round(ratio * 15));
    }

    return {
      total: engagement + consistency + growth + competitiveness,
      engagement, consistency, growth, competitiveness,
    };
  }, [snapshots, competitors]);

  // Generate insights
  const generateInsights = useCallback((): string[] => {
    const insights: string[] = [];
    if (snapshots.length === 0) return ['Add your first performance snapshot to get insights'];

    const latest = snapshots[0];
    const prev = snapshots.length > 1 ? snapshots[1] : null;

    // Reach trend
    if (prev) {
      const reachChange = prev.reach > 0 ? Math.round(((latest.reach - prev.reach) / prev.reach) * 100) : 0;
      if (reachChange > 0) insights.push(`📈 Your reach increased by ${reachChange}% — keep doing what works`);
      else if (reachChange < -10) insights.push(`📉 Your reach dropped by ${Math.abs(reachChange)}% — improve your opening hooks`);
    }

    // Saves analysis
    const totalEngagement = latest.likes + latest.saves + latest.shares + latest.comments;
    if (totalEngagement > 0) {
      const saveRatio = latest.saves / totalEngagement;
      if (saveRatio < 0.1) insights.push('💡 Saves are low — create more valuable, saveable content');
      else if (saveRatio > 0.3) insights.push('🔥 High save rate — your content is valuable to followers');
    }

    // Content mix
    const totalContent = latest.reels_count + latest.posts_count;
    if (totalContent > 0 && latest.reels_count / totalContent < 0.3) {
      insights.push('🎬 Post more reels — they get 2x reach compared to photos');
    }

    // Posting frequency
    if (totalContent < 3) insights.push('📅 Post at least 4 times per week for better algorithm favor');

    // Follower growth
    if (latest.followers_gained < 0) insights.push('⚠️ Losing followers — focus on quality content and engagement');
    else if (latest.followers_gained > 50) insights.push(`🎯 Great growth! ${latest.followers_gained} new followers`);

    // Competitor comparison
    if (competitors.length > 0) {
      const avgCompPosts = competitors.reduce((s, c) => s + c.posts_per_week, 0) / competitors.length;
      const userPosts = latest.period === 'weekly' ? totalContent : totalContent / 4;
      if (avgCompPosts > userPosts * 1.5) {
        insights.push(`⚡ Competitors post ${avgCompPosts.toFixed(0)} times/week — you post ${userPosts.toFixed(0)}. Increase frequency!`);
      }

      const avgCompLikes = competitors.reduce((s, c) => s + c.avg_likes, 0) / competitors.length;
      if (latest.likes > 0 && avgCompLikes > latest.likes * 1.5) {
        insights.push('🏆 Competitor engagement is higher — try candid, behind-the-scenes content');
      }
    }

    if (insights.length === 0) insights.push('✅ Your Instagram strategy looks solid. Keep creating!');

    return insights;
  }, [snapshots, competitors]);

  return {
    snapshots, competitors, loading,
    addSnapshot, addCompetitor, updateCompetitor, removeCompetitor,
    computeGrowthScore, generateInsights, reload: loadAll,
  };
}
