import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { processImage } from "../processing/processor.js";
import { broadcast } from "../realtime/wsServer.js";
import { toPublicImage } from "../services/serializers.js";
import { store } from "../services/store.js";
import type { QueueJobPayload } from "../types/domain.js";
import { logger } from "../utils/logger.js";
import { imageQueueName, redisConnection } from "./connection.js";

export function setupImageWorker(): Worker<QueueJobPayload> {
  const worker = new Worker<QueueJobPayload>(
    imageQueueName,
    async (job) => {
      const image = store.getImageById(job.data.imageId);
      if (!image) {
        throw new Error(`Image ${job.data.imageId} not found`);
      }

      const queued = await store.updateImage(image.id, {
        status: "processing",
        presetId: job.data.presetId,
        retouchIntensity: job.data.retouchIntensity,
        category: job.data.category,
        error: undefined,
      });
      broadcast("image.updated", { image: toPublicImage(queued) });

      const result = await processImage({
        image: queued,
        presetId: queued.presetId,
        retouchIntensity: queued.retouchIntensity,
        category: queued.category,
      });

      const done = await store.updateImage(image.id, {
        status: "done",
        previewPath: result.previewPath,
        processedPath: result.processedPath,
        analysis: result.analysis,
        error: undefined,
      });
      broadcast("image.updated", { image: toPublicImage(done) });

      logger.info(`Processing completed: ${done.id}`);
      return done.id;
    },
    {
      connection: redisConnection,
      concurrency: env.QUEUE_CONCURRENCY,
    },
  );

  worker.on("failed", async (job, error) => {
    if (!job) {
      return;
    }
    logger.error(`Processing failed for ${job.data.imageId}: ${error.message}`);
    const failed = await store.setImageStatus(job.data.imageId, "failed", error.message);
    broadcast("image.updated", { image: toPublicImage(failed) });
  });

  return worker;
}
