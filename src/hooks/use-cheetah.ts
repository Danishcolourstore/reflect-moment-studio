import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export interface CheetahPhoto {
  id: string;
  session_id: string;
  file_name: string;
  original_url: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  ai_score: number | null;
  sharpness: number | null;
  exposure: string | null;
  composition: number | null;
  eyes_open: boolean | null;
  ai_recommendation: string | null;
  ai_status: string;
  burst_group: string | null;
  is_best_in_burst: boolean | null;
  cull_status: string;
  created_at: string;
  processed_at: string | null;
}

export interface CheetahSession {
  id: string;
  title: string;
  status: string;
  total_photos: number;
  event_id: string | null;
  created_at: string;
}

export function useCheetah() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CheetahSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<CheetahPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const channelRef = useRef<any>(null);

  // Load sessions
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await (supabase.from('cheetah_sessions').select('*') as any)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setSessions(data || []);
      if (data && data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Load photos for active session
  useEffect(() => {
    if (!activeSessionId) { setPhotos([]); return; }
    const load = async () => {
      const { data } = await (supabase.from('cheetah_photos').select('*') as any)
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false });
      setPhotos(data || []);
    };
    load();
  }, [activeSessionId]);

  // Realtime subscription for photos
  useEffect(() => {
    if (!activeSessionId) return;

    const channel = supabase
      .channel(`cheetah-${activeSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cheetah_photos',
          filter: `session_id=eq.${activeSessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPhotos((prev) => [payload.new as CheetahPhoto, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setPhotos((prev) =>
              prev.map((p) => (p.id === (payload.new as any).id ? (payload.new as CheetahPhoto) : p))
            );
          } else if (payload.eventType === 'DELETE') {
            setPhotos((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  // Create session
  const createSession = useCallback(
    async (title: string, eventId?: string) => {
      if (!user) return null;
      const { data, error } = await (supabase.from('cheetah_sessions').insert({
        user_id: user.id,
        title,
        event_id: eventId || null,
      } as any).select().single() as any);
      if (error) {
        toast.error('Failed to create session');
        return null;
      }
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      return data as CheetahSession;
    },
    [user]
  );

  // Upload photos
  const uploadPhotos = useCallback(
    async (files: File[]) => {
      if (!user || !activeSessionId) return;
      setUploading(true);
      setUploadProgress({ done: 0, total: files.length });

      const CONCURRENCY = 3;
      let done = 0;

      const uploadOne = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('session_id', activeSessionId);

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cheetah-ingest`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error('Upload failed:', file.name, err);
        }

        done++;
        setUploadProgress({ done, total: files.length });
      };

      // Process in batches
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        const batch = files.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(uploadOne));
      }

      setUploading(false);
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} ingested`);
    },
    [user, activeSessionId]
  );

  // Cull action
  const setCullStatus = useCallback(
    async (photoId: string, status: 'pick' | 'reject' | 'favorite' | 'unreviewed') => {
      await (supabase.from('cheetah_photos').update({ cull_status: status } as any) as any).eq(
        'id',
        photoId
      );
    },
    []
  );

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    photos,
    loading,
    uploading,
    uploadProgress,
    createSession,
    uploadPhotos,
    setCullStatus,
  };
}
