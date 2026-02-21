import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UploadState {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  successCount: number;
  failedFiles: File[];
  isDone: boolean;
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

async function uploadToR2(file: File, eventId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('event_id', eventId);
  formData.append('file_name', file.name);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/upload-to-r2`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
}

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

      const BATCH_SIZE = 4;
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        if (abortRef.current) break;
        const batch = files.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map((file) => uploadToR2(file, eventId)),
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
