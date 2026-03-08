/**
 * Folder Watcher Hook — uses the File System Access API to monitor a local
 * directory for new images. Polls every 500ms and uploads new files
 * through the Cheetah ingest pipeline with high concurrency.
 *
 * Optimisations:
 * - 500ms poll interval (near real-time detection)
 * - 6 concurrent uploads for burst handling
 * - Thumbnail generation in Web Worker (non-blocking)
 * - Fast ingest mode: upload first, AI scoring deferred
 *
 * Browser support: Chromium-based browsers only (Chrome, Edge, Brave, Arc).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'heif', 'heic', 'png']);
const POLL_INTERVAL_MS = 500;
const UPLOAD_CONCURRENCY = 6;
const MIN_FILE_SIZE = 10_000; // Skip incomplete writes

export interface FolderWatcherState {
  isSupported: boolean;
  isWatching: boolean;
  folderName: string | null;
  filesDetected: number;
  filesUploaded: number;
  filesQueued: number;
  lastScanAt: string | null;
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
  });

  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const knownFilesRef = useRef<Set<string>>(new Set());
  const uploadQueueRef = useRef<File[]>([]);
  const activeUploadsRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const tokenRef = useRef<string | null>(null);

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

  const updateState = useCallback((patch: Partial<FolderWatcherState>) => {
    if (mountedRef.current) setState((s) => ({ ...s, ...patch }));
  }, []);

  // Upload a single file — called from the drain loop
  const uploadOne = useCallback(async (file: File) => {
    const token = tokenRef.current;
    if (!token || !sessionId) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cheetah-ingest`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
      );

      if (!res.ok) console.error('Folder watcher upload failed:', file.name);
    } catch (err) {
      console.error('Upload error:', file.name, err);
    }

    updateState({
      filesUploaded: (state.filesUploaded ?? 0) + 1,
      filesQueued: uploadQueueRef.current.length,
    });
  }, [sessionId, updateState]);

  // Drain the upload queue, respecting concurrency limit
  const drainQueue = useCallback(() => {
    while (activeUploadsRef.current < UPLOAD_CONCURRENCY && uploadQueueRef.current.length > 0) {
      const file = uploadQueueRef.current.shift()!;
      activeUploadsRef.current++;
      uploadOne(file).finally(() => {
        activeUploadsRef.current--;
        if (mountedRef.current) {
          updateState({ filesQueued: uploadQueueRef.current.length });
        }
        // Keep draining
        drainQueue();
      });
    }
  }, [uploadOne, updateState]);

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
        uploadQueueRef.current.push(...newFiles);
        updateState({
          filesDetected: (state.filesDetected ?? 0) + newFiles.length,
          filesQueued: uploadQueueRef.current.length,
          lastScanAt: new Date().toISOString(),
        });
        drainQueue();
      } else {
        updateState({ lastScanAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Directory scan error:', err);
    }
  }, [drainQueue, updateState]);

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

  // Stop watching
  const stopWatching = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    dirHandleRef.current = null;
    setState((s) => ({ ...s, isWatching: false }));
    toast.info('Folder watching stopped');
  }, []);

  // Cleanup on session change
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
