import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  BASE_URL: z.string().url().default("http://localhost:8787"),
  CORS_ORIGIN: z.string().default("*"),
  REDIS_URL: z.string().optional(),
  FTP_HOST: z.string().default("0.0.0.0"),
  FTP_PORT: z.coerce.number().int().positive().default(2121),
  FTP_USER: z.string().default("mirrorai"),
  FTP_PASSWORD: z.string().default("mirrorai123"),
  STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), "storage")),
  PREVIEW_WIDTH: z.coerce.number().int().positive().default(1600),
  RETOUCH_DEFAULT_INTENSITY: z.coerce.number().min(0).max(1).default(0.18),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed");
}

const cfg = parsed.data;

export const env = {
  ...cfg,
  REDIS_ENABLED: Boolean(cfg.REDIS_URL),
  storageRoot: cfg.STORAGE_ROOT,
  storagePaths: {
    incoming: path.join(cfg.STORAGE_ROOT, "incoming"),
    originals: path.join(cfg.STORAGE_ROOT, "originals"),
    processedPreview: path.join(cfg.STORAGE_ROOT, "processed", "preview"),
    processedFull: path.join(cfg.STORAGE_ROOT, "processed", "full"),
    metadata: path.join(cfg.STORAGE_ROOT, "metadata"),
  },
};
