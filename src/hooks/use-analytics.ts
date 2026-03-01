import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAnalytics(eventId: string | undefined) {
  const trackView = useCallback(async () => {
    if (!eventId) return;
    const key = `mirrorai_viewed_${eventId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'true');

    // Increment views on events table
    const { data: evData } = await (supabase
      .from('events')
      .select('views') as any)
      .eq('id', eventId)
      .maybeSingle();
    const currentViews = (evData as any)?.views ?? 0;
    await (supabase.from('events').update({ views: currentViews + 1 } as any) as any).eq('id', eventId);

    // Upsert event_analytics
    const { data: existing } = await (supabase
      .from('event_analytics' as any)
      .select('id, gallery_views') as any)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      await (supabase
        .from('event_analytics' as any)
        .update({ gallery_views: (existing as any).gallery_views + 1, updated_at: new Date().toISOString() } as any) as any)
        .eq('event_id', eventId);
    } else {
      await (supabase
        .from('event_analytics' as any)
        .insert({ event_id: eventId, gallery_views: 1 } as any) as any);
    }
  }, [eventId]);

  const trackFavoriteChange = useCallback(async () => {
    if (!eventId) return;
    const { count } = await (supabase
      .from('favorites' as any)
      .select('*', { count: 'exact', head: true }) as any)
      .eq('event_id', eventId);

    const { data: existing } = await (supabase
      .from('event_analytics' as any)
      .select('id') as any)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      await (supabase
        .from('event_analytics' as any)
        .update({ favorites_count: count ?? 0, updated_at: new Date().toISOString() } as any) as any)
        .eq('event_id', eventId);
    } else {
      await (supabase
        .from('event_analytics' as any)
        .insert({ event_id: eventId, favorites_count: count ?? 0 } as any) as any);
    }
  }, [eventId]);

  const trackDownload = useCallback(async () => {
    if (!eventId) return;
    const { data: existing } = await (supabase
      .from('event_analytics' as any)
      .select('id, downloads_count') as any)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      await (supabase
        .from('event_analytics' as any)
        .update({ downloads_count: (existing as any).downloads_count + 1, updated_at: new Date().toISOString() } as any) as any)
        .eq('event_id', eventId);
    } else {
      await (supabase
        .from('event_analytics' as any)
        .insert({ event_id: eventId, downloads_count: 1 } as any) as any);
    }
  }, [eventId]);

  return { trackView, trackFavoriteChange, trackDownload };
}
