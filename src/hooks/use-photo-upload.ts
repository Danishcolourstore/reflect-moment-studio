import { useState, useCallback, useRef } from "react";
import pLimit from "p-limit";
import { supabase } from "@/integrations/supabase/client";
import { compressForGallery } from "@/lib/imageCompression";

export type FileStatus =
  | "queued"
  | "pending"
  | "uploading"
  | "compressing"
  | "finalizing"
  | "success"
  | "failed"
  | "duplicate";
export type ErrorType = "size" | "cors" | "network" | "timeout" | "storage" | "duplicate" | "unknown";

export interface FileUploadInfo {
  file: File;
  originalFile?: File;
  galleryFile?: File;
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

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const UPLOAD_TIMEOUT = 300_000;
const FAST_CONCURRENCY = 4;
const SLOW_CONCURRENCY = 2;
const BUCKET = "gallery-photos";

function getAdaptiveConcurrency(): number {
  try {
    const conn = (navigator as any)?.connection;
    if (!conn || typeof conn.effectiveType !== "string") return SLOW_CONCURRENCY;
    if (conn.saveData) return SLOW_CONCURRENCY;
    return conn.effectiveType === "4g" ? FAST_CONCURRENCY : SLOW_CONCURRENCY;
  } catch {
    return SLOW_CONCURRENCY;
  }
}

type UploadResult = "success" | "failed" | "duplicate";

function classifyError(err: any): { message: string; type: ErrorType } {
  const msg = String(err?.message || err || "").toLowerCase();
  if (msg.includes("cors") || msg.includes("access-control"))
    return { message: "Server configuration issue — contact support", type: "cors" };
  if (msg.includes("timeout") || msg.includes("aborted") || msg.includes("timed out"))
    return { message: "Upload timed out — check connection and retry", type: "timeout" };
  if (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("err_connection") ||
    msg.includes("load failed")
  )
    return { message: "Network issue — try a different connection", type: "network" };
  if (msg.includes("payload too large") || msg.includes("entity too large") || msg.includes("too large"))
    return { message: `Photo too large — max ${MAX_FILE_SIZE / (1024 * 1024)}MB`, type: "size" };
  if (msg.includes("storage") || msg.includes("bucket") || msg.includes("policy"))
    return { message: "Storage error — please try again", type: "storage" };
  return { message: err?.message || "Upload failed — please retry", type: "unknown" };
}

async function fileHash(file: File): Promise<string> {
  const size = file.size;
  const chunkSize = 65536;
  const first = file.slice(0, Math.min(chunkSize, size));
  const last = size > chunkSize ? file.slice(size - chunkSize) : new Blob();
  const buf = await new Blob([first, last]).arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return `${size}-${hashArr
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Upload timed out")), timeoutMs)),
  ]);
}

export function usePhotoUpload(
  eventId: string | undefined,
  userId: string | undefined,
  optimizedUpload: boolean = true,
) {
  const [state, setState] = useState<UploadState>(INITIAL);
  const abortRef = useRef(false);

  const updateFileInfo = useCallback((id: string, patch: Partial<FileUploadInfo>) => {
    setState((prev) => ({
      ...prev,
      fileInfos: prev.fileInfos.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }, []);

  const markProgress = useCallback(
    (completed: number, success: number, duplicates: number, failed: File[], total: number, startTime: number) => {
      const elapsed = Date.now() - startTime;
      const avgPerFile = completed > 0 ? elapsed / completed : 0;
      const remaining = avgPerFile > 0 ? (total - completed) * avgPerFile : 0;

      setState((prev) => ({
        ...prev,
        completedFiles: completed,
        successCount: success,
        duplicateCount: duplicates,
        failedFiles: [...failed],
        percent: Math.round((completed / total) * 100),
        estimatedTimeRemaining: remaining > 0 ? Math.round(remaining / 1000) : null,
      }));
    },
    [],
  );

  const uploadSingleFile = useCallback(
    async (info: FileUploadInfo, existingHashes: Set<string>): Promise<UploadResult> => {
      const { file, id } = info;

      if (!eventId || !userId) return "failed";

      if (file.size > MAX_FILE_SIZE) {
        updateFileInfo(id, {
          status: "failed",
          error: `Photo too large — max ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
          errorType: "size",
        });
        return "failed";
      }

      try {
        const hash = await fileHash(file);
        if (existingHashes.has(hash)) {
          updateFileInfo(id, { status: "duplicate", error: "Duplicate photo skipped", errorType: "duplicate" });
          return "duplicate";
        }
        existingHashes.add(hash);
      } catch {}

      try {
        updateFileInfo(id, {
          status: optimizedUpload ? "compressing" : "uploading",
          progress: 3,
          originalSize: file.size,
          originalFile: file,
        });
        const galleryFile = optimizedUpload ? await compressForGallery(file) : file;
        updateFileInfo(id, { galleryFile, compressedSize: galleryFile.size, status: "uploading", progress: 10 });

        if (abortRef.current) return "failed";

        const path = `events/${eventId}/live/${crypto.randomUUID()}.jpg`;

        const uploadPromise = supabase.storage.from(BUCKET).upload(path, galleryFile, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

        const { error: uploadError } = await withTimeout(uploadPromise, UPLOAD_TIMEOUT);
        if (uploadError) throw uploadError;

        updateFileInfo(id, { status: "finalizing", progress: 96 });

        const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

        const { error: insertError } = await supabase.from("photos").insert({
          event_id: eventId,
          user_id: userId,
          url: publicUrl,
          storage_path: path, // ✅ FIX ADDED HERE
          file_name: file.name,
          file_size: galleryFile.size,
        } as any);

        if (insertError) throw insertError;

        updateFileInfo(id, { status: "success", progress: 100 });
        return "success";
      } catch (err: any) {
        const classified = classifyError(err);
        updateFileInfo(id, { status: "failed", error: classified.message, errorType: classified.type, progress: 0 });
        return "failed";
      }
    },
    [eventId, optimizedUpload, updateFileInfo, userId],
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!eventId || !userId || files.length === 0) return;
      abortRef.current = false;

      const infos: FileUploadInfo[] = files.map((file, i) => ({
        file,
        originalFile: file,
        id: `${Date.now()}-${i}`,
        status: "queued",
        progress: 0,
        retryCount: 0,
        originalSize: file.size,
      }));

      const startTime = Date.now();

      setState({
        isUploading: true,
        totalFiles: files.length,
        completedFiles: 0,
        successCount: 0,
        failedFiles: [],
        duplicateCount: 0,
        isDone: false,
        percent: 0,
        fileInfos: infos,
        startTime,
        estimatedTimeRemaining: null,
      });

      const existingHashes = new Set<string>();
      let success = 0;
      let duplicates = 0;
      const failed: File[] = [];
      let completed = 0;

      const limit = pLimit(getAdaptiveConcurrency());

      const tasks = infos.map((info) =>
        limit(async () => {
          if (abortRef.current) return;

          const result = await uploadSingleFile(info, existingHashes);

          completed += 1;
          if (result === "success") success += 1;
          if (result === "duplicate") duplicates += 1;
          if (result === "failed") failed.push(info.file);

          markProgress(completed, success, duplicates, failed, infos.length, startTime);
        }),
      );

      await Promise.all(tasks);

      setState((prev) => ({
        ...prev,
        isUploading: false,
        isDone: true,
        percent: 100,
        estimatedTimeRemaining: null,
      }));
    },
    [eventId, userId, uploadSingleFile, markProgress],
  );

  const retrySingle = useCallback(
    async (fileId: string) => {
      if (!eventId || !userId) return;

      const info = state.fileInfos.find((f) => f.id === fileId);
      if (!info) return;

      const startTime = Date.now();

      setState((prev) => ({ ...prev, isUploading: true, isDone: false }));

      const result = await uploadSingleFile(
        { ...info, retryCount: 0, status: "queued", progress: 0, error: undefined },
        new Set(),
      );

      setState((prev) => {
        const failedFiles = result === "success" ? prev.failedFiles.filter((f) => f !== info.file) : prev.failedFiles;

        const completedFiles =
          result === "success" ? Math.min(prev.completedFiles + 1, prev.totalFiles) : prev.completedFiles;

        const successCount = result === "success" ? prev.successCount + 1 : prev.successCount;

        const allDone = prev.fileInfos.every((f) =>
          f.id === fileId ? result === "success" : ["success", "failed", "duplicate"].includes(f.status),
        );

        return {
          ...prev,
          completedFiles,
          successCount,
          failedFiles,
          isUploading: !allDone,
          isDone: allDone,
          percent: prev.totalFiles > 0 ? Math.round((completedFiles / prev.totalFiles) * 100) : prev.percent,
          startTime,
        };
      });
    },
    [eventId, userId, state.fileInfos, uploadSingleFile],
  );

  const retry = useCallback(() => {
    const filesToRetry = [...state.failedFiles];
    if (filesToRetry.length > 0) uploadFiles(filesToRetry);
  }, [state.failedFiles, uploadFiles]);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const dismiss = useCallback(() => {
    setState(INITIAL);
  }, []);

  return { ...state, uploadFiles, retry, retrySingle, cancel, dismiss };
}
