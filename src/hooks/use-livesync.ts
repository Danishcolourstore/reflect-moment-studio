import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * LiveSync™ simulation hook.
 *
 * Currently simulates live photo arrival for UI demo purposes.
 * Designed so a real backend (WebSocket / Supabase Realtime) can
 * replace the simulation with minimal changes — just swap the
 * `useEffect` that generates fake entries with a real subscription.
 */

export type AiVerdict = 'selected' | 'rejected-blur' | 'rejected-duplicate' | 'hero';

export interface LivePhoto {
  id: string;
  url: string;
  timestamp: Date;
  isNew: boolean; // true for ~8 seconds after appearing
  /** AI culling result — undefined until AI processes the photo */
  aiVerdict?: AiVerdict;
  /** Whether the AI preset enhancement has been "applied" */
  presetApplied?: boolean;
  /** Social share count simulation */
  shareCount?: number;
}

export interface AiCullingStats {
  selected: number;
  rejectedBlur: number;
  rejectedDuplicate: number;
  heroPicks: number;
  totalProcessed: number;
}

interface LiveSyncState {
  isLive: boolean;
  cameraConnected: boolean;
  syncing: boolean;
  guestViewers: number;
  livePhotos: LivePhoto[];
  /** AI culling stats */
  aiStats: AiCullingStats;
  /** Whether live preset apply is enabled */
  presetApplyEnabled: boolean;
  /** Current preset letter */
  activePreset: string;
}

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80',
  'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80',
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=600&q=80',
];

const INITIAL_AI_STATS: AiCullingStats = {
  selected: 0,
  rejectedBlur: 0,
  rejectedDuplicate: 0,
  heroPicks: 0,
  totalProcessed: 0,
};

/** Weighted random AI verdict — biased toward "selected" */
function randomVerdict(): AiVerdict {
  const r = Math.random();
  if (r < 0.12) return 'hero';
  if (r < 0.65) return 'selected';
  if (r < 0.85) return 'rejected-blur';
  return 'rejected-duplicate';
}

function bumpStats(prev: AiCullingStats, verdict: AiVerdict): AiCullingStats {
  return {
    ...prev,
    totalProcessed: prev.totalProcessed + 1,
    selected: prev.selected + (verdict === 'selected' ? 1 : 0),
    rejectedBlur: prev.rejectedBlur + (verdict === 'rejected-blur' ? 1 : 0),
    rejectedDuplicate: prev.rejectedDuplicate + (verdict === 'rejected-duplicate' ? 1 : 0),
    heroPicks: prev.heroPicks + (verdict === 'hero' ? 1 : 0),
  };
}

export function useLiveSync(enabled: boolean) {
  const [state, setState] = useState<LiveSyncState>({
    isLive: false,
    cameraConnected: false,
    syncing: false,
    guestViewers: 0,
    livePhotos: [],
    aiStats: { ...INITIAL_AI_STATS },
    presetApplyEnabled: false,
    activePreset: 'A',
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageIndexRef = useRef(0);

  const start = useCallback(() => {
    setState((s) => ({
      ...s,
      isLive: true,
      cameraConnected: true,
      guestViewers: Math.floor(Math.random() * 5) + 1,
      aiStats: { ...INITIAL_AI_STATS },
    }));
  }, []);

  const stop = useCallback(() => {
    setState((s) => ({
      ...s,
      isLive: false,
      cameraConnected: false,
      syncing: false,
      guestViewers: 0,
      livePhotos: [],
      aiStats: { ...INITIAL_AI_STATS },
    }));
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const setPresetApplyEnabled = useCallback((v: boolean) => {
    setState((s) => ({ ...s, presetApplyEnabled: v }));
  }, []);

  const setActivePreset = useCallback((p: string) => {
    setState((s) => ({ ...s, activePreset: p }));
  }, []);

  const addShareCount = useCallback((photoId: string) => {
    setState((s) => ({
      ...s,
      livePhotos: s.livePhotos.map((p) =>
        p.id === photoId ? { ...p, shareCount: (p.shareCount ?? 0) + 1 } : p,
      ),
    }));
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

      // Simulate AI culling verdict after 2s
      setTimeout(() => {
        const verdict = randomVerdict();
        setState((s) => ({
          ...s,
          aiStats: bumpStats(s.aiStats, verdict),
          livePhotos: s.livePhotos.map((p) =>
            p.id === id
              ? { ...p, aiVerdict: verdict, presetApplied: s.presetApplyEnabled }
              : p,
          ),
        }));
      }, 2000);

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

  return {
    ...state,
    start,
    stop,
    setPresetApplyEnabled,
    setActivePreset,
    addShareCount,
  };
}
