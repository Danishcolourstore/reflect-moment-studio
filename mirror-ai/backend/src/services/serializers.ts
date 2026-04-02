import { env } from "../config/env.js";
import type { ImageRecord, PublicImageRecord } from "../types/domain.js";

function toUrl(pathPart?: string): string | undefined {
  if (!pathPart) {
    return undefined;
  }
  return `${env.PUBLIC_BASE_URL}/files/${pathPart.replaceAll("\\", "/")}`;
}

export function toPublicImage(image: ImageRecord): PublicImageRecord {
  return {
    id: image.id,
    filename: image.filename,
    source: image.source,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    status: image.status,
    category: image.category,
    presetId: image.presetId,
    retouchIntensity: image.retouchIntensity,
    error: image.error,
    analysis: image.analysis,
    originalUrl: toUrl(image.originalPath) ?? "",
    previewUrl: toUrl(image.previewPath),
    processedUrl: toUrl(image.processedPath),
  };
}
