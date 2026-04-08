import path from "node:path";
import http from "node:http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { env } from "./config/env.js";
import { ensureStorageDirs } from "./lib/storage.js";
import { imageRepository } from "./lib/repository.js";
import { createProcessingQueue } from "./lib/queue.js";
import { createMirrorRouter } from "./http/routes.js";
import { createInboxWatcher } from "./ingest/inbox-watcher.js";
import { createFtpServer } from "./ftp/ftp-server.js";
import { eventBus } from "./lib/event-bus.js";

async function main(): Promise<void> {
  const dirs = await ensureStorageDirs(env.STORAGE_ROOT);
  const app = express();
  const server = http.createServer(app);
  const ws = new WebSocketServer({ server, path: "/ws" });
  const queue = createProcessingQueue(dirs);

  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", createMirrorRouter(queue, dirs));
  app.use("/assets/originals", express.static(dirs.originals));
  app.use("/assets/inbox", express.static(dirs.inbox));
  app.use("/assets/previews", express.static(dirs.previews));
  app.use("/assets/processed", express.static(dirs.processed));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      pending: queue.size,
      processing: queue.pending,
      images: imageRepository.getAll().length,
    });
  });

  ws.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        type: "ready",
        payload: {
          images: imageRepository.getAll(),
          controls: imageRepository.getControls(),
        },
      }),
    );
  });

  const unsubscribe = eventBus.subscribe((event) => {
    const serialized = JSON.stringify(event);
    ws.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(serialized);
      }
    });
  });

  const watcher = await createInboxWatcher(dirs.inbox, queue);
  const ftp = env.FTP_ENABLED ? await createFtpServer(dirs.inbox) : null;

  server.listen(env.PORT, env.HOST, () => {
    console.log(`Mirror AI backend listening on http://${env.HOST}:${env.PORT}`);
    if (ftp) {
      console.log(`FTP enabled on ${env.FTP_HOST}:${env.FTP_PORT}`);
      console.log(`FTP inbox: ${path.resolve(dirs.inbox)}`);
    } else {
      console.log("FTP disabled");
    }
  });

  const shutdown = async () => {
    console.log("Shutting down Mirror AI services...");
    unsubscribe();
    await watcher.close();
    if (ftp) {
      await ftp.close();
    }
    ws.close();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
