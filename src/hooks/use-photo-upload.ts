import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UploadState {
  /** Currently uploading */
  isUploading: boolean;
  /** Total files in this batch */
  totalFiles: number;
  /** Number completed (success + fail) */
  completedFiles: number;
  /** Number successfully uploaded */
  successCount: number;
  /** Files that failed */
  failedFiles: File[];
  /** Upload finished (success or partial) */
  isDone: boolean;
  /** Overall percentage 0-100 */
  percent: number;
}

const INITIAL: UploadState = {
  isUploading: false,
  totalFiles: 0,
  completedFiles: 0,
  successCount: 0,
  failedFiles: [],
  isDone: false,
  percent: 0,
};

export function usePhotoUpload(eventId: string | undefined, userId: string | undefined) {
  const [state, setState] = useState<UploadState>(INITIAL);
  const abortRef = useRef(false);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!eventId || !userId || files.length === 0) return;
      abortRef.current = false;

      setState({
        isUploading: true,
        totalFiles: files.length,
        completedFiles: 0,
        successCount: 0,
        failedFiles: [],
        isDone: false,
        percent: 0,
      });

      let success = 0;
      const failed: File[] = [];

      // Process in parallel batches of 4 for speed
      const BATCH_SIZE = 4;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (abortRef.current) break;
        const batch = files.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(async (file) => {
            const ext = file.name.split('.').pop();
            const path = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from('gallery-photos')
              .upload(path, file);
            if (uploadError) throw uploadError;
            const {
              data: { publicUrl },
            } = supabase.storage.from('gallery-photos').getPublicUrl(path);
            const { error: insertError } = await supabase.from('photos').insert({
              event_id: eventId,
              user_id: userId,
              url: publicUrl,
              file_name: file.name,
            });
            if (insertError) throw insertError;
          }),
        );

        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') {
            success++;
          } else {
            failed.push(batch[idx]);
          }
        });

        const completed = Math.min(i + BATCH_SIZE, files.length);
        setState((prev) => ({
          ...prev,
          completedFiles: completed,
          successCount: success,
          failedFiles: [...failed],
          percent: Math.round((completed / files.length) * 100),
        }));
      }

      // Update photo count on event
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);
      if (count !== null) {
        await supabase.from('events').update({ photo_count: count }).eq('id', eventId);
      }

      setState((prev) => ({
        ...prev,
        isUploading: false,
        isDone: true,
        percent: 100,
      }));
    },
    [eventId, userId],
  );

  const retry = useCallback(() => {
    const filesToRetry = [...state.failedFiles];
    if (filesToRetry.length > 0) {
      uploadFiles(filesToRetry);
    }
  }, [state.failedFiles, uploadFiles]);

  const dismiss = useCallback(() => {
    setState(INITIAL);
  }, []);

  return { ...state, uploadFiles, retry, dismiss };
}
