import express from "express";
import cors from "cors";
import http from "node:http";
import path from "node:path";
import { env } from "./config/env.js";
import { createLogger } from "./utils/logger.js";
import { StorageManager } from "./storage/store.js";
import { MirrorState } from "./services/state.js";
import { WebSocketHub } from "./realtime/ws-hub.js";
import { createApiRouter } from "./routes/api.js";
import { createQueueSystem } from "./queue/manager.js";
import { createIngestionService } from "./services/ingestion.js";
import { createFtpIngestionServer } from "./ftp/server.js";
import { ensureDir } from "./storage/filesystem.js";

const logger = createLogger("mirror-ai");

const boot = async () => {
  const storage = await new StorageManager(env.storageRoot).init();
  await Promise.all([ensureDir(storage.ftpInboxDir), ensureDir(storage.incomingDir)]);
  const state = new MirrorState();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use("/assets", express.static(storage.runDir, { fallthrough: true }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "mirror-ai",
      runId: storage.runId,
      now: new Date().toISOString(),
    });
  });

  const server = http.createServer(app);

  let queue;
  const wsHub = new WebSocketHub({
    server,
    path: env.wsPath,
    logger,
    getSnapshot: () => ({
      images: state.listImages(),
      presets: state.getPresets(),
      settings: state.getSettings(),
      queue: queue ? queue.getStats() : null,
      categories: state.getCategories(),
    }),
  });

  queue = await createQueueSystem({
    env,
    state,
    storage,
    wsHub,
    logger,
  });

  const ingestion = createIngestionService({
    storage,
    state,
    queue,
    hub: wsHub,
    logger,
  });

  const ftp = await createFtpIngestionServer({
    env,
    storage,
    logger,
    onFtpUploadComplete: ingestion.ingestIncomingFile,
  });

  app.use(
    "/api",
    createApiRouter({
      state,
      queue,
      wsHub,
    }),
  );

  server.listen(env.appPort, () => {
    logger.info(`Mirror AI API listening on http://0.0.0.0:${env.appPort}`);
    logger.info(`Mirror AI WS endpoint ws://0.0.0.0:${env.appPort}${env.wsPath}`);
    logger.info(`Mirror AI FTP listening on ftp://${env.ftpHost}:${env.ftpPort}`);
    logger.info(`Upload path: ${path.join(storage.runDir, "ftp-inbox")}`);
  });

  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}. Shutting down Mirror AI...`);
    await queue.close();
    wsHub.close();
    await ftp.close();
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

boot().catch((error) => {
  logger.error("Fatal boot error", { message: error?.message ?? "unknown error" });
  process.exit(1);
});

