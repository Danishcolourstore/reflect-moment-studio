import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'mirrorai_favorites_';

function getStorageKey(eventId: string) {
  return `${STORAGE_KEY_PREFIX}${eventId}`;
}

export function useGuestFavorites(eventId: string | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount / eventId change
  useEffect(() => {
    if (!eventId) return;
    try {
      const stored = localStorage.getItem(getStorageKey(eventId));
      if (stored) {
        setFavoriteIds(new Set(JSON.parse(stored)));
      } else {
        setFavoriteIds(new Set());
      }
    } catch (_err) {
      setFavoriteIds(new Set());
    }
  }, [eventId]);

  const persist = useCallback(
    (next: Set<string>) => {
      if (!eventId) return;
      localStorage.setItem(getStorageKey(eventId), JSON.stringify([...next]));
    },
    [eventId],
  );

  const toggleFavorite = useCallback(
    (photoId: string) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(photoId)) {
          next.delete(photoId);
        } else {
          next.add(photoId);
        }
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const isFavorite = useCallback(
    (photoId: string) => favoriteIds.has(photoId),
    [favoriteIds],
  );

  const clearFavorites = useCallback(() => {
    setFavoriteIds(new Set());
    if (eventId) localStorage.removeItem(getStorageKey(eventId));
  }, [eventId]);

  return {
    favoriteIds,
    favoriteCount: favoriteIds.size,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
}
