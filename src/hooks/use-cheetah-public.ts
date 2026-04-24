/**
 * Public live gallery hook — used by /live/:code (guest-facing).
 * Reads session by code, streams new photos via realtime.
 */
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CheetahLivePhoto, CheetahLiveSession } from './use-cheetah-live';

export function useCheetahPublic(code: string | undefined) {
  const [session, setSession] = useState<CheetahLiveSession | null>(null);
  const [photos, setPhotos] = useState<CheetahLivePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      const { data: sessionRows, error: sErr } = await (supabase.rpc as any)('get_public_cheetah_session', {
        p_code: code,
      });
      const sess = Array.isArray(sessionRows) ? sessionRows[0] : null;

      if (!alive) return;
      if (sErr || !sess) {
        setError('This live session is not active or has ended.');
        setLoading(false);
        return;
      }
      setSession(sess as CheetahLiveSession);

      const { data: ps } = await (supabase
        .from('cheetah_photos')
        .select('id, session_id, file_name, original_url, thumbnail_url, preview_url, file_size, created_at') as any)
        .eq('session_id', sess.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (!alive) return;
      setPhotos((ps || []) as CheetahLivePhoto[]);
      setLoading(false);

      // Bump view count (fire-and-forget)
      try { await (supabase.rpc as any)('cheetah_increment_view', { p_code: code }); } catch {}

      const channel = supabase
        .channel(`cheetah-public-${sess.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'cheetah_photos', filter: `session_id=eq.${sess.id}` },
          (payload) => {
            const p = payload.new as CheetahLivePhoto;
            setPhotos((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]));
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'cheetah_sessions', filter: `id=eq.${sess.id}` },
          (payload) => {
            setSession(payload.new as CheetahLiveSession);
          },
        )
        .subscribe();
      channelRef.current = channel;
    })();

    return () => {
      alive = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [code]);

  return { session, photos, loading, error };
}
