import { env } from "./config.js";
import { db } from "./database.js";
import { createApiServer } from "./api.js";
import { createWebsocketServer } from "./ws.js";
import { createQueue } from "./queue/index.js";
import { processImageWithTask } from "./processor.js";
import { ensureStorageLayout } from "./storage.js";
import { bus } from "./events.js";
import { MirrorFtpIngestion } from "./ftp.js";

async function bootstrap() {
  await ensureStorageLayout();
  await db.ready();

  const queue = createQueue();
  const api = createApiServer(bus, (task) => queue.enqueue(task));
  const ws = createWebsocketServer(api.server, bus);
  const ftp = new MirrorFtpIngestion(queue);

  await queue.start(async (task) => {
    await processImageWithTask(task);
  });

  await ftp.start();

  console.log(`Mirror AI API listening on http://localhost:${env.API_PORT}`);
  console.log(`Mirror AI FTP listening on ftp://${env.FTP_HOST}:${env.FTP_PORT}`);
  console.log(`Mirror AI queue driver: ${queue.kind}`);

  const shutdown = async () => {
    console.log("Shutting down Mirror AI services...");
    await ftp.close().catch(() => undefined);
    await queue.close().catch(() => undefined);
    await ws.close().catch(() => undefined);
    await api.close().catch(() => undefined);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap Mirror AI:", error);
  process.exit(1);
});
