import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFloat = (value, fallback) => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const workspaceRoot = process.cwd();
const storageRoot = path.resolve(
  process.env.MIRROR_STORAGE_ROOT ?? path.join(workspaceRoot, "mirror-data"),
);

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiHost: process.env.MIRROR_API_HOST ?? "0.0.0.0",
  apiPort: toInt(process.env.MIRROR_API_PORT, 8787),
  wsPath: process.env.MIRROR_WS_PATH ?? "/ws",
  ftpHost: process.env.MIRROR_FTP_HOST ?? "0.0.0.0",
  ftpPort: toInt(process.env.MIRROR_FTP_PORT, 2121),
  ftpUsername: process.env.MIRROR_FTP_USERNAME ?? "mirror",
  ftpPassword: process.env.MIRROR_FTP_PASSWORD ?? "mirror_pass",
  redisUrl: process.env.MIRROR_REDIS_URL ?? "",
  processingConcurrency: Math.max(toInt(process.env.MIRROR_PROCESSING_CONCURRENCY, 2), 1),
  previewQuality: Math.min(Math.max(toInt(process.env.MIRROR_PREVIEW_QUALITY, 74), 45), 95),
  fullQuality: Math.min(Math.max(toInt(process.env.MIRROR_FULL_QUALITY, 90), 55), 100),
  watchDebounceMs: Math.max(toInt(process.env.MIRROR_WATCH_DEBOUNCE_MS, 900), 250),
  defaultRetouchIntensity: Math.min(
    Math.max(toFloat(process.env.MIRROR_DEFAULT_RETOUCH_INTENSITY, 0.22), 0),
    1,
  ),
  storageRoot,
  dbPath: path.join(storageRoot, "mirror.db"),
  ftpIncomingDir: path.join(storageRoot, "ftp-incoming"),
  ftpArchiveDir: path.join(storageRoot, "ftp-archive"),
  originalsDir: path.join(storageRoot, "originals"),
  previewsDir: path.join(storageRoot, "previews"),
  processedDir: path.join(storageRoot, "processed"),
  metadataDir: path.join(storageRoot, "metadata"),
};
