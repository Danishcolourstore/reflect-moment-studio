import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { mirrorDb } from "../db.js";
import { config } from "../config.js";
import { makeStoredName, toPublicUrl } from "../storage.js";
import { enqueueImageProcessing } from "../queueing.js";
import { logger } from "../logger.js";
import type { ImageRecord } from "../types/models.js";

export interface RegisterImageInput {
  sourcePath: string;
  fileName?: string;
  source: "ftp" | "api" | "filesystem";
  shootCategory?: string;
}

async function copyToOriginalStore(sourcePath: string, fileName: string): Promise<string> {
  const storedName = makeStoredName(fileName);
  const targetPath = path.join(config.originalsDir, storedName);
  await fs.promises.copyFile(sourcePath, targetPath);
  return targetPath;
}

export async function registerIncomingImage(input: RegisterImageInput): Promise<ImageRecord> {
  const control = mirrorDb.getControl();
  const baseName = input.fileName ?? path.basename(input.sourcePath);
  const storedOriginal = await copyToOriginalStore(input.sourcePath, baseName);
  const now = new Date().toISOString();

  const image: ImageRecord = {
    id: randomUUID(),
    fileName: baseName,
    originalPath: storedOriginal,
    originalUrl: toPublicUrl(storedOriginal),
    source: input.source,
    status: "queued",
    shootCategory: input.shootCategory ?? control.shootCategory,
    presetId: control.activePresetId,
    retouchIntensity: control.retouchIntensity,
    createdAt: now,
    updatedAt: now,
  };

  mirrorDb.upsertImage(image);
  await enqueueImageProcessing(image.id);
  logger.info({ imageId: image.id, source: input.source, fileName: baseName }, "Registered incoming image");
  return image;
}
