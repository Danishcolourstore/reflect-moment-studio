import path from "node:path";
import fs from "node:fs";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MIRROR_API_PORT: z.coerce.number().default(8787),
  MIRROR_WS_PATH: z.string().default("/ws"),
  MIRROR_PUBLIC_URL: z.string().default("http://localhost:8787"),
  MIRROR_CORS_ORIGIN: z.string().default("*"),
  MIRROR_FTP_PORT: z.coerce.number().default(2121),
  MIRROR_FTP_HOST: z.string().default("0.0.0.0"),
  MIRROR_FTP_USER: z.string().default("mirror"),
  MIRROR_FTP_PASS: z.string().default("mirror"),
  MIRROR_STORAGE_ROOT: z.string().default("./storage"),
  MIRROR_DB_PATH: z.string().default("./storage/mirror-db.json"),
  MIRROR_REDIS_HOST: z.string().default("127.0.0.1"),
  MIRROR_REDIS_PORT: z.coerce.number().default(6379),
  MIRROR_REDIS_PASSWORD: z.string().optional(),
  MIRROR_QUEUE_NAME: z.string().default("mirror-processing"),
  MIRROR_WORKER_CONCURRENCY: z.coerce.number().default(4),
});

const env = envSchema.parse(process.env);
const storageRoot = path.resolve(process.cwd(), env.MIRROR_STORAGE_ROOT);
const originalsDir = path.join(storageRoot, "originals");
const previewDir = path.join(storageRoot, "preview");
const fullDir = path.join(storageRoot, "processed");
const ftpHomeDir = path.join(storageRoot, "ftp-home");
const tmpUploadDir = path.join(storageRoot, "tmp-upload");
const dbPath = path.resolve(process.cwd(), env.MIRROR_DB_PATH);

for (const dir of [storageRoot, originalsDir, previewDir, fullDir, ftpHomeDir, tmpUploadDir, path.dirname(dbPath)]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const config = {
  ...env,
  storageRoot,
  originalsDir,
  previewDir,
  fullDir,
  ftpHomeDir,
  tmpUploadDir,
  dbPath,
};
