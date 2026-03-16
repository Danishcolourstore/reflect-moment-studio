import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type Suggestion = {
  id: string;
  suggestion_type: string;
  title: string;
  body: string;
  action_data: any;
  is_dismissed: boolean;
  is_acted: boolean;
  created_at: string;
};

export function useStudioBrain() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadSuggestions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('studio_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10) as any;

    const items = (data || []) as Suggestion[];
    setSuggestions(items);
    setUnreadCount(items.filter(s => !s.is_acted).length);
  }, [user]);

  const generateSuggestions = useCallback(async () => {
    if (!user) return;

    // Check for galleries with favorites but no album
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .limit(20) as any;

    if (!events || events.length === 0) return;

    for (const event of events) {
      // Check if favorites exist
      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id) as any;

      if (favCount && favCount > 0) {
        // Check if album exists
        const { count: albumCount } = await supabase
          .from('albums')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('user_id', user.id) as any;

        if (!albumCount || albumCount === 0) {
          // Check if suggestion already exists
          const { count: existingSugg } = await supabase
            .from('studio_suggestions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('suggestion_type', 'album_from_selections')
            .eq('is_dismissed', false) as any;

          if (!existingSugg || existingSugg === 0) {
            await supabase.from('studio_suggestions').insert({
              user_id: user.id,
              suggestion_type: 'album_from_selections',
              title: 'Album ready to build',
              body: `Your clients selected ${favCount} photos for "${event.name}". Want to start building the album?`,
              action_data: { event_id: event.id, event_name: event.name, photo_count: favCount },
            } as any);
          }
        }
      }

      // Check gallery not shared (photos > 0, created > 24h ago)
      if (event.name) {
        const { count: photoCount } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id) as any;

        if (photoCount && photoCount > 5) {
          const { count: viewCount } = await supabase
            .from('event_views')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id) as any;

          if (!viewCount || viewCount === 0) {
            const { count: existingSugg } = await supabase
              .from('studio_suggestions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('suggestion_type', 'share_gallery')
              .eq('is_dismissed', false) as any;

            if (!existingSugg || existingSugg === 0) {
              await supabase.from('studio_suggestions').insert({
                user_id: user.id,
                suggestion_type: 'share_gallery',
                title: 'Gallery ready to share',
                body: `"${event.name}" has ${photoCount} photos but hasn't been viewed by clients yet.`,
                action_data: { event_id: event.id, event_name: event.name, photo_count: photoCount },
              } as any);
            }
          }
        }
      }
    }

    await loadSuggestions();
  }, [user, loadSuggestions]);

  const dismissSuggestion = useCallback(async (id: string) => {
    await supabase.from('studio_suggestions').update({ is_dismissed: true } as any).eq('id', id);
    setSuggestions(prev => prev.filter(s => s.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const actOnSuggestion = useCallback(async (id: string) => {
    await supabase.from('studio_suggestions').update({ is_acted: true } as any).eq('id', id);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, is_acted: true } : s));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Run on mount with delay
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      generateSuggestions();
    }, 5000);
    return () => clearTimeout(timer);
  }, [user]);

  return {
    suggestions,
    unreadCount,
    loadSuggestions,
    dismissSuggestion,
    actOnSuggestion,
  };
}
