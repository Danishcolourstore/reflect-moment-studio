import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface FaceIndexingJob {
  id: string;
  event_id: string;
  status: string | null;
  photos_total: number | null;
  photos_processed: number | null;
  faces_found: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export function useFaceIndexing(eventId: string | undefined) {
  const { user } = useAuth();
  const [job, setJob] = useState<FaceIndexingJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);

  // Load latest job for this event
  const loadJob = useCallback(async () => {
    if (!eventId) return;
    const { data } = await (supabase
      .from('face_indexing_jobs' as any)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as any);
    if (data) setJob(data as FaceIndexingJob);
  }, [eventId]);

  // Load indexed face count
  const loadIndexedCount = useCallback(async () => {
    if (!eventId) return;
    const { count } = await supabase
      .from('photo_faces')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);
    setIndexedCount(count || 0);
  }, [eventId]);

  useEffect(() => {
    loadJob();
    loadIndexedCount();
  }, [loadJob, loadIndexedCount]);

  // Subscribe to realtime job updates
  useEffect(() => {
    if (!eventId || !job?.id) return;

    const channel = supabase
      .channel(`face-index-${job.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'face_indexing_jobs',
          filter: `id=eq.${job.id}`,
        },
        (payload) => {
          setJob(payload.new as FaceIndexingJob);
          if (payload.new.status === 'completed' || payload.new.status === 'failed') {
            loadIndexedCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, job?.id, loadIndexedCount]);

  // Start indexing
  const startIndexing = useCallback(async () => {
    if (!eventId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('index-event-faces', {
        body: { eventId },
      });
      if (error) throw error;
      if (data?.jobId) {
        // Reload job
        await loadJob();
      }
    } catch (e: any) {
      console.error('Failed to start face indexing:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [eventId, user, loadJob]);

  const isRunning = job?.status === 'processing' || job?.status === 'pending';
  const progress = job?.photos_total
    ? Math.round(((job.photos_processed || 0) / job.photos_total) * 100)
    : 0;

  return {
    job,
    indexedCount,
    isRunning,
    progress,
    loading,
    startIndexing,
    refresh: loadJob,
  };
}
