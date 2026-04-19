/**
 * Cheetah Live — manages real-time photo ingest sessions for the photographer.
 * Sessions are token-authenticated so cameras / FTP bridges can upload without
 * Supabase auth. Photos stream into the live monitor and the public /live/:code
 * gallery in real-time.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface CheetahLivePhoto {
  id: string;
  session_id: string;
  file_name: string;
  original_url: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  file_size: number | null;
  created_at: string;
}

export interface CheetahLiveSession {
  id: string;
  title: string;
  session_code: string;
  upload_token: string;
  is_live: boolean;
  status: string;
  event_id: string | null;
  total_photos: number;
  public_view_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // FTP scaffold (forward-compatible — relay not yet hosted)
  ftp_username: string | null;
  ftp_password: string | null;
  ftp_host: string | null;
  ftp_port: number | null;
  connection_tested_at: string | null;
  last_upload_at: string | null;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const UPLOAD_ENDPOINT = `https://${PROJECT_ID}.supabase.co/functions/v1/cheetah-camera-upload`;

export function getCheetahUploadEndpoint() {
  return UPLOAD_ENDPOINT;
}

export function useCheetahLive() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CheetahLiveSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CheetahLivePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const photoChannelRef = useRef<any>(null);

  // Load sessions for the current user
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data } = await (supabase
        .from('cheetah_sessions')
        .select('*') as any)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!alive) return;
      const list = (data || []) as CheetahLiveSession[];
      setSessions(list);
      if (!activeSessionId && list.length > 0) {
        // Auto-select most recent live session, else most recent.
        const live = list.find((s) => s.is_live);
        setActiveSessionId((live ?? list[0]).id);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  // Load photos for active session
  useEffect(() => {
    if (!activeSessionId) { setPhotos([]); return; }
    let alive = true;
    (async () => {
      const { data } = await (supabase
        .from('cheetah_photos')
        .select('id, session_id, file_name, original_url, thumbnail_url, preview_url, file_size, created_at') as any)
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (!alive) return;
      setPhotos((data || []) as CheetahLivePhoto[]);
    })();
    return () => { alive = false; };
  }, [activeSessionId]);

  // Realtime: stream new photos into the active session
  useEffect(() => {
    if (!activeSessionId) return;
    if (photoChannelRef.current) {
      supabase.removeChannel(photoChannelRef.current);
      photoChannelRef.current = null;
    }
    const channel = supabase
      .channel(`cheetah-live-${activeSessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cheetah_photos', filter: `session_id=eq.${activeSessionId}` },
        (payload) => {
          const p = payload.new as CheetahLivePhoto;
          setPhotos((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]));
          // Bump local counter
          setSessions((prev) => prev.map((s) =>
            s.id === activeSessionId ? { ...s, total_photos: s.total_photos + 1 } : s
          ));
        },
      )
      .subscribe();
    photoChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); photoChannelRef.current = null; };
  }, [activeSessionId]);

  const createSession = useCallback(
    async (opts: { title?: string; eventId?: string | null } = {}) => {
      if (!user) return null;
      const code = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map((b) => b.toString(36)).join('').slice(0, 6);
      const token = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, '0')).join('');

      const payload = {
        user_id: user.id,
        title: opts.title?.trim() || `Live Session — ${new Date().toLocaleString()}`,
        event_id: opts.eventId ?? null,
        session_code: code,
        upload_token: token,
        is_live: true,
        status: 'active',
      };

      const { data, error } = await (supabase
        .from('cheetah_sessions')
        .insert(payload as any)
        .select('*')
        .single() as any);

      if (error || !data) {
        toast.error('Could not create live session');
        return null;
      }
      const newSession = data as CheetahLiveSession;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      toast.success('Live session ready');
      return newSession;
    },
    [user],
  );

  const endSession = useCallback(async (sessionId: string) => {
    const { error } = await (supabase
      .from('cheetah_sessions')
      .update({ is_live: false, status: 'ended' } as any) as any)
      .eq('id', sessionId);
    if (error) { toast.error('Failed to end session'); return; }
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, is_live: false, status: 'ended' } : s));
    toast.success('Session ended');
  }, []);

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    const { error } = await (supabase
      .from('cheetah_sessions')
      .update({ title } as any) as any)
      .eq('id', sessionId);
    if (error) { toast.error('Rename failed'); return; }
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title } : s));
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    const { error } = await (supabase.from('cheetah_sessions') as any).delete().eq('id', sessionId);
    if (error) { toast.error('Delete failed'); return; }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) setActiveSessionId(null);
    toast.success('Session deleted');
  }, [activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    photos,
    loading,
    createSession,
    endSession,
    renameSession,
    deleteSession,
    uploadEndpoint: UPLOAD_ENDPOINT,
  };
}
