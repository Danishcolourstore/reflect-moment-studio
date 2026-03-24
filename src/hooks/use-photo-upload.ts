import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FileStatus = "pending" | "uploading" | "success" | "failed";

export interface FileUploadInfo {
  file: File;
  id: string;
  status: FileStatus;
  progress: number;
  error?: string;
  originalSize: number;
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
  overallSpeed: number;
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
  overallSpeed: 0,
  estimatedTimeRemaining: null,
};

const MAX_CONCURRENT = 3; // Crucial for MVP stability

export function usePhotoUpload(eventId: string | undefined, userId: string | undefined) {
  const [state, setState] = useState<UploadState>(INITIAL);
  const abortRef = useRef(false);

  const startUpload = useCallback(
    async (files: File[]) => {
      if (!eventId || !userId) return;

      // 1. Initialize State
      const newInfos: FileUploadInfo[] = files.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "pending",
        progress: 0,
        originalSize: file.size,
      }));

      setState((prev) => ({
        ...prev,
        isUploading: true,
        isDone: false,
        totalFiles: prev.totalFiles + files.length,
        fileInfos: [...prev.fileInfos, ...newInfos],
      }));

      // 2. Simple Concurrency Queue
      const queue = [...newInfos];
      const uploadNext = async () => {
        if (queue.length === 0 || abortRef.current) return;

        const info = queue.shift()!;
        const filePath = `${userId}/${eventId}/${Date.now()}-${info.file.name}`;

        try {
          // Update status to uploading
          setState((prev) => ({
            ...prev,
            fileInfos: prev.fileInfos.map((f) => (f.id === info.id ? { ...f, status: "uploading" } : f)),
          }));

          // Supabase Standard Upload
          const { error } = await supabase.storage
            .from("photos") // Ensure your bucket is named 'photos'
            .upload(filePath, info.file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) throw error;

          // Success Update
          setState((prev) => ({
            ...prev,
            successCount: prev.successCount + 1,
            completedFiles: prev.completedFiles + 1,
            percent: ((prev.completedFiles + 1) / prev.totalFiles) * 100,
            fileInfos: prev.fileInfos.map((f) => (f.id === info.id ? { ...f, status: "success", progress: 100 } : f)),
          }));
        } catch (err: any) {
          setState((prev) => ({
            ...prev,
            completedFiles: prev.completedFiles + 1,
            failedFiles: [...prev.failedFiles, info.file],
            fileInfos: prev.fileInfos.map((f) =>
              f.id === info.id ? { ...f, status: "failed", error: err.message } : f,
            ),
          }));
        }

        // Recursive call to pick next file in queue
        await uploadNext();
      };

      // Start 3 workers
      await Promise.all(
        Array(MAX_CONCURRENT)
          .fill(null)
          .map(() => uploadNext()),
      );

      setState((prev) => ({ ...prev, isUploading: false, isDone: true }));
    },
    [eventId, userId],
  );

  return {
    ...state,
    startUpload,
    onCancel: () => {
      abortRef.current = true;
    },
    onDismiss: () => setState(INITIAL),
    onRetry: () => {}, // MVP: Simply re-add files
    onRetrySingle: (id: string) => {},
  };
}
