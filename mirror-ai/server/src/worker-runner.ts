import { Worker } from "bullmq";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { createWorkerRedisConnection, PROCESSING_QUEUE_NAME } from "./queue/processing-queue.js";
import { processImage } from "./processing/process-image.js";
import type { MirrorService } from "./services/mirror-service.js";
import type { ProcessingJobData } from "./types.js";

export const createProcessingWorker = (service: MirrorService): Worker<ProcessingJobData> => {
  const workerConnection = createWorkerRedisConnection();

  const worker = new Worker<ProcessingJobData>(
    PROCESSING_QUEUE_NAME,
    async (job) => {
      const record = await service.startProcessing(job.data.imageId, {
        preset: job.data.forcePreset,
        retouchIntensity: job.data.forceRetouchIntensity,
      });

      if (!record) {
        logger.warn({ job: job.data }, "Skipping job, image not found");
        return;
      }

      try {
        const output = await processImage({
          imageId: record.id,
          originalPath: record.originalPath,
          preset: record.preset,
          retouchIntensity: record.retouchIntensity,
        });

        await service.markDone(record.id, {
          previewPath: output.previewPath,
          fullPath: output.fullPath,
          thumbnailPath: output.thumbnailPath,
          analysis: output.analysis,
        });
      } catch (error) {
        await service.markFailed(record.id, error);
        throw error;
      }
    },
    {
      connection: workerConnection,
      concurrency: env.MIRROR_AI_WORKER_CONCURRENCY,
    },
  );

  worker.on("ready", () => {
    logger.info({ concurrency: env.MIRROR_AI_WORKER_CONCURRENCY }, "Mirror AI worker ready");
  });

  worker.on("failed", (job, error) => {
    logger.error({ imageId: job?.data.imageId, error }, "Mirror AI worker job failed");
  });

  return worker;
};
