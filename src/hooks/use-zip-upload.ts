import { useState, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_ZIP_SIZE = 500 * 1024 * 1024; // 500MB

export interface ZipUploadState {
  isExtracting: boolean;
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  successCount: number;
  failedCount: number;
  isDone: boolean;
  percent: number;
  error: string | null;
}

const INITIAL: ZipUploadState = {
  isExtracting: false,
  isUploading: false,
  totalFiles: 0,
  completedFiles: 0,
  successCount: 0,
  failedCount: 0,
  isDone: false,
  percent: 0,
  error: null,
};

export function useZipUpload(eventId: string | undefined, userId: string | undefined) {
  const [state, setState] = useState<ZipUploadState>(INITIAL);
  const abortRef = useRef(false);

  const uploadZip = useCallback(async (file: File) => {
    if (!eventId || !userId) return;
    abortRef.current = false;

    // Size check
    if (file.size > MAX_ZIP_SIZE) {
      setState({ ...INITIAL, error: `ZIP file exceeds 500MB limit (${(file.size / 1024 / 1024).toFixed(0)}MB)` });
      return;
    }

    setState({ ...INITIAL, isExtracting: true });

    try {
      const zip = await JSZip.loadAsync(file);
      
      // Extract image entries
      const imageEntries: { name: string; entry: JSZip.JSZipObject }[] = [];
      zip.forEach((relativePath, entry) => {
        if (entry.dir) return;
        // Skip hidden files (macOS __MACOSX, .DS_Store, etc.)
        const segments = relativePath.split('/');
        if (segments.some(s => s.startsWith('.') || s.startsWith('__'))) return;
        
        const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
        if (IMAGE_EXTENSIONS.has(ext)) {
          imageEntries.push({ name: segments[segments.length - 1], entry });
        }
      });

      if (imageEntries.length === 0) {
        setState({ ...INITIAL, error: 'No image files found in ZIP (supported: jpg, png, webp)' });
        return;
      }

      setState(prev => ({
        ...prev,
        isExtracting: false,
        isUploading: true,
        totalFiles: imageEntries.length,
      }));

      let success = 0;
      let failed = 0;
      const BATCH = 4;

      for (let i = 0; i < imageEntries.length; i += BATCH) {
        if (abortRef.current) break;
        const batch = imageEntries.slice(i, i + BATCH);

        const results = await Promise.allSettled(
          batch.map(async ({ name, entry }) => {
            const blob = await entry.async('blob');
            const ext = name.split('.').pop() ?? 'jpg';
            const path = `${userId}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            
            const { error: uploadError } = await supabase.storage
              .from('gallery-photos')
              .upload(path, blob, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
            
            const { error: insertError } = await supabase.from('photos').insert({
              event_id: eventId,
              user_id: userId,
              url: publicUrl,
              file_name: name,
            } as any);
            if (insertError) throw insertError;
          }),
        );

        results.forEach(r => {
          if (r.status === 'fulfilled') success++;
          else failed++;
        });

        const completed = Math.min(i + BATCH, imageEntries.length);
        setState(prev => ({
          ...prev,
          completedFiles: completed,
          successCount: success,
          failedCount: failed,
          percent: Math.round((completed / imageEntries.length) * 100),
        }));
      }

      setState(prev => ({
        ...prev,
        isUploading: false,
        isDone: true,
        percent: 100,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isExtracting: false,
        isUploading: false,
        error: 'Failed to read ZIP file. It may be corrupted.',
      }));
    }
  }, [eventId, userId]);

  const dismiss = useCallback(() => setState(INITIAL), []);

  return { ...state, uploadZip, dismiss };
}
