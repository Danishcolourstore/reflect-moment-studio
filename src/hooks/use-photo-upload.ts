import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FileStatus = 'pending' | 'uploading' | 'compressing' | 'success' | 'failed';
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
const UPLOAD_TIMEOUT = 120_000; // 120 seconds
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024; // Compress if > 2MB
const CONCURRENCY = 1; // Upload one at a time for reliability

function classifyError(err: any): { message: string; type: ErrorType } {
  const msg = String(err?.message || err || '').toLowerCase();
  if (msg.includes('cors') || msg.includes('access-control')) {
    return { message: 'Server configuration issue — contact support', type: 'cors' };
  }
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('timed out')) {
    return { message: 'Upload timed out — check your connection and retry', type: 'timeout' };
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
  // Only compress if large and is JPEG/PNG/WEBP
  if (file.size < COMPRESSION_THRESHOLD) return file;
  if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Max dimension 4096px
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
            resolve(file); // Keep original if compression didn't help
          }
        },
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original
    };
    img.src = url;
  });
}

function uploadWithTimeout(bucket: string, path: string, file: File, timeoutMs: number): Promise<{ error: any }> {
  return Promise.race([
    supabase.storage.from(bucket).upload(path, file),
    new Promise<{ error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timed out after ' + (timeoutMs / 1000) + 's')), timeoutMs)
    ),
  ]);
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

      updateFileInfo(id, { status: 'uploading', retryCount: attempt, progress: attempt > 0 ? 0 : 10 });

      try {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await uploadWithTimeout('gallery-photos', path, processedFile, UPLOAD_TIMEOUT);
        if (uploadError) throw uploadError;

        updateFileInfo(id, { progress: 80 });

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

        // Wait before retry (exponential backoff)
        updateFileInfo(id, { progress: 0, error: `Retrying (${attempt + 1}/${MAX_RETRIES})...` });
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
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

      // Upload one by one for maximum reliability
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
