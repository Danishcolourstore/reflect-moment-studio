import { randomUUID } from "node:crypto";
import path from "node:path";
import { paths, toRelativeStoragePath } from "../config/paths.js";
import { enqueueImageJob } from "../queue/imageQueue.js";
import { broadcast } from "../realtime/wsServer.js";
import { moveFile } from "./fs.js";
import { toPublicImage } from "./serializers.js";
import { store } from "./store.js";
import type { ImageRecord, SourceType } from "../types/domain.js";

const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"]);

export function isSupportedImage(filePath: string): boolean {
  return supportedExtensions.has(path.extname(filePath).toLowerCase());
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function ingestIncomingFile(filePath: string, source: SourceType): Promise<ImageRecord> {
  if (!isSupportedImage(filePath)) {
    throw new Error(`Unsupported file type: ${path.extname(filePath)}`);
  }

  const control = store.getControlState();
  const ext = path.extname(filePath).toLowerCase() || ".jpg";
  const base = sanitizeFileName(path.basename(filePath, ext));
  const destinationFileName = `${Date.now()}_${randomUUID().slice(0, 8)}_${base}${ext}`;
  const destinationAbsolutePath = path.join(paths.originals, destinationFileName);

  await moveFile(filePath, destinationAbsolutePath);

  const image = await store.createImage({
    filename: destinationFileName,
    source,
    originalPath: toRelativeStoragePath(destinationAbsolutePath),
    category: control.category,
    presetId: control.presetId,
    retouchIntensity: control.retouchIntensity,
  });

  await enqueueImageJob({
    imageId: image.id,
    presetId: image.presetId,
    retouchIntensity: image.retouchIntensity,
    category: image.category,
  });

  broadcast("image.created", { image: toPublicImage(image) });
  return image;
}
