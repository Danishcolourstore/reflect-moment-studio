import type { ImageRecord } from "./types.js";
import { toMediaUrl } from "./utils.js";

export function serializeImage(record: ImageRecord) {
  return {
    ...record,
    originalUrl: toMediaUrl(record.originalPath),
    previewUrl: toMediaUrl(record.previewPath),
    processedUrl: toMediaUrl(record.processedPath),
  };
}
