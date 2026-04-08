import fs from "node:fs/promises";
import path from "node:path";
import PQueue from "p-queue";
import { env } from "../config/env.js";
import { eventBus } from "./event-bus.js";
import { getPresetById } from "./presets.js";
import { applyPresetToBuffer } from "./image-processor.js";
import { imageRepository } from "./repository.js";
import type { StorageDirs } from "./storage.js";

export interface ProcessingQueue extends PQueue {
  enqueue(imageId: string): Promise<void>;
}

export function createProcessingQueue(dirs: StorageDirs): ProcessingQueue {
  const queue = new PQueue({
    concurrency: env.PROCESS_CONCURRENCY,
    autoStart: true,
    throwOnTimeout: false,
  });

  async function enqueue(imageId: string): Promise<void> {
    void queue.add(async () => {
      const image = imageRepository.findById(imageId);
      if (!image) return;

      const started = imageRepository.update(image.id, {
        status: "processing",
        processingStartedAt: Date.now(),
        error: null,
      });
      eventBus.emitImageStatus(started);

      try {
        const originalPath = path.resolve(dirs.originals, image.originalStoredFilename);
        if (image.originalPath !== originalPath) {
          await fs.copyFile(image.originalPath, originalPath);
          imageRepository.update(image.id, { originalPath });
        }

        const preset = getPresetById(image.controls.presetId);
        const processed = await applyPresetToBuffer(originalPath, {
          preset,
          category: image.controls.category,
          retouchIntensity: image.controls.retouchIntensity,
          previewMaxWidth: env.PREVIEW_MAX_WIDTH,
          previewQuality: env.PREVIEW_QUALITY,
          fullQuality: env.FULL_QUALITY,
        });

        const previewPath = path.resolve(dirs.previews, `${image.id}.jpg`);
        const fullPath = path.resolve(dirs.processed, `${image.id}.jpg`);
        await fs.writeFile(previewPath, processed.previewBuffer);
        await fs.writeFile(fullPath, processed.fullBuffer);

        const done = imageRepository.update(image.id, {
          status: "done",
          previewPath,
          processedPath: fullPath,
          processingFinishedAt: Date.now(),
          processedAt: Date.now(),
          error: null,
          metadata: {
            width: processed.width,
            height: processed.height,
            bytesOriginal: processed.bytesOriginal,
            bytesPreview: processed.bytesPreview,
            bytesProcessed: processed.bytesProcessed,
            analysis: processed.analysis,
          },
        });
        await fs.writeFile(
          path.resolve(dirs.metadata, `${image.id}.json`),
          JSON.stringify(done, null, 2),
          "utf-8",
        );
        eventBus.emitImageStatus(done);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unknown processing failure";
        const failed = imageRepository.update(image.id, {
          status: "error",
          error: reason,
          processingFinishedAt: Date.now(),
        });
        eventBus.emitImageStatus(failed);
      }
    });
    await Promise.resolve();
  }

  return Object.assign(queue, { enqueue });
}
