import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";
import { presets } from "../processing/presets.js";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  MIRROR_AI_HOST: z.string().default("0.0.0.0"),
  MIRROR_AI_API_PORT: z.coerce.number().default(8787),
  MIRROR_AI_WS_PORT: z.coerce.number().default(8788),
  MIRROR_AI_WS_PUBLIC_URL: z.string().optional(),
  MIRROR_AI_FTP_PORT: z.coerce.number().default(2121),
  MIRROR_AI_FTP_USER: z.string().default("mirror"),
  MIRROR_AI_FTP_PASSWORD: z.string().default("mirrorpass"),
  MIRROR_AI_FTP_PASV_URL: z.string().optional(),
  MIRROR_AI_STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), "storage")),
  MIRROR_AI_DATA_FILE: z.string().default(path.resolve(process.cwd(), "data", "metadata.json")),
  MIRROR_AI_REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  MIRROR_AI_ALLOWED_ORIGINS: z.string().default("http://localhost:8080"),
  MIRROR_AI_DEFAULT_PRESET: z.enum(presets.map((preset) => preset.id) as [string, ...string[]]).default("editorial"),
  MIRROR_AI_DEFAULT_RETOUCH: z.coerce.number().min(0).max(100).default(35),
  MIRROR_AI_DEFAULT_CATEGORY: z.string().default("general"),
  MIRROR_AI_WORKER_CONCURRENCY: z.coerce.number().min(1).max(16).default(2),
  MIRROR_AI_RUN_EMBEDDED_WORKER: z
    .preprocess((value) => {
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["false", "0", "no", "off"].includes(normalized)) return false;
        if (["true", "1", "yes", "on"].includes(normalized)) return true;
      }
      return value;
    }, z.boolean())
    .default(true),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment:\n${parsed.error.message}`);
}

export const env = parsed.data;

export const dirs = {
  root: env.MIRROR_AI_STORAGE_ROOT,
  incoming: path.join(env.MIRROR_AI_STORAGE_ROOT, "incoming"),
  originals: path.join(env.MIRROR_AI_STORAGE_ROOT, "originals"),
  previews: path.join(env.MIRROR_AI_STORAGE_ROOT, "processed", "previews"),
  full: path.join(env.MIRROR_AI_STORAGE_ROOT, "processed", "full"),
  thumbnails: path.join(env.MIRROR_AI_STORAGE_ROOT, "thumbnails"),
  failed: path.join(env.MIRROR_AI_STORAGE_ROOT, "failed"),
  dataDir: path.dirname(env.MIRROR_AI_DATA_FILE),
};

export const ensureRuntimeDirs = (): void => {
  for (const dirPath of Object.values(dirs)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
