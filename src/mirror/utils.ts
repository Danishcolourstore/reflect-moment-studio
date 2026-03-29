import type { ImageRecord, ProcessingStatus } from "./types";

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

const STATUS_COLORS: Record<ProcessingStatus, string> = {
  queued: "text-amber-200 bg-amber-500/15 border-amber-400/30",
  processing: "text-sky-200 bg-sky-500/15 border-sky-400/30",
  done: "text-emerald-200 bg-emerald-500/15 border-emerald-400/30",
  error: "text-rose-200 bg-rose-500/15 border-rose-400/30",
};

export const statusClasses = (status: ProcessingStatus): string =>
  STATUS_COLORS[status] ?? "text-zinc-200 bg-zinc-500/15 border-zinc-400/30";

export const formatRelativeTime = (iso: string): string => {
  const deltaSeconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const resolveAssetUrl = (relativeOrAbsolute?: string): string | undefined => {
  if (!relativeOrAbsolute) return undefined;
  if (/^https?:\/\//.test(relativeOrAbsolute)) return relativeOrAbsolute;
  const base = import.meta.env.VITE_MIRROR_API_URL ?? "http://localhost:4000";
  return `${base}${relativeOrAbsolute}`;
};

export const imageForMode = (image: ImageRecord, mode: "before" | "after"): string | undefined => {
  if (mode === "before") return resolveAssetUrl(image.originalPath);
  return resolveAssetUrl(image.previewPath ?? image.processedPath ?? image.originalPath);
};
