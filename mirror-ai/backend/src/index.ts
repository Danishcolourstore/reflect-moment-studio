import http from 'node:http';
import cors from 'cors';
import express from 'express';
import pinoHttp from 'pino-http';
import { WebSocketServer } from 'ws';
import { env } from './config/env.js';
import { startFtpServer } from './ftp/ftpServer.js';
import { startIncomingWatcher } from './ftp/watcher.js';
import { buildRouter } from './api/router.js';
import { buildQueue } from './queue/jobQueue.js';
import { ProcessingService } from './services/processingService.js';
import { RealtimeHub } from './sockets/realtimeHub.js';
import { FileStorage } from './storage/fileStorage.js';
import { ImageStore } from './storage/imageStore.js';
import { logger } from './utils/logger.js';

const bootstrap = async (): Promise<void> => {
  const storage = new FileStorage();
  await storage.ensureStructure();

  const imageStore = new ImageStore(storage);
  await imageStore.initialize();

  const app = express();
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN }));
  app.use(express.json({ limit: '10mb' }));
  app.use(pinoHttp({ logger }));

  const server = http.createServer(app);
  const wsServer = new WebSocketServer({ server, path: env.WS_PATH });
  const realtime = new RealtimeHub(wsServer);

  const queue = await buildQueue();
  const processing = new ProcessingService(storage, imageStore, queue, realtime, {
    presetId: env.DEFAULT_PRESET_ID,
    retouchIntensity: env.DEFAULT_RETOUCH_INTENSITY,
  });

  await queue.start(async (job) => {
    await processing.processImage(job.imageId);
  });

  wsServer.on('connection', (socket) => {
    socket.send(
      JSON.stringify({
        type: 'system:welcome',
        payload: {
          message: 'Connected to Mirror AI realtime stream',
          imageCount: imageStore.list().length,
        },
        timestamp: new Date().toISOString(),
      }),
    );
  });

  app.use(buildRouter(imageStore, processing));

  startFtpServer(storage.root);

  startIncomingWatcher(storage.uploadsDir, async (filePath) => {
    await processing.ingestFromPath(filePath);
  });

  server.listen(env.API_PORT, () => {
    logger.info(`Mirror AI backend running at http://localhost:${env.API_PORT}`);
  });
};

bootstrap().catch((error) => {
  logger.error({ error }, 'Fatal startup error');
  process.exit(1);
});
