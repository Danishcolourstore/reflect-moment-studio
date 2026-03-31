import express from "express";
import cors from "cors";
import http from "node:http";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { ensureStorageDirs } from "./storage.js";
import { initializeMetadataStore, updateImageRecord } from "./metadataStore.js";
import { startFtpServer } from "./ftp.js";
import { startIngestionWatcher } from "./ingestion.js";
import { registerApi } from "./api.js";
import { RealtimeHub } from "./realtime.js";
import { processImageJob } from "./processor.js";
import { processingQueue } from "./queue.js";
import { getImageById } from "./metadataStore.js";
import { serializeImage } from "./serializers.js";
import { nowIso } from "./utils.js";

async function bootstrap() {
  await ensureStorageDirs();
  await initializeMetadataStore();

  const app = express();
  app.use(cors({ origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN }));
  app.use(express.json({ limit: "5mb" }));

  const server = http.createServer(app);
  const realtime = new RealtimeHub(server);

  registerApi(app, realtime);

  await processingQueue.startWorker(async (job) => {
    const { imageId } = job;
    try {
      await processImageJob(job);
      const updated = await getImageById(imageId);
      if (updated) {
        realtime.broadcast({
          type: "image:done",
          payload: serializeImage(updated),
          timestamp: nowIso(),
        });
      }
    } catch (error) {
      const failed = await updateImageRecord(imageId, (record) => ({
        ...record,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown processing failure",
        updatedAt: nowIso(),
      }));
      if (failed) {
        realtime.broadcast({
          type: "image:failed",
          payload: serializeImage(failed),
          timestamp: nowIso(),
        });
      }
      throw error;
    }
  });

  const ftp = await startFtpServer();
  const watcher = await startIngestionWatcher(realtime);

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "mirror ai backend listening");
  });

  const shutdown = async () => {
    logger.info("shutting down mirror ai backend");
    await watcher.close();
    await ftp.close();
    await processingQueue.close?.();
    server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "fatal bootstrap error");
  process.exit(1);
});
