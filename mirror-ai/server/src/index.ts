import http from "node:http";
import { config } from "./config";
import { ensureStorage } from "./storage";
import { createHttpApp } from "./http";
import { createQueueController } from "./queue";
import { startPipelineWorker } from "./pipeline";
import { startFtpIngestion } from "./ftp";
import { attachWebsocket } from "./websocket";

async function bootstrap() {
  await ensureStorage();

  const queue = createQueueController();
  const pipeline = startPipelineWorker(queue);
  const ftpServer = await startFtpIngestion(queue);

  const app = createHttpApp(queue);
  const server = http.createServer(app);
  const io = attachWebsocket(server);

  server.listen(config.api.port, config.api.host, () => {
    console.log(`Mirror AI API: http://${config.api.host}:${config.api.port}`);
    console.log(`Mirror AI FTP: ftp://${config.ftp.host}:${config.ftp.port}`);
    console.log("Mirror AI realtime: Socket.IO enabled");
  });

  const shutdown = async () => {
    console.log("Shutting down Mirror AI...");
    await Promise.allSettled([ftpServer.stop(), pipeline.stop(), queue.close()]);
    io.removeAllListeners();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error("Mirror AI failed to start:", error);
  process.exit(1);
});
