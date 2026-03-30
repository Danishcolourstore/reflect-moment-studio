import path from "node:path";
import { Worker } from "bullmq";
import { config } from "./config.js";
import { getRedisConnection } from "./queue.js";
import { logger } from "./logger.js";
import { mirrorDb } from "./db.js";
import { analyzeImage } from "./pipeline/analyzer.js";
import { processImage } from "./pipeline/processor.js";
import { toPublicUrl } from "./storage.js";

const worker = new Worker(
  config.MIRROR_QUEUE_NAME,
  async (job) => {
    const imageId = job.data.imageId as string;
    const image = mirrorDb.getImageById(imageId);
    if (!image) {
      logger.warn({ imageId }, "Skipping job for missing image");
      return;
    }

    mirrorDb.patchImage(image.id, {
      status: "processing",
      errorMessage: undefined,
    });

    try {
      const analysis = await analyzeImage(image.originalPath);
      const previewPath = path.join(config.previewDir, `${image.id}.jpg`);
      const fullPath = path.join(config.fullDir, `${image.id}.jpg`);

      await processImage(
        image.originalPath,
        previewPath,
        fullPath,
        image.presetId,
        image.retouchIntensity,
        analysis,
      );

      mirrorDb.patchImage(image.id, {
        status: "done",
        analysis,
        previewPath,
        fullPath,
        previewUrl: toPublicUrl(previewPath),
        fullUrl: toPublicUrl(fullPath),
        errorMessage: undefined,
      });

      logger.info({ imageId }, "Image processing complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image processing failed";
      mirrorDb.patchImage(image.id, {
        status: "error",
        errorMessage: message,
      });
      logger.error({ err: error, imageId }, "Image processing failed");
      throw error;
    }
  },
  {
    connection: getRedisConnection().duplicate(),
    concurrency: config.MIRROR_WORKER_CONCURRENCY,
  },
);

worker.on("ready", () => {
  logger.info({ queue: config.MIRROR_QUEUE_NAME, concurrency: config.MIRROR_WORKER_CONCURRENCY }, "Worker ready");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, err: error }, "Worker job failed");
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    logger.info({ signal }, "Shutting down Mirror AI worker");
    await worker.close();
    await getRedisConnection().quit();
    process.exit(0);
  });
}
