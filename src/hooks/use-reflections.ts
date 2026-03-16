import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReflectionPost {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  card_type: string;
  tag: string | null;
  cta_label: string | null;
  cta_action: string | null;
  cta_route: string | null;
  tab: string;
  is_today: boolean;
  is_pinned: boolean;
  sort_order: number;
  created_at: string;
  saved?: boolean;
}

export function useReflections() {
  const [posts, setPosts] = useState<ReflectionPost[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [postsRes, savedRes] = await Promise.all([
      (supabase.from('reflections_posts' as any).select('*') as any)
        .eq('is_published', true)
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: [] };
        return (supabase.from('reflections_saved' as any).select('post_id') as any).eq('user_id', user.id);
      }),
    ]);

    const saved = new Set<string>((savedRes.data || []).map((s: any) => s.post_id));
    setSavedIds(saved);

    const mapped = (postsRes.data || []).map((p: any) => ({
      ...p,
      saved: saved.has(p.id),
    })) as ReflectionPost[];

    setPosts(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleSave = useCallback(async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isSaved = savedIds.has(postId);
    if (isSaved) {
      await (supabase.from('reflections_saved' as any).delete() as any)
        .eq('user_id', user.id)
        .eq('post_id', postId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(postId); return n; });
    } else {
      await (supabase.from('reflections_saved' as any).insert({ user_id: user.id, post_id: postId }) as any);
      setSavedIds(prev => new Set(prev).add(postId));
    }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, saved: !isSaved } : p));
  }, [savedIds]);

  const hasNew = posts.some(p => p.tag === 'new');

  return { posts, loading, toggleSave, hasNew, refresh: fetchAll };
}
