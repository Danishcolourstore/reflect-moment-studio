import { ensureRuntimeDirs } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { closeQueueResources } from "./queue/processing-queue.js";
import { createAppContext } from "./app-context.js";
import { createProcessingWorker } from "./worker-runner.js";

const start = async (): Promise<void> => {
  ensureRuntimeDirs();
  const context = createAppContext();
  const worker = createProcessingWorker(context.mirrorService);

  logger.info("Mirror AI dedicated worker online");

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down Mirror AI worker");
    await worker.close().catch(() => undefined);
    await closeQueueResources().catch(() => undefined);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
};

start().catch((error) => {
  logger.error({ error }, "Mirror AI worker failed to start");
  process.exit(1);
});
