import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..", "..");
const workspaceRoot = path.resolve(packageRoot, "..");

const packageEnvPath = path.join(packageRoot, ".env");
const workspaceEnvPath = path.join(workspaceRoot, ".env");

if (fs.existsSync(packageEnvPath)) {
  dotenv.config({ path: packageEnvPath });
} else if (fs.existsSync(workspaceEnvPath)) {
  dotenv.config({ path: workspaceEnvPath });
} else {
  dotenv.config();
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appPort: toInt(process.env.MIRROR_APP_PORT, 8787),
  wsPath: process.env.MIRROR_WS_PATH ?? "/ws",
  ftpPort: toInt(process.env.MIRROR_FTP_PORT, 2121),
  ftpHost: process.env.MIRROR_FTP_HOST ?? "0.0.0.0",
  ftpUser: process.env.MIRROR_FTP_USER ?? "mirrorai",
  ftpPassword: process.env.MIRROR_FTP_PASSWORD ?? "mirrorai123",
  storageRoot:
    process.env.MIRROR_STORAGE_ROOT ?? path.resolve(packageRoot, "data"),
  redisUrl: process.env.MIRROR_REDIS_URL ?? "redis://127.0.0.1:6379",
  queueName: process.env.MIRROR_QUEUE_NAME ?? "mirror-ai-image-jobs",
  processingConcurrency: toInt(process.env.MIRROR_PROCESSING_CONCURRENCY, 2),
  previewMaxWidth: toInt(process.env.MIRROR_PREVIEW_MAX_WIDTH, 1600),
};

