import path from "node:path";
import http from "node:http";
import express from "express";
import cors from "cors";
import { config, storagePaths } from "./config.js";
import { createLogger } from "./logger.js";
import { ensureStorageReady } from "./storage.js";
import { MetadataStore } from "./metadata-store.js";
import { createQueueSystem } from "./queue.js";
import { processImageJob } from "./image-processor.js";
import { createWebSocketHub } from "./websocket-hub.js";
import { startFtpServer } from "./ftp.js";
import { startIngestionWatcher } from "./ingestion.js";
import { createApiRouter } from "./api.js";
import { clamp } from "./utils.js";

const logger = createLogger(config.app.logLevel);
const metadataStore = new MetadataStore(storagePaths.metadataFile, logger);

async function main() {
  await ensureStorageReady(storagePaths);
  await metadataStore.load();

  const app = express();
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json({ limit: "4mb" }));

  const server = http.createServer(app);
  const wsHub = createWebSocketHub(server, logger);

  const queue = await createQueueSystem({
    redisUrl: config.redis.url,
    queueName: config.queue.name,
    logger,
    concurrency: config.processing.workerConcurrency,
    onJob: async (jobData) => {
      const start = Date.now();
      const originalMeta = metadataStore.getById(jobData.imageId);
      if (!originalMeta) {
        throw new Error(`Image ${jobData.imageId} not found`);
      }

      metadataStore.updateImage(jobData.imageId, {
        status: "processing",
        error: null,
      });

      wsHub.broadcast("image:status", {
        id: jobData.imageId,
        status: "processing",
      });

      const processed = await processImageJob({
        imageId: jobData.imageId,
        originalFilePath: originalMeta.originalFilePath,
        originalFileName: originalMeta.originalFileName,
        category: jobData.category || originalMeta.category || config.processing.defaultCategory,
        presetId: jobData.presetId || originalMeta.presetId || config.processing.defaultPreset,
        retouchIntensity:
          typeof jobData.retouchIntensity === "number"
            ? clamp(jobData.retouchIntensity, 0, 1)
            : typeof originalMeta.retouchIntensity === "number"
              ? clamp(originalMeta.retouchIntensity, 0, 1)
              : config.processing.defaultRetouchIntensity,
        outputQuality: config.processing.outputQuality,
        previewMaxWidth: config.processing.previewMaxWidth,
        previewQuality: config.processing.previewQuality,
        processedDir: storagePaths.processed,
        previewsDir: storagePaths.previews,
      });

      const durationMs = Date.now() - start;
      const updated = metadataStore.updateImage(jobData.imageId, {
        status: "done",
        analysis: processed.analysis,
        presetId: processed.presetId,
        category: processed.category,
        retouchIntensity: processed.retouchIntensity,
        previewFilePath: processed.previewFilePath,
        processedFilePath: processed.processedFilePath,
        previewUrl: `/assets/previews/${path.basename(processed.previewFilePath)}`,
        processedUrl: `/assets/processed/${path.basename(processed.processedFilePath)}`,
        processingMs: durationMs,
        error: null,
      });

      wsHub.broadcast("image:done", updated);
      return updated;
    },
  });

  queue.on("failed", ({ data, error }) => {
    if (!data?.imageId) return;
    metadataStore.updateImage(data.imageId, {
      status: "error",
      error: error?.message || String(error),
    });
    wsHub.broadcast("image:error", {
      id: data.imageId,
      status: "error",
      error: error?.message || String(error),
    });
  });

  app.use("/assets/originals", express.static(storagePaths.originals, { maxAge: "1d" }));
  app.use("/assets/previews", express.static(storagePaths.previews, { maxAge: "1d" }));
  app.use("/assets/processed", express.static(storagePaths.processed, { maxAge: "1d" }));

  app.get("/healthz", async (_req, res) => {
    const pending = await queue.getPendingCount();
    res.json({
      ok: true,
      queueMode: queue.mode,
      pending,
      imageCount: metadataStore.getImages().length,
    });
  });

  app.use(
    "/api",
    createApiRouter({
      metadataStore,
      queue,
      wsHub,
      logger,
    }),
  );

  const watcher = await startIngestionWatcher({
    incomingDir: storagePaths.incoming,
    originalsDir: storagePaths.originals,
    metadataStore,
    queue,
    wsHub,
    logger,
  });

  const ftpServer = await startFtpServer({
    ftpConfig: config.ftp,
    incomingDir: storagePaths.incoming,
    logger,
  });

  server.listen(config.app.port, config.app.host, () => {
    logger.info("Mirror AI API online", {
      host: config.app.host,
      port: config.app.port,
      queueMode: queue.mode,
    });
    logger.info("Mirror AI FTP online", {
      host: config.ftp.host,
      port: config.ftp.port,
      user: config.ftp.username,
    });
  });

  async function shutdown(signal) {
    logger.warn("Shutting down Mirror AI", { signal });
    await watcher.stop();
    await ftpServer.close();
    await queue.close();
    wsHub.close();
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error("Mirror AI boot failed", {
    error: error?.message || String(error),
    stack: error?.stack,
  });
  process.exit(1);
});
