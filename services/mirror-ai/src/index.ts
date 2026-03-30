import http from "node:http";
import { createMirrorApi } from "./http.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { attachRealtime, broadcastControlUpdate, broadcastImageUpdate } from "./realtime.js";
import { startFtpIngestionServer } from "./ftp/server.js";
import { mirrorEvents } from "./events.js";
import { mirrorDb } from "./db.js";
import { queueEvents } from "./queue.js";
import { getRedisConnection } from "./queue.js";

async function start(): Promise<void> {
  const app = createMirrorApi();
  const server = http.createServer(app);

  attachRealtime(server, config.MIRROR_WS_PATH);

  mirrorEvents.on("image.updated", (image) => {
    broadcastImageUpdate(image);
  });
  mirrorEvents.on("control.updated", (control) => {
    broadcastControlUpdate(control);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, "Processing job failed");
  });

  await startFtpIngestionServer();

  server.listen(config.MIRROR_API_PORT, () => {
    logger.info(
      {
        apiPort: config.MIRROR_API_PORT,
        wsPath: config.MIRROR_WS_PATH,
        ftpPort: config.MIRROR_FTP_PORT,
      },
      "Mirror AI backend started",
    );
  });

  // Push initial state to newly connected clients on boot via app polling fallback.
  broadcastControlUpdate(mirrorDb.getControl());
}

start().catch((error) => {
  logger.error({ err: error }, "Mirror AI backend failed to start");
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    logger.info({ signal }, "Shutting down Mirror AI backend");
    try {
      await queueEvents.close();
      await getRedisConnection().quit();
    } catch (error) {
      logger.error({ err: error }, "Error during backend shutdown");
    } finally {
      process.exit(0);
    }
  });
}
