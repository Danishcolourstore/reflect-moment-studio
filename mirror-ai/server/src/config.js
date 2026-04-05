import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultStorageRoot = path.resolve(__dirname, "..", "storage");

export const config = {
  app: {
    host: process.env.MIRRORAI_HOST || "0.0.0.0",
    port: Number(process.env.MIRRORAI_PORT || 8787),
    logLevel: process.env.MIRRORAI_LOG_LEVEL || "info",
  },
  queue: {
    name: process.env.MIRRORAI_QUEUE_NAME || "mirror-ai-processing",
  },
  ftp: {
    host: process.env.MIRRORAI_FTP_HOST || "0.0.0.0",
    port: Number(process.env.MIRRORAI_FTP_PORT || 2121),
    username: process.env.MIRRORAI_FTP_USERNAME || "mirrorai",
    password: process.env.MIRRORAI_FTP_PASSWORD || "mirrorai-pass",
    passiveMinPort: Number(process.env.MIRRORAI_FTP_PASSIVE_MIN || 40000),
    passiveMaxPort: Number(process.env.MIRRORAI_FTP_PASSIVE_MAX || 40100),
    publicIp: process.env.MIRRORAI_FTP_PUBLIC_IP || "127.0.0.1",
  },
  redis: {
    url: process.env.MIRRORAI_REDIS_URL || "",
  },
  cors: {
    origin: process.env.MIRRORAI_CORS_ORIGIN || "*",
  },
  storage: {
    root: process.env.MIRRORAI_STORAGE_ROOT || defaultStorageRoot,
  },
  processing: {
    previewMaxWidth: Number(process.env.MIRRORAI_PREVIEW_MAX_WIDTH || 1600),
    previewQuality: Number(process.env.MIRRORAI_PREVIEW_QUALITY || 78),
    outputQuality: Number(process.env.MIRRORAI_OUTPUT_QUALITY || 92),
    workerConcurrency: Number(process.env.MIRRORAI_WORKER_CONCURRENCY || 2),
    defaultPreset: process.env.MIRRORAI_DEFAULT_PRESET || "editorial-balanced",
    defaultCategory: process.env.MIRRORAI_DEFAULT_CATEGORY || "portrait",
    defaultRetouchIntensity: Number(process.env.MIRRORAI_DEFAULT_RETOUCH || 0.45),
  },
};

export const storagePaths = {
  incoming: path.join(config.storage.root, "incoming"),
  originals: path.join(config.storage.root, "originals"),
  previews: path.join(config.storage.root, "previews"),
  processed: path.join(config.storage.root, "processed"),
  metadata: path.join(config.storage.root, "metadata"),
  metadataFile: path.join(config.storage.root, "metadata", "images.json"),
};
