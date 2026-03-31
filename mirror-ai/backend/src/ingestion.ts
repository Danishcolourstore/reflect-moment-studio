import fs from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import mime from "mime-types";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { createImageRecord, getSettings, updateImageRecord } from "./metadataStore.js";
import { processingQueue } from "./queue.js";
import { serializeImage } from "./serializers.js";
import { nowIso } from "./utils.js";
import type { RealtimeHub } from "./realtime.js";
import type { PipelineOptions } from "./types.js";

const supportedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function isSupportedImage(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return supportedExt.has(ext);
}

export async function startIngestionWatcher(realtime: RealtimeHub) {
  await fs.mkdir(config.paths.incoming, { recursive: true });
  await fs.mkdir(config.paths.originals, { recursive: true });

  const watcher = chokidar.watch(config.paths.incoming, {
    ignoreInitial: true,
    depth: 6,
    awaitWriteFinish: {
      stabilityThreshold: 800,
      pollInterval: 100,
    },
  });

  watcher.on("add", async (incomingPath) => {
    if (!isSupportedImage(incomingPath)) {
      return;
    }

    try {
      const basename = path.basename(incomingPath);
      const imageId = nanoid(12);
      const now = nowIso();
      const finalOriginalPath = path.join(config.paths.originals, `${imageId}-${basename}`);
      await fs.rename(incomingPath, finalOriginalPath);

      const stat = await fs.stat(finalOriginalPath);
      const meta = await sharp(finalOriginalPath).metadata();
      const defaults = await getSettings();
      const options: PipelineOptions = {
        preset: defaults.preset,
        retouchIntensity: defaults.retouchIntensity,
        category: defaults.category,
      };

      const record = await createImageRecord({
        id: imageId,
        filename: basename,
        category: options.category,
        preset: options.preset,
        retouchIntensity: options.retouchIntensity,
        status: "uploaded",
        createdAt: now,
        updatedAt: now,
        originalPath: finalOriginalPath,
        previewPath: null,
        processedPath: null,
        metadata: {
          sizeBytes: stat.size,
          width: meta.width,
          height: meta.height,
          mimeType: mime.lookup(finalOriginalPath) || undefined,
        },
      });

      realtime.broadcast({
        type: "image:uploaded",
        payload: serializeImage(record),
        timestamp: nowIso(),
      });

      const processingRecord = await updateImageRecord(imageId, (item) => ({
        ...item,
        status: "processing",
        updatedAt: nowIso(),
      }));

      if (processingRecord) {
        realtime.broadcast({
          type: "image:processing",
          payload: serializeImage(processingRecord),
          timestamp: nowIso(),
        });
      }

      await processingQueue.enqueue({
        imageId,
        originalPath: finalOriginalPath,
        filename: basename,
        options,
      });
      logger.info({ imageId, basename }, "ingested and queued image");
    } catch (error) {
      logger.error({ err: error, incomingPath }, "failed to ingest incoming image");
    }
  });

  watcher.on("error", (error) => {
    logger.error({ err: error }, "ingestion watcher error");
  });

  logger.info({ watchPath: config.paths.incoming }, "ingestion watcher started");

  return {
    close: async () => {
      await watcher.close();
    },
  };
}
