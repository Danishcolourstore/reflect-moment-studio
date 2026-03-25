import http from "node:http";
import path from "node:path";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import { ensureStorage, pathToPublicUrl } from "./storage.js";
import { PresetService } from "./presets.js";
import { MetadataService } from "./metadata.js";
import { createRepository } from "./repository.js";
import { ProcessorService } from "./processor.js";
import { ProcessingQueue } from "./queue.js";
import { startFtpIngestion } from "./ftp.js";
import { createApi } from "./api.js";
import { setupWebSocket } from "./websocket.js";
import { EventBus } from "./eventBus.js";

async function bootstrap() {
  const config = loadConfig();
  const storage = await ensureStorage(config.storageRoot);
  const presets = new PresetService(config.defaultPreset, config.defaultRetouchIntensity);
  const metadata = new MetadataService(path.join(storage.metaDir, "images.json"), presets);
  await metadata.load();

  const bus = new EventBus();
  const repository = createRepository(storage, metadata, presets, config.publicBaseUrl);
  const processor = new ProcessorService(storage, metadata, bus, (row) => ({
    ...row,
    originalUrl: `${config.publicBaseUrl}/files/${row.originalRelPath.replace(/\\/g, "/")}`,
    previewUrl: row.previewRelPath
      ? `${config.publicBaseUrl}/files/${row.previewRelPath.replace(/\\/g, "/")}`
      : undefined,
    processedUrl: row.processedRelPath
      ? `${config.publicBaseUrl}/files/${row.processedRelPath.replace(/\\/g, "/")}`
      : undefined,
  }));
  const queue = new ProcessingQueue(config.queueConcurrency, processor);

  processor.setQueue(queue);
  await startFtpIngestion(config, storage, metadata, queue, bus);

  const app = createApi(config, repository, metadata, presets, queue, bus);
  const server = http.createServer(app);
  setupWebSocket(server, bus, repository);

  server.listen(config.port, () => {
    logger.info(`Mirror AI backend running on :${config.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Fatal startup error", error);
  process.exit(1);
});
