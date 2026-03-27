import { Worker } from "bullmq";
import IORedis from "ioredis";
import {
  ImageStatus,
  readImageMetadata,
  updateImageMetadata,
} from "@mirror-ai/shared";
import { config } from "./config.js";
import { processImage } from "./engine.js";

const redisConnection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "mirror-ai-images",
  async (job) => {
    const imageId = job?.data?.imageId;
    if (!imageId) {
      throw new Error("Job missing imageId");
    }

    const image = await readImageMetadata(imageId);
    if (!image) {
      throw new Error(`Image metadata not found for ${imageId}`);
    }

    await updateImageMetadata(imageId, () => ({
      status: ImageStatus.PROCESSING,
      error: null,
    }));

    try {
      const result = await processImage({
        imageId,
        originalPath: image.originalPath,
        originalName: image.originalName,
        presetId: job.data?.presetId ?? image.presetId,
        retouchIntensity: job.data?.retouchIntensity ?? image.retouchIntensity,
      });

      const updated = await updateImageMetadata(imageId, (current) => ({
        presetId: result.presetId,
        retouchIntensity: result.retouchIntensity,
        analysis: result.analysis,
        fullPath: result.fullPath,
        previewPath: result.previewPath,
        status: ImageStatus.DONE,
        error: null,
        category: job.data?.category ?? current.category,
      }));
      return updated;
    } catch (error) {
      await updateImageMetadata(imageId, () => ({
        status: ImageStatus.FAILED,
        error: error?.message ?? "Processing failed",
      }));
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 4,
  },
);

worker.on("ready", () => {
  console.log("[worker] ready");
});

worker.on("completed", (job) => {
  console.log(`[worker] completed job=${job.id} image=${job.data.imageId}`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] failed job=${job?.id} image=${job?.data?.imageId}`, error);
});

const shutdown = async () => {
  console.log("[worker] shutting down");
  await Promise.allSettled([worker.close(), redisConnection.quit()]);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
