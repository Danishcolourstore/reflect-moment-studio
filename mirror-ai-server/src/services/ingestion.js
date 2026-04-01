import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";

const sanitizeFilename = (name) => {
  const extension = path.extname(name).toLowerCase();
  const base = path.basename(name, extension).replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${Date.now()}-${base || randomUUID()}${extension || ".jpg"}`;
};

export const createIngestionService = ({ storage, state, queue, hub, logger }) => {
  const ingestIncomingFile = async ({
    uploadedPath,
    originalFilename,
    source = "ftp",
    cleanupSource = true,
  }) => {
    const finalFilename = sanitizeFilename(originalFilename);
    const storagePaths = storage.buildPaths(finalFilename);
    await storage.copyFile(uploadedPath, storagePaths.originalPath);

    const image = state.addIncomingImage({
      originalFilename,
      source,
      storageFilename: finalFilename,
      originalPath: storagePaths.originalPath,
      relativeOriginalPath: storagePaths.relativeOriginalPath,
      relativePreviewPath: storagePaths.relativePreviewPath,
      relativeProcessedPath: storagePaths.relativeProcessedPath,
      relativeMetadataPath: storagePaths.relativeMetadataPath,
    });

    hub.broadcast("image.queued", image);
    await queue.enqueueImage(image.id);

    if (cleanupSource) {
      await fs.unlink(uploadedPath).catch(() => {});
    }

    logger.info("Image ingested", { imageId: image.id, originalFilename, finalFilename, source });
    return image;
  };

  return {
    ingestIncomingFile,
  };
};
