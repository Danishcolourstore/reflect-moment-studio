import http from "node:http";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { paths } from "./config/paths.js";
import { startFtpServer } from "./ftp/server.js";
import { initializeStorage } from "./services/fs.js";
import { store } from "./services/store.js";
import { registerRoutes } from "./routes/index.js";
import { setupWebSocketServer } from "./realtime/wsServer.js";
import { setupImageWorker } from "./queue/worker.js";
import { logger } from "./utils/logger.js";

const app = express();
const server = http.createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.use("/files", express.static(paths.storageRoot, { maxAge: "1d", immutable: false }));

app.use("/api", registerRoutes());
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled API error", error);
  res.status(500).json({ error: "Internal server error" });
});

async function boot() {
  await initializeStorage();
  await store.bootstrap();

  setupWebSocketServer(server);
  setupImageWorker();
  await startFtpServer();

  server.listen(env.PORT, () => {
    logger.info(`Mirror AI backend listening on :${env.PORT}`);
    logger.info(`FTP listening on :${env.FTP_PORT} (user: ${env.FTP_USER})`);
    logger.info(`Storage root: ${path.resolve(paths.storageRoot)}`);
  });
}

boot().catch((error) => {
  logger.error("Fatal boot error", { error });
  process.exit(1);
});
