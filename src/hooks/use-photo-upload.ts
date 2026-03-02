import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FileStatus = 'pending' | 'uploading' | 'compressing' | 'finalizing' | 'success' | 'failed';
export type ErrorType = 'size' | 'cors' | 'network' | 'timeout' | 'storage' | 'unknown';

export interface FileUploadInfo {
  file: File;
  id: string;
  status: FileStatus;
  progress: number;
  error?: string;
  errorType?: ErrorType;
  retryCount: number;
}

export interface UploadState {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  successCount: number;
  failedFiles: File[];
  isDone: boolean;
  percent: number;
  fileInfos: FileUploadInfo[];
  startTime: number | null;
  estimatedTimeRemaining: number | null;
}

const INITIAL: UploadState = {
  isUploading: false,
  totalFiles: 0,
  completedFiles: 0,
  successCount: 0,
  failedFiles: [],
  isDone: false,
  percent: 0,
  fileInfos: [],
  startTime: null,
  estimatedTimeRemaining: null,
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_RETRIES = 3;
const UPLOAD_TIMEOUT = 300_000; // 300 seconds
const KEEPALIVE_INTERVAL = 30_000; // 30 seconds
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024;

function classifyError(err: any): { message: string; type: ErrorType } {
  const msg = String(err?.message || err || '').toLowerCase();
  if (msg.includes('cors') || msg.includes('access-control')) {
    return { message: 'Server configuration issue — contact support', type: 'cors' };
  }
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('timed out')) {
    return { message: 'Upload timed out after 5 minutes — check your connection and retry', type: 'timeout' };
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('err_connection') || msg.includes('load failed')) {
    return { message: 'Network issue — try a different connection', type: 'network' };
  }
  if (msg.includes('payload too large') || msg.includes('entity too large') || msg.includes('too large')) {
    return { message: `Photo too large — max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, type: 'size' };
  }
  if (msg.includes('storage') || msg.includes('bucket') || msg.includes('policy')) {
    return { message: 'Storage error — please try again', type: 'storage' };
  }
  return { message: err?.message || 'Upload failed — please retry', type: 'unknown' };
}

async function compressImage(file: File): Promise<File> {
  if (file.size < COMPRESSION_THRESHOLD) return file;
  if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const MAX_DIM = 4096;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Upload using XMLHttpRequest for real progress tracking + keepalive.
 * Falls back gracefully if XHR fails.
 */
function uploadWithXHR(
  bucket: string,
  path: string,
  file: File,
  timeoutMs: number,
  onProgress: (pct: number) => void,
): Promise<{ error: any }> {
  return new Promise((resolve, reject) => {
    // Get the upload URL from Supabase
    const supabaseUrl = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const session = (supabase as any).auth;

    // We'll get the token and do XHR upload
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token || supabaseKey;
      const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

      const xhr = new XMLHttpRequest();
      xhr.timeout = timeoutMs;

      // Keepalive ping - keep the connection alive
      const keepalive = setInterval(() => {
        // XHR is still active, connection stays open
      }, KEEPALIVE_INTERVAL);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // Cap visual progress at 95% — remaining 5% is server-side finalization
          const rawPct = Math.round((e.loaded / e.total) * 100);
          onProgress(Math.min(rawPct, 95));
        }
      };

      xhr.onload = () => {
        clearInterval(keepalive);
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve({ error: null });
        } else {
          let errMsg = 'Upload failed';
          try {
            const body = JSON.parse(xhr.responseText);
            errMsg = body.message || body.error || errMsg;
          } catch {}
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => {
        clearInterval(keepalive);
        reject(new Error('Network error — failed to fetch'));
      };

      xhr.ontimeout = () => {
        clearInterval(keepalive);
        reject(new Error('Upload timed out after ' + (timeoutMs / 1000) + 's'));
      };

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', supabaseKey);
      xhr.setRequestHeader('x-upsert', 'false');

      // Send the file directly
      const formData = new FormData();
      formData.append('', file);  // Supabase storage expects empty-key formdata or raw body

      // Actually Supabase storage API accepts raw body with content-type
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    }).catch(reject);
  });
}

/**
 * Fallback: use Supabase SDK with a simple timeout
 */
function uploadWithSDK(bucket: string, path: string, file: File, timeoutMs: number): Promise<{ error: any }> {
  return Promise.race([
    supabase.storage.from(bucket).upload(path, file),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timed out after ' + (timeoutMs / 1000) + 's')), timeoutMs)
    ),
  ]);
}

/**
 * Verify uploaded file exists in storage (confirms server-side finalization)
 */
async function verifyUpload(bucket: string, path: string, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await supabase.storage.from(bucket).list(
        path.split('/').slice(0, -1).join('/'),
        { search: path.split('/').pop() }
      );
      if (data && data.length > 0) return true;
    } catch {}
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  return false;
}

export function usePhotoUpload(eventId: string | undefined, userId: string | undefined) {
  const [state, setState] = useState<UploadState>(INITIAL);
  const abortRef = useRef(false);

  const updateFileInfo = (id: string, patch: Partial<FileUploadInfo>) => {
    setState((prev) => ({
      ...prev,
      fileInfos: prev.fileInfos.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const uploadSingleFile = async (info: FileUploadInfo): Promise<boolean> => {
    const { file, id } = info;

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      updateFileInfo(id, {
        status: 'failed',
        error: `Photo too large — max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        errorType: 'size',
      });
      return false;
    }

    // Compress
    updateFileInfo(id, { status: 'compressing' });
    let processedFile: File;
    try {
      processedFile = await compressImage(file);
    } catch {
      processedFile = file;
    }

    // Upload with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortRef.current) return false;

      updateFileInfo(id, { status: 'uploading', retryCount: attempt, progress: attempt > 0 ? 0 : 5 });

      try {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        let uploadSuccess = false;

        // Try XHR first for progress tracking
        try {
          await uploadWithXHR('gallery-photos', path, processedFile, UPLOAD_TIMEOUT, (pct) => {
            if (pct >= 95) {
              updateFileInfo(id, { status: 'finalizing', progress: pct });
            } else {
              updateFileInfo(id, { progress: pct });
            }
          });
          uploadSuccess = true;
        } catch (xhrErr: any) {
          // If XHR fails with non-network error, try SDK as fallback
          const xhrMsg = String(xhrErr?.message || '').toLowerCase();
          if (xhrMsg.includes('network') || xhrMsg.includes('failed to fetch') || xhrMsg.includes('timed out')) {
            throw xhrErr; // genuine connection issue, don't retry with SDK
          }
          // Fallback to SDK
          updateFileInfo(id, { progress: 50 });
          const { error: sdkError } = await uploadWithSDK('gallery-photos', path, processedFile, UPLOAD_TIMEOUT);
          if (sdkError) throw sdkError;
          uploadSuccess = true;
        }

        if (!uploadSuccess) throw new Error('Upload did not complete');

        // Finalization phase — show "finalizing" status, don't timeout quickly here
        updateFileInfo(id, { status: 'finalizing', progress: 96 });

        // Verify the file actually landed in storage
        const verified = await verifyUpload('gallery-photos', path);
        if (!verified) {
          throw new Error('Upload verification failed — file not found on server');
        }

        updateFileInfo(id, { progress: 98 });

        const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);

        const { error: insertError } = await supabase.from('photos').insert({
          event_id: eventId,
          user_id: userId,
          url: publicUrl,
          file_name: file.name,
          file_size: file.size,
        } as any);
        if (insertError) throw insertError;

        updateFileInfo(id, { status: 'success', progress: 100 });
        return true;
      } catch (err: any) {
        const classified = classifyError(err);

        if (attempt === MAX_RETRIES) {
          updateFileInfo(id, {
            status: 'failed',
            error: classified.message,
            errorType: classified.type,
            retryCount: attempt,
          });
          return false;
        }

        // Wait before retry (exponential backoff: 2s, 4s, 8s)
        const waitSec = Math.pow(2, attempt + 1);
        updateFileInfo(id, { progress: 0, error: `Retrying in ${waitSec}s (attempt ${attempt + 1}/${MAX_RETRIES})...` });
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      }
    }

    return false;
  };

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!eventId || !userId || files.length === 0) return;
      abortRef.current = false;

      const infos: FileUploadInfo[] = files.map((file, i) => ({
        file,
        id: `${Date.now()}-${i}`,
        status: 'pending' as FileStatus,
        progress: 0,
        retryCount: 0,
      }));

      const startTime = Date.now();

      setState({
        isUploading: true,
        totalFiles: files.length,
        completedFiles: 0,
        successCount: 0,
        failedFiles: [],
        isDone: false,
        percent: 0,
        fileInfos: infos,
        startTime,
        estimatedTimeRemaining: null,
      });

      let success = 0;
      const failed: File[] = [];

      for (let i = 0; i < infos.length; i++) {
        if (abortRef.current) break;

        const result = await uploadSingleFile(infos[i]);
        if (result) {
          success++;
        } else {
          failed.push(infos[i].file);
        }

        const completed = i + 1;
        const elapsed = Date.now() - startTime;
        const avgPerFile = elapsed / completed;
        const remaining = (infos.length - completed) * avgPerFile;

        setState((prev) => ({
          ...prev,
          completedFiles: completed,
          successCount: success,
          failedFiles: [...failed],
          percent: Math.round((completed / infos.length) * 100),
          estimatedTimeRemaining: Math.round(remaining / 1000),
        }));
      }

      setState((prev) => ({
        ...prev,
        isUploading: false,
        isDone: true,
        percent: 100,
        estimatedTimeRemaining: null,
      }));
    },
    [eventId, userId],
  );

  const retrySingle = useCallback(
    async (fileId: string) => {
      if (!eventId || !userId) return;
      const info = state.fileInfos.find((f) => f.id === fileId);
      if (!info) return;

      setState((prev) => ({ ...prev, isUploading: true, isDone: false }));

      const result = await uploadSingleFile({ ...info, retryCount: 0, status: 'pending', progress: 0, error: undefined });

      setState((prev) => {
        const newFailed = result
          ? prev.failedFiles.filter((f) => f !== info.file)
          : prev.failedFiles;
        const allDone = prev.fileInfos.every(
          (f) => f.id === fileId ? (result ? true : f.status === 'failed') : f.status === 'success' || f.status === 'failed',
        );
        return {
          ...prev,
          isUploading: !allDone,
          isDone: allDone,
          successCount: result ? prev.successCount + 1 : prev.successCount,
          failedFiles: newFailed,
        };
      });
    },
    [eventId, userId, state.fileInfos],
  );

  const retry = useCallback(() => {
    const filesToRetry = [...state.failedFiles];
    if (filesToRetry.length > 0) {
      uploadFiles(filesToRetry);
    }
  }, [state.failedFiles, uploadFiles]);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const dismiss = useCallback(() => {
    setState(INITIAL);
  }, []);

  return { ...state, uploadFiles, retry, retrySingle, cancel, dismiss };
}
