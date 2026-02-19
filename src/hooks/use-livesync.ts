import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * LiveSync™ simulation hook.
 *
 * Currently simulates live photo arrival for UI demo purposes.
 * Designed so a real backend (WebSocket / Supabase Realtime) can
 * replace the simulation with minimal changes — just swap the
 * `useEffect` that generates fake entries with a real subscription.
 */

export interface LivePhoto {
  id: string;
  url: string;
  timestamp: Date;
  isNew: boolean; // true for ~8 seconds after appearing
}

interface LiveSyncState {
  isLive: boolean;
  cameraConnected: boolean;
  syncing: boolean;
  guestViewers: number;
  livePhotos: LivePhoto[];
}

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80',
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=600&q=80',
];

export function useLiveSync(enabled: boolean) {
  const [state, setState] = useState<LiveSyncState>({
    isLive: false,
    cameraConnected: false,
    syncing: false,
    guestViewers: 0,
    livePhotos: [],
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageIndexRef = useRef(0);

  const start = useCallback(() => {
    setState((s) => ({ ...s, isLive: true, cameraConnected: true, guestViewers: Math.floor(Math.random() * 5) + 1 }));
  }, []);

  const stop = useCallback(() => {
    setState((s) => ({ ...s, isLive: false, cameraConnected: false, syncing: false, guestViewers: 0, livePhotos: [] }));
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Simulate new photos arriving every 6-10 seconds
  useEffect(() => {
    if (!enabled || !state.isLive) return;

    const push = () => {
      const url = DEMO_IMAGES[imageIndexRef.current % DEMO_IMAGES.length];
      imageIndexRef.current += 1;
      const id = `live-${Date.now()}`;
      const photo: LivePhoto = { id, url, timestamp: new Date(), isNew: true };

      setState((s) => ({
        ...s,
        syncing: true,
        guestViewers: Math.max(1, s.guestViewers + Math.floor(Math.random() * 3) - 1),
        livePhotos: [photo, ...s.livePhotos].slice(0, 30),
      }));

      // Clear "syncing" after 1.5s
      setTimeout(() => setState((s) => ({ ...s, syncing: false })), 1500);

      // Clear "isNew" badge after 8s
      setTimeout(() => {
        setState((s) => ({
          ...s,
          livePhotos: s.livePhotos.map((p) => (p.id === id ? { ...p, isNew: false } : p)),
        }));
      }, 8000);
    };

    // First photo quickly
    const t = setTimeout(push, 1200);
    const delay = 6000 + Math.random() * 4000;
    intervalRef.current = setInterval(push, delay);

    return () => {
      clearTimeout(t);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, state.isLive]);

  return { ...state, start, stop };
}
