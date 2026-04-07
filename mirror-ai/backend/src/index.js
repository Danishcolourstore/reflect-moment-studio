import http from "node:http";
import path from "node:path";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { storagePaths } from "./storage/paths.js";
import { initStorage } from "./storage/initStorage.js";
import { initStore, listImages, getControls, getPresets } from "./storage/store.js";
import { registerSocketServer } from "./realtime/hub.js";
import { createApiRouter } from "./api/routes.js";
import { processImageJob } from "./processing/jobProcessor.js";
import { closeQueue, getQueueMode, initQueue } from "./queue/manager.js";
import { createIngestionService } from "./services/ingestionService.js";
import { toPublicImage } from "./api/serializers.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.app.corsOrigin,
    credentials: true,
  },
});

registerSocketServer(io);

app.use(cors({ origin: config.app.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use("/files/originals", express.static(storagePaths.originals));
app.use("/files/processed/preview", express.static(storagePaths.processedPreview));
app.use("/files/processed/full", express.static(storagePaths.processedFull));
app.use(config.app.apiBase, createApiRouter());

app.get("/", (_req, res) => {
  res.json({
    service: "Mirror AI backend",
    apiBase: config.app.apiBase,
    queueMode: getQueueMode(),
  });
});

const ingestionService = createIngestionService();

io.on("connection", (socket) => {
  logger.debug({ socketId: socket.id }, "Socket client connected");
  socket.emit("bootstrap", {
    images: listImages().map(toPublicImage),
    controls: getControls(),
    presets: getPresets(),
  });
  socket.on("disconnect", () => {
    logger.debug({ socketId: socket.id }, "Socket client disconnected");
  });
});

const start = async () => {
  await initStorage();
  await initStore();
  await initQueue(processImageJob);
  await ingestionService.start();

  server.listen(config.app.port, () => {
    logger.info(
      {
        port: config.app.port,
        api: `${config.app.apiBase}`,
        storageRoot: config.storage.root,
        queueMode: getQueueMode(),
      },
      "Mirror AI backend started",
    );
  });
};

const shutdown = async (signal) => {
  logger.info({ signal }, "Shutting down Mirror AI backend");
  await ingestionService.stop();
  await closeQueue();
  io.close();
  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Shutdown failed");
      process.exitCode = 1;
    }
    process.exit();
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((error) => {
  logger.error({ err: error }, "Fatal startup error");
  process.exit(1);
});
