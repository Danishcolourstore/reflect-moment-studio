import { pipelineEvents } from "./realtime/events.js";
import { createAppContext } from "./app-context.js";
import { createHttpServer } from "./api/http-server.js";
import { env, ensureRuntimeDirs } from "./config/env.js";
import { ingestExistingIncoming, startIncomingWatcher } from "./ingest/watcher.js";
import { createFtpServer } from "./ingest/ftp-server.js";
import { logger } from "./lib/logger.js";
import { closeQueueResources } from "./queue/processing-queue.js";
import { WsHub } from "./realtime/ws-hub.js";
import { createProcessingWorker } from "./worker-runner.js";

const start = async (): Promise<void> => {
  ensureRuntimeDirs();

  const context = createAppContext();
  const { server } = createHttpServer(context);
  const wsHub = new WsHub(server, async (client) => {
    const snapshot = await context.mirrorService.getSnapshot();
    client.send(
      JSON.stringify({
        type: "snapshot",
        payload: snapshot,
        timestamp: new Date().toISOString(),
      }),
    );
  });

  const pipelineListener = (event: unknown) => {
    wsHub.broadcast(event as never);
  };
  pipelineEvents.on("event", pipelineListener);

  const watcher = startIncomingWatcher(context.mirrorService);
  const initiallyIngested = await ingestExistingIncoming(context.mirrorService);
  const ftpServer = createFtpServer();
  const worker = env.MIRROR_AI_RUN_EMBEDDED_WORKER
    ? createProcessingWorker(context.mirrorService)
    : undefined;

  await new Promise<void>((resolve) => {
    server.listen(env.MIRROR_AI_API_PORT, env.MIRROR_AI_HOST, () => resolve());
  });

  await ftpServer.listen();

  logger.info(
    {
      api: `http://${env.MIRROR_AI_HOST}:${env.MIRROR_AI_API_PORT}`,
      ws: env.MIRROR_AI_WS_PUBLIC_URL ?? `ws://${env.MIRROR_AI_HOST}:${env.MIRROR_AI_API_PORT}/ws`,
      ftp: `ftp://${env.MIRROR_AI_HOST}:${env.MIRROR_AI_FTP_PORT}`,
      embeddedWorker: Boolean(worker),
      initiallyIngested,
    },
    "Mirror AI services online",
  );

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down Mirror AI services");
    pipelineEvents.off("event", pipelineListener);

    await watcher.close();
    await ftpServer.close();
    await wsHub.close().catch(() => undefined);
    if (worker) {
      await worker.close().catch(() => undefined);
    }

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await closeQueueResources().catch(() => undefined);
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
};

start().catch((error) => {
  logger.error({ error }, "Mirror AI failed to start");
  process.exit(1);
});
