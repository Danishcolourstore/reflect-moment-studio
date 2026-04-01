import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import { analyzeImage } from "../processing/analyze.js";
import { processImage } from "../processing/pipeline.js";

export const createQueueSystem = async ({
  env,
  state,
  storage,
  wsHub,
  logger,
}) => {
  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  const queue = new Queue(env.queueName, { connection });
  const stats = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  const worker = new Worker(
    env.queueName,
    async (job) => {
      const imageId = job.data?.imageId;
      const image = state.getImage(imageId);
      if (!image) return;

      state.updateImage(image.id, { status: "processing", error: null });
      wsHub.notifyImageUpdated(state.getImage(image.id));

      const preset = state.getActivePreset();
      const settings = state.getSettings();
      const retouchIntensity = image.processing?.retouchIntensity ?? settings.retouchIntensity;
      const analysis = await analyzeImage(image.originalPath);
      const paths = storage.buildPaths(image.storageFilename);

      const processed = await processImage({
        inputPath: image.originalPath,
        previewPath: paths.previewPath,
        processedPath: paths.processedPath,
        analysis,
        preset,
        retouchIntensity,
        previewMaxWidth: env.previewMaxWidth,
      });

      const metadata = {
        imageId: image.id,
        source: image.source,
        category: image.category,
        preset,
        settings,
        analysis,
        adjustments: processed.adjustments,
        processedAt: new Date().toISOString(),
      };
      await storage.writeMetadata(image.storageFilename, metadata);

      state.updateImage(image.id, {
        status: "done",
        analysis,
        metadata,
        previewPath: paths.previewPath,
        processedPath: paths.processedPath,
        previewUrl: storage.toPublicUrl(paths.relativePreviewPath),
        processedUrl: storage.toPublicUrl(paths.relativeProcessedPath),
        originalUrl: storage.toPublicUrl(paths.relativeOriginalPath),
        metadataUrl: storage.toPublicUrl(paths.relativeMetadataPath),
        processing: {
          presetId: preset.id,
          retouchIntensity,
        },
        error: null,
      });
      wsHub.notifyImageUpdated(state.getImage(image.id));
    },
    {
      connection,
      concurrency: env.processingConcurrency,
    },
  );

  worker.on("active", (job) => {
    stats.queued = Math.max(0, stats.queued - 1);
    stats.processing += 1;
    wsHub.broadcast("queue.active", { jobId: job.id, imageId: job.data?.imageId });
  });

  worker.on("completed", (job) => {
    stats.completed += 1;
    stats.processing = Math.max(0, stats.processing - 1);
    wsHub.broadcast("queue.completed", { jobId: job.id, imageId: job.data?.imageId });
  });

  worker.on("failed", (job, error) => {
    stats.failed += 1;
    stats.processing = Math.max(0, stats.processing - 1);
    const imageId = job?.data?.imageId;
    if (imageId) {
      state.updateImage(imageId, {
        status: "failed",
        error: error?.message ?? "Unknown worker error",
      });
      wsHub.notifyImageUpdated(state.getImage(imageId));
    }
    logger.error("Image processing failed", {
      imageId,
      message: error?.message ?? "Unknown worker error",
    });
  });

  const enqueueImage = async (imageId) => {
    stats.queued += 1;
    await queue.add(
      "process-image",
      { imageId },
      {
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    );
  };

  const getStats = () => ({ ...stats });

  const close = async () => {
    await Promise.all([worker.close(), queue.close()]);
    await connection.quit();
  };

  return {
    enqueueImage,
    getStats,
    close,
  };
};
