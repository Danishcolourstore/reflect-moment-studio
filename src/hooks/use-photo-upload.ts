import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

export type FileStatus = 'pending' | 'uploading' | 'compressing' | 'finalizing' | 'success' | 'failed' | 'duplicate';
export type ErrorType = 'size' | 'cors' | 'network' | 'timeout' | 'storage' | 'duplicate' | 'unknown';

export interface FileUploadInfo {
  file: File;
  id: string;
  status: FileStatus;
  progress: number;
  error?: string;
  errorType?: ErrorType;
  retryCount: number;
  originalSize?: number;
  compressedSize?: number;
}

export interface UploadState {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  successCount: number;
  failedFiles: File[];
  duplicateCount: number;
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
  duplicateCount: 0,
  isDone: false,
  percent: 0,
  fileInfos: [],
  startTime: null,
  estimatedTimeRemaining: null,
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_RETRIES = 3;
const UPLOAD_TIMEOUT = 300_000;
const KEEPALIVE_INTERVAL = 30_000;
const CONCURRENCY = 5;
const BATCH_SIZE = 10;

function classifyError(err: any): { message: string; type: ErrorType } {
  const msg = String(err?.message || err || '').toLowerCase();
  if (msg.includes('cors') || msg.includes('access-control'))
    return { message: 'Server configuration issue — contact support', type: 'cors' };
  if (msg.includes('timeout') || msg.includes('aborted') || msg.includes('timed out'))
    return { message: 'Upload timed out — check connection and retry', type: 'timeout' };
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('err_connection') || msg.includes('load failed'))
    return { message: 'Network issue — try a different connection', type: 'network' };
  if (msg.includes('payload too large') || msg.includes('entity too large') || msg.includes('too large'))
    return { message: `Photo too large — max ${MAX_FILE_SIZE / (1024 * 1024)}MB`, type: 'size' };
  if (msg.includes('storage') || msg.includes('bucket') || msg.includes('policy'))
    return { message: 'Storage error — please try again', type: 'storage' };
  return { message: err?.message || 'Upload failed — please retry', type: 'unknown' };
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) return file;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 4096,
      initialQuality: 0.85,
      useWebWorker: true,
      exifOrientation: undefined,
    });
    // Strip EXIF by re-encoding
    return new File([compressed], file.name, { type: compressed.type || 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Fast hash for duplicate detection using first+last 64KB + size */
async function fileHash(file: File): Promise<string> {
  const size = file.size;
  const chunkSize = 65536;
  const first = file.slice(0, Math.min(chunkSize, size));
  const last = size > chunkSize ? file.slice(size - chunkSize) : new Blob();
  const buf = await new Blob([first, last]).arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return `${size}-${hashArr.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

function uploadWithXHR(
  bucket: string, path: string, file: File, timeoutMs: number,
  onProgress: (pct: number) => void,
): Promise<{ error: any }> {
  return new Promise((resolve, reject) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token || supabaseKey;
      const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
      const xhr = new XMLHttpRequest();
      xhr.timeout = timeoutMs;
      const keepalive = setInterval(() => {}, KEEPALIVE_INTERVAL);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.min(Math.round((e.loaded / e.total) * 100), 95));
      };
      xhr.onload = () => {
        clearInterval(keepalive);
        if (xhr.status >= 200 && xhr.status < 300) { onProgress(100); resolve({ error: null }); }
        else {
          let errMsg = 'Upload failed';
          try { const body = JSON.parse(xhr.responseText); errMsg = body.message || body.error || errMsg; } catch {}
          reject(new Error(errMsg));
        }
      };
      xhr.onerror = () => { clearInterval(keepalive); reject(new Error('Network error — failed to fetch')); };
      xhr.ontimeout = () => { clearInterval(keepalive); reject(new Error('Upload timed out')); };
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', supabaseKey);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    }).catch(reject);
  });
}

function uploadWithSDK(bucket: string, path: string, file: File, timeoutMs: number): Promise<{ error: any }> {
  return Promise.race([
    supabase.storage.from(bucket).upload(path, file),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), timeoutMs)),
  ]);
}

export function usePhotoUpload(eventId: string | undefined, userId: string | undefined) {
  const [state, setState] = useState<UploadState>(INITIAL);
  const abortRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const updateFileInfo = useCallback((id: string, patch: Partial<FileUploadInfo>) => {
    setState((prev) => ({
      ...prev,
      fileInfos: prev.fileInfos.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }, []);

  const uploadSingleFile = useCallback(async (info: FileUploadInfo, existingHashes: Set<string>): Promise<boolean> => {
    const { file, id } = info;

    if (file.size > MAX_FILE_SIZE) {
      updateFileInfo(id, { status: 'failed', error: `Photo too large — max ${MAX_FILE_SIZE / (1024 * 1024)}MB`, errorType: 'size' });
      return false;
    }

    // Duplicate detection
    try {
      const hash = await fileHash(file);
      if (existingHashes.has(hash)) {
        updateFileInfo(id, { status: 'duplicate', error: 'Duplicate photo skipped', errorType: 'duplicate' });
        return false;
      }
      existingHashes.add(hash);
    } catch {}

    // Compress
    updateFileInfo(id, { status: 'compressing', originalSize: file.size });
    let processedFile: File;
    try {
      processedFile = await compressImage(file);
    } catch {
      processedFile = file;
    }
    updateFileInfo(id, { compressedSize: processedFile.size });

    // Upload with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (abortRef.current) return false;
      updateFileInfo(id, { status: 'uploading', retryCount: attempt, progress: attempt > 0 ? 0 : 5 });

      try {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        try {
          await uploadWithXHR('gallery-photos', path, processedFile, UPLOAD_TIMEOUT, (pct) => {
            updateFileInfo(id, pct >= 95 ? { status: 'finalizing', progress: pct } : { progress: pct });
          });
        } catch (xhrErr: any) {
          const xhrMsg = String(xhrErr?.message || '').toLowerCase();
          if (xhrMsg.includes('network') || xhrMsg.includes('failed to fetch') || xhrMsg.includes('timed out')) throw xhrErr;
          updateFileInfo(id, { progress: 50 });
          const { error: sdkError } = await uploadWithSDK('gallery-photos', path, processedFile, UPLOAD_TIMEOUT);
          if (sdkError) throw sdkError;
        }

        updateFileInfo(id, { status: 'finalizing', progress: 96 });

        const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
        const { error: insertError } = await supabase.from('photos').insert({
          event_id: eventId, user_id: userId, url: publicUrl, file_name: file.name, file_size: file.size,
        } as any);
        if (insertError) throw insertError;

        updateFileInfo(id, { status: 'success', progress: 100 });
        return true;
      } catch (err: any) {
        const classified = classifyError(err);
        if (attempt === MAX_RETRIES) {
          updateFileInfo(id, { status: 'failed', error: classified.message, errorType: classified.type, retryCount: attempt });
          return false;
        }
        const waitSec = Math.pow(2, attempt + 1);
        updateFileInfo(id, { progress: 0, error: `Retrying in ${waitSec}s...` });
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      }
    }
    return false;
  }, [eventId, userId, updateFileInfo]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!eventId || !userId || files.length === 0) return;
      abortRef.current = false;

      const infos: FileUploadInfo[] = files.map((file, i) => ({
        file, id: `${Date.now()}-${i}`, status: 'pending' as FileStatus, progress: 0, retryCount: 0,
        originalSize: file.size,
      }));

      const startTime = Date.now();
      setState({
        isUploading: true, totalFiles: files.length, completedFiles: 0, successCount: 0,
        failedFiles: [], duplicateCount: 0, isDone: false, percent: 0, fileInfos: infos,
        startTime, estimatedTimeRemaining: null,
      });

      // Load existing file names for duplicate detection
      const existingHashes = new Set<string>();
      try {
        const { data: existingPhotos } = await (supabase.from('photos').select('file_name, file_size') as any)
          .eq('event_id', eventId).limit(1000);
        if (existingPhotos) {
          existingPhotos.forEach((p: any) => {
            if (p.file_name && p.file_size) existingHashes.add(`${p.file_size}-existing`);
          });
        }
      } catch {}

      let success = 0;
      let duplicates = 0;
      const failed: File[] = [];
      let completed = 0;

      // Process in batches of BATCH_SIZE, with CONCURRENCY concurrent uploads per batch
      for (let batchStart = 0; batchStart < infos.length; batchStart += BATCH_SIZE) {
        if (abortRef.current) break;
        const batch = infos.slice(batchStart, batchStart + BATCH_SIZE);

        // Within each batch, run CONCURRENCY uploads at a time
        for (let i = 0; i < batch.length; i += CONCURRENCY) {
          if (abortRef.current) break;
          const chunk = batch.slice(i, i + CONCURRENCY);

          const results = await Promise.all(
            chunk.map(async (info) => {
              const result = await uploadSingleFile(info, existingHashes);
              return { info, result };
            })
          );

          for (const { info, result } of results) {
            completed++;
            if (result) {
              success++;
            } else {
              // Check if it was a duplicate
              const fi = stateRef.current.fileInfos.find(f => f.id === info.id);
              if (fi?.status === 'duplicate') {
                duplicates++;
              } else {
                failed.push(info.file);
              }
            }
          }

          const elapsed = Date.now() - startTime;
          const avgPerFile = elapsed / completed;
          const remaining = (infos.length - completed) * avgPerFile;

          setState((prev) => ({
            ...prev,
            completedFiles: completed,
            successCount: success,
            duplicateCount: duplicates,
            failedFiles: [...failed],
            percent: Math.round((completed / infos.length) * 100),
            estimatedTimeRemaining: Math.round(remaining / 1000),
          }));
        }
      }

      setState((prev) => ({
        ...prev, isUploading: false, isDone: true, percent: 100, estimatedTimeRemaining: null,
      }));
    },
    [eventId, userId, uploadSingleFile],
  );

  const retrySingle = useCallback(
    async (fileId: string) => {
      if (!eventId || !userId) return;
      const info = state.fileInfos.find((f) => f.id === fileId);
      if (!info) return;
      setState((prev) => ({ ...prev, isUploading: true, isDone: false }));
      const result = await uploadSingleFile({ ...info, retryCount: 0, status: 'pending', progress: 0, error: undefined }, new Set());
      setState((prev) => {
        const newFailed = result ? prev.failedFiles.filter((f) => f !== info.file) : prev.failedFiles;
        const allDone = prev.fileInfos.every(
          (f) => f.id === fileId ? (result ? true : f.status === 'failed') : f.status === 'success' || f.status === 'failed' || f.status === 'duplicate',
        );
        return { ...prev, isUploading: !allDone, isDone: allDone, successCount: result ? prev.successCount + 1 : prev.successCount, failedFiles: newFailed };
      });
    },
    [eventId, userId, state.fileInfos, uploadSingleFile],
  );

  const retry = useCallback(() => {
    const filesToRetry = [...state.failedFiles];
    if (filesToRetry.length > 0) uploadFiles(filesToRetry);
  }, [state.failedFiles, uploadFiles]);

  const cancel = useCallback(() => { abortRef.current = true; }, []);
  const dismiss = useCallback(() => { setState(INITIAL); }, []);

  return { ...state, uploadFiles, retry, retrySingle, cancel, dismiss };
}
