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

export interface PresetItem {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: string;
  preview_images: string[];
  before_after_pairs: any[];
  price_cents: number;
  currency: string;
  download_count: number;
  rating_avg: number;
  rating_count: number;
  tags: string[];
  is_featured: boolean;
  created_at: string;
  purchased?: boolean;
}

export interface MoodBoardDrop {
  id: string;
  title: string;
  subtitle: string | null;
  theme: string;
  cover_image: string | null;
  week_number: number;
  year: number;
  lighting_tip: string | null;
  pose_suggestion: string | null;
  color_palette: string[];
  reference_images: any[];
  recommended_preset_id: string | null;
  created_at: string;
}

export interface UserCollection {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  icon: string;
  is_private: boolean;
  item_count: number;
  created_at: string;
}

export interface PhotographerSpotlight {
  id: string;
  photographer_name: string;
  tagline: string | null;
  story: string;
  style_description: string | null;
  portrait_url: string | null;
  showcase_images: string[];
  specialties: string[];
  gallery_url: string | null;
  booking_url: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  packages: any[];
  week_number: number;
  year: number;
  created_at: string;
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

// ─── Preset Marketplace Hook ───
export function usePresetMarketplace() {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPresets = useCallback(async () => {
    const [presetsRes, purchasesRes] = await Promise.all([
      (supabase.from('preset_marketplace' as any).select('*') as any)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('download_count', { ascending: false }),
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return { data: [] };
        return (supabase.from('preset_purchases' as any).select('preset_id') as any).eq('user_id', user.id);
      }),
    ]);

    const purchased = new Set<string>((purchasesRes.data || []).map((p: any) => p.preset_id));
    setPurchasedIds(purchased);

    setPresets((presetsRes.data || []).map((p: any) => ({ ...p, purchased: purchased.has(p.id) })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchPresets(); }, [fetchPresets]);

  const purchasePreset = useCallback(async (presetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    await (supabase.from('preset_purchases' as any).insert({
      user_id: user.id,
      preset_id: presetId,
      amount_cents: preset.price_cents,
    }) as any);

    setPurchasedIds(prev => new Set(prev).add(presetId));
    setPresets(prev => prev.map(p => p.id === presetId ? { ...p, purchased: true } : p));
  }, [presets]);

  return { presets, loading, purchasePreset, purchasedIds };
}

// ─── Mood Board Drops Hook ───
export function useMoodBoardDrops() {
  const [drops, setDrops] = useState<MoodBoardDrop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from('mood_board_drops' as any).select('*') as any)
      .eq('is_published', true)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(8)
      .then(({ data }: any) => {
        setDrops(data || []);
        setLoading(false);
      });
  }, []);

  return { drops, loading };
}

// ─── Collections Hook ───
export function useCollections() {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await (supabase.from('user_collections' as any).select('*') as any)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    setCollections(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const createCollection = useCallback(async (name: string, icon: string = '📁') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await (supabase.from('user_collections' as any).insert({
      user_id: user.id,
      name,
      icon,
    }).select() as any);

    if (data?.[0]) {
      setCollections(prev => [data[0], ...prev]);
      return data[0];
    }
    return null;
  }, []);

  const addToCollection = useCallback(async (collectionId: string, item: {
    item_type: string;
    item_id: string;
    item_title?: string;
    item_image?: string;
    item_data?: any;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase.from('collection_items' as any).insert({
      collection_id: collectionId,
      user_id: user.id,
      ...item,
    }) as any);

    // Update item count
    const col = collections.find(c => c.id === collectionId);
    if (col) {
      await (supabase.from('user_collections' as any).update({
        item_count: col.item_count + 1,
        updated_at: new Date().toISOString(),
      }) as any).eq('id', collectionId);
      setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, item_count: c.item_count + 1 } : c));
    }
  }, [collections]);

  const deleteCollection = useCallback(async (id: string) => {
    await (supabase.from('user_collections' as any).delete() as any).eq('id', id);
    setCollections(prev => prev.filter(c => c.id !== id));
  }, []);

  return { collections, loading, createCollection, addToCollection, deleteCollection, refresh: fetchCollections };
}

// ─── Photographer Spotlight Hook ───
export function usePhotographerSpotlight() {
  const [spotlight, setSpotlight] = useState<PhotographerSpotlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);

    (supabase.from('photographer_spotlights' as any).select('*') as any)
      .eq('is_published', true)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(1)
      .then(({ data }: any) => {
        setSpotlight(data?.[0] || null);
        setLoading(false);
      });
  }, []);

  return { spotlight, loading };
}
