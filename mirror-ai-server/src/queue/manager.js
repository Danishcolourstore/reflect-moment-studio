import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import net from "node:net";
import { analyzeImage } from "../processing/analyze.js";
import { processImage } from "../processing/pipeline.js";

const EMPTY_QUEUE_STATS = {
  queued: 0,
  processing: 0,
  completed: 0,
  failed: 0,
};

const createQueueStats = () => ({ ...EMPTY_QUEUE_STATS });

const canConnectToRedis = async (redisUrl) => {
  try {
    const parsed = new URL(redisUrl);
    const host = parsed.hostname || "127.0.0.1";
    const port = Number(parsed.port || 6379);

    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("redis connect timeout"));
      }, 700);

      socket.on("connect", () => {
        clearTimeout(timeout);
        socket.destroy();
        resolve(null);
      });
      socket.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    return true;
  } catch {
    return false;
  }
};

export const createQueueSystem = async ({
  env,
  state,
  storage,
  wsHub,
  logger,
}) => {
  const stats = createQueueStats();

  const processImageById = async (imageId) => {
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
  };

  const redisAvailable = await canConnectToRedis(env.redisUrl);
  if (!redisAvailable) {
    logger.warn("Redis unavailable, using in-memory queue fallback", { redisUrl: env.redisUrl });

    let closed = false;
    let sequence = 0;
    const pending = [];
    const running = new Set();

    const pump = () => {
      if (closed) return;
      while (pending.length > 0 && running.size < env.processingConcurrency) {
        const imageId = pending.shift();
        sequence += 1;
        const jobId = `local-${Date.now()}-${sequence}`;

        stats.queued = Math.max(0, stats.queued - 1);
        stats.processing += 1;
        wsHub.broadcast("queue.active", { jobId, imageId });

        const task = (async () => {
          try {
            await processImageById(imageId);
            stats.completed += 1;
            wsHub.broadcast("queue.completed", { jobId, imageId });
          } catch (error) {
            stats.failed += 1;
            state.updateImage(imageId, {
              status: "failed",
              error: error?.message ?? "Unknown worker error",
            });
            wsHub.notifyImageUpdated(state.getImage(imageId));
            wsHub.broadcast("queue.failed", {
              jobId,
              imageId,
              error: error?.message ?? "Unknown worker error",
            });
            logger.error("Image processing failed", {
              imageId,
              message: error?.message ?? "Unknown worker error",
            });
          } finally {
            stats.processing = Math.max(0, stats.processing - 1);
          }
        })();

        running.add(task);
        task.finally(() => {
          running.delete(task);
          pump();
        });
      }
    };

    return {
      async enqueueImage(imageId) {
        stats.queued += 1;
        pending.push(imageId);
        pump();
      },
      getStats() {
        return { ...stats };
      },
      async close() {
        closed = true;
        await Promise.allSettled([...running]);
      },
    };
  }

  const connection = new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  const queue = new Queue(env.queueName, { connection });
  const worker = new Worker(
    env.queueName,
    async (job) => processImageById(job.data?.imageId),
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
    wsHub.broadcast("queue.failed", {
      jobId: job?.id,
      imageId,
      error: error?.message ?? "Unknown worker error",
    });
    logger.error("Image processing failed", {
      imageId,
      message: error?.message ?? "Unknown worker error",
    });
  });

  return {
    async enqueueImage(imageId) {
      stats.queued += 1;
      await queue.add(
        "process-image",
        { imageId },
        {
          removeOnComplete: 500,
          removeOnFail: 500,
        },
      );
    },
    getStats() {
      return { ...stats };
    },
    async close() {
      await Promise.all([worker.close(), queue.close()]);
      await connection.quit();
    },
  };
};
