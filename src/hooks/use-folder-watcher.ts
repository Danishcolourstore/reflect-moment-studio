/**
 * Folder Watcher Hook — uses the File System Access API to monitor a local
 * directory for new images. Polls every N seconds and uploads new files
 * through the Cheetah ingest pipeline.
 *
 * Browser support: Chromium-based browsers only (Chrome, Edge, Brave, Arc).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'heif', 'heic', 'png']);
const POLL_INTERVAL_MS = 2000; // Check every 2 seconds
const UPLOAD_CONCURRENCY = 3;

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
  const isProcessingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Process upload queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || uploadQueueRef.current.length === 0 || !sessionId) return;
    isProcessingRef.current = true;

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    if (!token) {
      isProcessingRef.current = false;
      return;
    }

    while (uploadQueueRef.current.length > 0) {
      const batch = uploadQueueRef.current.splice(0, UPLOAD_CONCURRENCY);

      if (mountedRef.current) {
        setState((s) => ({ ...s, filesQueued: uploadQueueRef.current.length }));
      }

      await Promise.all(
        batch.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('session_id', sessionId);

            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cheetah-ingest`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
              }
            );

            if (!res.ok) {
              console.error('Folder watcher upload failed:', file.name);
            }

            if (mountedRef.current) {
              setState((s) => ({
                ...s,
                filesUploaded: s.filesUploaded + 1,
                filesQueued: uploadQueueRef.current.length,
              }));
            }
          } catch (err) {
            console.error('Upload error:', file.name, err);
          }
        })
      );
    }

    isProcessingRef.current = false;
  }, [sessionId]);

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

        // New file detected
        knownFilesRef.current.add(name);
        try {
          const file: File = await entry.getFile();
          // Skip tiny files (likely incomplete writes)
          if (file.size < 10000) continue;
          newFiles.push(file);
        } catch {
          // File might still be writing, skip and retry next scan
          knownFilesRef.current.delete(name);
        }
      }

      if (newFiles.length > 0) {
        uploadQueueRef.current.push(...newFiles);
        if (mountedRef.current) {
          setState((s) => ({
            ...s,
            filesDetected: s.filesDetected + newFiles.length,
            filesQueued: uploadQueueRef.current.length,
            lastScanAt: new Date().toISOString(),
          }));
        }
        processQueue();
      } else if (mountedRef.current) {
        setState((s) => ({ ...s, lastScanAt: new Date().toISOString() }));
      }
    } catch (err) {
      console.error('Directory scan error:', err);
    }
  }, [processQueue]);

  // Select folder and start watching
  const startWatching = useCallback(async () => {
    if (!state.isSupported || !sessionId) {
      toast.error('Folder watching requires Chrome/Edge and an active session');
      return;
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });

      dirHandleRef.current = dirHandle;
      knownFilesRef.current = new Set();

      // Initial scan to record existing files (don't upload them)
      for await (const entry of (dirHandle as any).values()) {
        if (entry.kind === 'file') {
          const ext = entry.name.split('.').pop()?.toLowerCase() || '';
          if (VALID_EXTENSIONS.has(ext)) {
            knownFilesRef.current.add(entry.name);
          }
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

      // Start polling
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

  return {
    ...state,
    startWatching,
    stopWatching,
  };
}
