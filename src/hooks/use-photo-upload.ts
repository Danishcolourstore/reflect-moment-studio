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
  currentFileName: string | null;
  currentFileIndex: number;
  errorMessage: string | null;
}

const INITIAL: UploadState = {
  isUploading: false,
  totalFiles: 0,
  completedFiles: 0,
  successCount: 0,
  failedFiles: [],
  isDone: false,
  percent: 0,
  currentFileName: null,
  currentFileIndex: 0,
  errorMessage: null,
};

const MAX_RETRIES = 2;

async function uploadToR2(file: File, eventId: string): Promise<string> {
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
    const err = await res.json().catch(() => ({ error: `Upload failed (${res.status})` }));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  return 'ok';
}

async function uploadWithRetry(file: File, eventId: string): Promise<void> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await uploadToR2(file, eventId);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  throw lastError;
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
        currentFileName: files[0]?.name || null,
        currentFileIndex: 0,
        errorMessage: null,
      });

      let success = 0;
      const failed: File[] = [];

      // Sequential upload — one file at a time
      for (let i = 0; i < files.length; i++) {
        if (abortRef.current) break;
        const file = files[i];

        setState((prev) => ({
          ...prev,
          currentFileName: file.name,
          currentFileIndex: i,
          errorMessage: null,
        }));

        try {
          await uploadWithRetry(file, eventId);
          success++;
        } catch (err) {
          failed.push(file);
          const msg = err instanceof Error ? err.message : 'Unknown error';
          setState((prev) => ({
            ...prev,
            errorMessage: `Failed: ${file.name} — ${msg}`,
          }));
        }

        const completed = i + 1;
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
        currentFileName: null,
        errorMessage: failed.length > 0
          ? `${failed.length} photo${failed.length > 1 ? 's' : ''} failed after retries`
          : null,
      }));

      // Trigger face matching for registered guests
      if (success > 0) {
        try {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            fetch(`https://${projectId}.supabase.co/functions/v1/notify-guests`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ event_id: eventId }),
            }).catch(console.error);
          }
        } catch {
          // non-blocking
        }
      }
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
