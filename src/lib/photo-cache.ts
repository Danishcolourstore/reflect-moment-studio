/**
 * In-memory session cache for gallery photos.
 * Persists across navigation but clears on page reload.
 * Invalidated explicitly after upload/delete.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const MAX_AGE = 5 * 60 * 1000; // 5 minutes

export function getCachedPhotos<T>(eventId: string): T | null {
  const entry = cache.get(`photos-${eventId}`);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MAX_AGE) {
    cache.delete(`photos-${eventId}`);
    return null;
  }
  return entry.data as T;
}

export function setCachedPhotos<T>(eventId: string, data: T): void {
  cache.set(`photos-${eventId}`, { data, timestamp: Date.now() });
}

export function invalidatePhotoCache(eventId: string): void {
  cache.delete(`photos-${eventId}`);
}

export function invalidateAllPhotoCache(): void {
  for (const key of cache.keys()) {
    if (key.startsWith('photos-')) cache.delete(key);
  }
}
