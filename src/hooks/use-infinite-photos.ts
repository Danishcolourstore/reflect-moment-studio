import { useState, useCallback, useRef, useEffect } from 'react';

const PAGE_SIZE = 50;

/**
 * Infinite scroll pagination for a photo array.
 * Takes the full array and returns a paginated view with a sentinel ref.
 */
export function useInfinitePhotos<T>(allPhotos: T[]) {
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset page when source array changes identity
  const prevLenRef = useRef(allPhotos.length);
  useEffect(() => {
    if (allPhotos.length !== prevLenRef.current) {
      prevLenRef.current = allPhotos.length;
      setPage(1);
    }
  }, [allPhotos.length]);

  const visiblePhotos = allPhotos.slice(0, page * PAGE_SIZE);
  const hasMore = visiblePhotos.length < allPhotos.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage(p => p + 1);
  }, [hasMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore, page]); // page dep ensures re-observe after load

  return { visiblePhotos, hasMore, sentinelRef, totalCount: allPhotos.length };
}
