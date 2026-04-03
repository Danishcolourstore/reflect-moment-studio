import { Worker } from "bullmq";
import { queueClient } from "./queueClient";
import { IMAGE_PROCESSING_QUEUE } from "./queueNames";
import { processJob } from "../processing/imagePipeline";
import { imageRepository } from "../storage/imageRepository";
import { realtimeHub } from "../realtime/realtimeHub";
import { logger } from "../utils/logger";

let worker: Worker | null = null;

export function startProcessingWorker(): Worker | null {
  if (worker) {
    return worker;
  }

  queueClient.registerProcessor(async (payload) => {
    await processJob(payload);
    const stats = await queueClient.stats();
    imageRepository.setQueueStats(stats);
    realtimeHub.broadcastQueueStats(stats);
  });

  if (!queueClient.isRedisEnabled() || !queueClient.getConnection()) {
    logger.info("Redis queue unavailable; using in-process queue worker");
    return null;
  }

  worker = new Worker(
    IMAGE_PROCESSING_QUEUE,
    async (job) => {
      await processJob(job.data);
      const stats = await queueClient.stats();
      imageRepository.setQueueStats(stats);
      realtimeHub.broadcastQueueStats(stats);
    },
    {
      connection: queueClient.getConnection()!,
      concurrency: 2,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, "Queue job failed");
  });

  worker.on("error", (error) => {
    logger.error({ error: error.message }, "Queue worker error");
  });

  logger.info("Queue worker started");
  return worker;
}

export async function stopProcessingWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await queueClient.close();
}
