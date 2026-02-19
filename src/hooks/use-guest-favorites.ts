import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGuestFavorites(eventId: string | undefined, sessionId: string | null) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load favorites from DB once session is ready
  useEffect(() => {
    if (!eventId || !sessionId) return;

    const load = async () => {
      const { data } = await (supabase
        .from('favorites' as any)
        .select('photo_id') as any)
        .eq('guest_session_id', sessionId);
      if (data) {
        setFavoriteIds(new Set((data as any[]).map((r: any) => r.photo_id)));
      }
      setLoaded(true);
    };
    load();
  }, [eventId, sessionId]);

  const toggleFavorite = useCallback(
    (photoId: string) => {
      if (!eventId || !sessionId) return;

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(photoId)) {
          next.delete(photoId);
          // Delete from DB (fire and forget)
          (supabase.from('favorites' as any).delete() as any)
            .eq('photo_id', photoId)
            .eq('guest_session_id', sessionId)
            .then();
        } else {
          next.add(photoId);
          // Insert to DB (fire and forget)
          (supabase.from('favorites' as any).insert({
            photo_id: photoId,
            event_id: eventId,
            guest_session_id: sessionId,
          } as any) as any).then();
        }
        return next;
      });
    },
    [eventId, sessionId],
  );

  const isFavorite = useCallback(
    (photoId: string) => favoriteIds.has(photoId),
    [favoriteIds],
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
  }, []);

  return {
    favoriteIds,
    favoriteCount: favoriteIds.size,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    loaded,
  };
}
