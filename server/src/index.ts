import http from "node:http";
import path from "node:path";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { ensureStorageDirs, storageRoot } from "./storage/fileStore";
import { createApiRouter } from "./api/routes";
import { realtimeHub } from "./realtime/realtimeHub";
import { startFtpIngest, stopFtpIngest } from "./ingest/ftpIngest";
import { startProcessingWorker, stopProcessingWorker } from "./queue/processorWorker";

async function bootstrap(): Promise<void> {
  await ensureStorageDirs();

  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","), credentials: false }));
  app.use(express.json({ limit: "20mb" }));
  app.use("/api", createApiRouter());
  app.use("/storage", express.static(storageRoot));
  app.use("/", express.static(path.join(process.cwd(), "dist")));

  const server = http.createServer(app);
  realtimeHub.attach(server);
  startProcessingWorker();
  await startFtpIngest();

  server.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        ftpPort: env.FTP_PORT,
        baseUrl: env.BASE_URL,
        redisEnabled: env.REDIS_ENABLED,
      },
      "Mirror AI backend online",
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutdown requested");
    try {
      await stopFtpIngest();
      await stopProcessingWorker();
      realtimeHub.close();
      server.close();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logger.error({ error }, "Fatal startup failure");
  process.exit(1);
});
