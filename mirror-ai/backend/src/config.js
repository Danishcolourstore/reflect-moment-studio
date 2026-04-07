import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value, fallback) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const resolveStorageRoot = () =>
  path.resolve(process.cwd(), process.env.STORAGE_ROOT ?? "./storage");

export const config = {
  app: {
    env: process.env.NODE_ENV ?? "development",
    port: parseNumber(process.env.PORT, 4000),
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    apiBase: process.env.API_BASE ?? "/api",
  },
  ftp: {
    enabled: process.env.FTP_ENABLED !== "false",
    host: process.env.FTP_HOST ?? "0.0.0.0",
    port: parseNumber(process.env.FTP_PORT, 2121),
    user: process.env.FTP_USER ?? "mirror",
    password: process.env.FTP_PASSWORD ?? "mirror",
    rootDir: process.env.FTP_ROOT_DIR ?? "/",
    passthroughHost: process.env.FTP_PASV_URL ?? "127.0.0.1",
    passivePortStart: parseNumber(process.env.FTP_PASV_PORT_START, 2222),
    passivePortEnd: parseNumber(process.env.FTP_PASV_PORT_END, 2230),
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  },
  queue: {
    name: process.env.QUEUE_NAME ?? "mirror-ai-images",
    concurrency: parseNumber(process.env.WORKER_CONCURRENCY, 2),
  },
  processor: {
    previewWidth: parseNumber(process.env.PREVIEW_WIDTH, 1600),
    jpegQualityPreview: parseNumber(process.env.PREVIEW_JPEG_QUALITY, 84),
    jpegQualityFull: parseNumber(process.env.FULL_JPEG_QUALITY, 92),
  },
  storage: {
    root: resolveStorageRoot(),
  },
};
