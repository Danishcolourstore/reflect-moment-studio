/**
 * Folder Watcher Hook — uses the File System Access API to monitor a local
 * directory for new images. Polls every 500ms and uploads new files
 * through the Cheetah ingest pipeline with high concurrency.
 *
 * Optimisations:
 * - 500ms poll interval (near real-time detection)
 * - 5 concurrent uploads for burst handling
 * - Client-side compression (max 2400px, 0.85 quality JPEG)
 * - Real upload speed & ETA tracking
 *
 * Browser support: Chromium-based browsers only (Chrome, Edge, Brave, Arc).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'heif', 'heic', 'png']);
const POLL_INTERVAL_MS = 500;
const UPLOAD_CONCURRENCY = 5;
const MIN_FILE_SIZE = 10_000;
const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.85;
const COMPRESS_THRESHOLD = 2 * 1024 * 1024; // 2MB

export interface FolderWatcherState {
  isSupported: boolean;
  isWatching: boolean;
  folderName: string | null;
  filesDetected: number;
  filesUploaded: number;
  filesQueued: number;
  lastScanAt: string | null;
  uploadSpeedMBps: number | null;
  etaSeconds: number | null;
}

async function compressImage(file: File): Promise<File | Blob> {
  if (file.size < COMPRESS_THRESHOLD) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(MAX_DIMENSION / bitmap.width, MAX_DIMENSION / bitmap.height, 1);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
    return blob;
  } catch {
    return file; // fallback to original on any error
  }
}

export function useFolderWatcher(sessionId: string | null) {
  const [state, setState] = useState<FolderWatcherState>({
    isSupported: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
    isWatching: false,
    folderName: null,
    filesDetected: 0,
    filesUploaded: 0,
    filesQueued: 0,
    lastScanAt: null,
    uploadSpeedMBps: null,
    etaSeconds: null,
  });

  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const knownFilesRef = useRef<Set<string>>(new Set());
  const uploadQueueRef = useRef<File[]>([]);
  const activeUploadsRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const tokenRef = useRef<string | null>(null);

  // Counters stored in refs for accurate concurrent updates
  const detectedRef = useRef(0);
  const uploadedRef = useRef(0);
  const bytesUploadedRef = useRef(0);
  const uploadStartTimeRef = useRef<number | null>(null);

  // Keep auth token fresh
  useEffect(() => {
    const refresh = async () => {
      const { data } = await supabase.auth.getSession();
      tokenRef.current = data.session?.access_token ?? null;
    };
    refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      tokenRef.current = session?.access_token ?? null;
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const syncState = useCallback(() => {
    if (!mountedRef.current) return;
    const elapsed = uploadStartTimeRef.current
      ? (Date.now() - uploadStartTimeRef.current) / 1000
      : 0;
    const speedMBps = elapsed > 0.5
      ? bytesUploadedRef.current / (1024 * 1024) / elapsed
      : null;
    const remaining = uploadQueueRef.current.length + activeUploadsRef.current;
    // rough estimate: avg bytes per file so far
    const avgBytes = uploadedRef.current > 0
      ? bytesUploadedRef.current / uploadedRef.current
      : 3 * 1024 * 1024; // assume 3MB
    const etaSeconds = speedMBps && speedMBps > 0
      ? Math.round((remaining * avgBytes) / (speedMBps * 1024 * 1024))
      : null;

    setState((s) => ({
      ...s,
      filesDetected: detectedRef.current,
      filesUploaded: uploadedRef.current,
      filesQueued: uploadQueueRef.current.length,
      lastScanAt: new Date().toISOString(),
      uploadSpeedMBps: speedMBps ? Math.round(speedMBps * 10) / 10 : null,
      etaSeconds,
    }));
  }, []);

  // Upload a single file
  const uploadOne = useCallback(async (file: File) => {
    const token = tokenRef.current;
    if (!token || !sessionId) return;

    try {
      const compressed = await compressImage(file);

      const formData = new FormData();
      formData.append('file', compressed, file.name);
      formData.append('session_id', sessionId);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cheetah-ingest`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
      );

      if (!res.ok) {
        console.error('Folder watcher upload failed:', file.name, await res.text().catch(() => ''));
      }

      bytesUploadedRef.current += compressed.size ?? file.size;
    } catch (err) {
      console.error('Upload error:', file.name, err);
    }

    uploadedRef.current++;
    syncState();
  }, [sessionId, syncState]);

  // Drain the upload queue with concurrency
  const drainQueue = useCallback(() => {
    while (activeUploadsRef.current < UPLOAD_CONCURRENCY && uploadQueueRef.current.length > 0) {
      const file = uploadQueueRef.current.shift()!;
      activeUploadsRef.current++;
      uploadOne(file).finally(() => {
        activeUploadsRef.current--;
        syncState();
        drainQueue();
      });
    }
  }, [uploadOne, syncState]);

  // Scan directory for new files
  const scanDirectory = useCallback(async () => {
    const dirHandle = dirHandleRef.current;
    if (!dirHandle) return;

    try {
      const newFiles: File[] = [];

      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind !== 'file') continue;
        const name: string = entry.name;
        const ext = name.split('.').pop()?.toLowerCase() || '';
        if (!VALID_EXTENSIONS.has(ext)) continue;
        if (knownFilesRef.current.has(name)) continue;

        knownFilesRef.current.add(name);
        try {
          const file: File = await entry.getFile();
          if (file.size < MIN_FILE_SIZE) {
            knownFilesRef.current.delete(name);
            continue;
          }
          newFiles.push(file);
        } catch {
          knownFilesRef.current.delete(name);
        }
      }

      if (newFiles.length > 0) {
        if (!uploadStartTimeRef.current) uploadStartTimeRef.current = Date.now();
        detectedRef.current += newFiles.length;
        uploadQueueRef.current.push(...newFiles);
        syncState();
        drainQueue();
      } else {
        syncState();
      }
    } catch (err) {
      console.error('Directory scan error:', err);
    }
  }, [drainQueue, syncState]);

  // Select folder and start watching
  const startWatching = useCallback(async () => {
    if (!state.isSupported || !sessionId) {
      toast.error('Folder watching requires Chrome/Edge and an active session');
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
      dirHandleRef.current = dirHandle;
      knownFilesRef.current = new Set();
      detectedRef.current = 0;
      uploadedRef.current = 0;
      bytesUploadedRef.current = 0;
      uploadStartTimeRef.current = null;

      // Snapshot existing files so we don't re-upload them
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file') {
          const ext = entry.name.split('.').pop()?.toLowerCase() || '';
          if (VALID_EXTENSIONS.has(ext)) knownFilesRef.current.add(entry.name);
        }
      }

      setState((s) => ({
        ...s,
        isWatching: true,
        folderName: dirHandle.name,
        filesDetected: 0,
        filesUploaded: 0,
        filesQueued: 0,
        lastScanAt: new Date().toISOString(),
        uploadSpeedMBps: null,
        etaSeconds: null,
      }));

      intervalRef.current = window.setInterval(scanDirectory, POLL_INTERVAL_MS);
      toast.success(`Watching folder: ${dirHandle.name}`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Folder picker error:', err);
        toast.error('Could not access folder');
      }
    }
  }, [state.isSupported, sessionId, scanDirectory]);

  const stopWatching = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    dirHandleRef.current = null;
    setState((s) => ({ ...s, isWatching: false }));
    toast.info('Folder watching stopped');
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId]);

  return { ...state, startWatching, stopWatching };
}
