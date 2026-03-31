import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  FTP_PORT: z.coerce.number().int().positive().default(2121),
  FTP_USER: z.string().min(1).default("mirror"),
  FTP_PASS: z.string().min(1).default("mirror123"),
  FTP_HOST: z.string().min(1).default("0.0.0.0"),
  STORAGE_ROOT: z.string().min(1).default("./storage"),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default("*"),
  DEFAULT_PRESET: z
    .enum(["mirror-clean", "golden-hour", "cinematic", "editorial", "natural-pop"])
    .default("mirror-clean"),
  DEFAULT_RETOUCH_INTENSITY: z.coerce.number().min(0).max(1).default(0.35),
  DEFAULT_CATEGORY: z
    .enum(["portrait", "wedding", "studio", "fashion", "event", "product"])
    .default("portrait"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.message}`);
}

const baseStorage = path.resolve(process.cwd(), parsed.data.STORAGE_ROOT);

export const config = {
  ...parsed.data,
  paths: {
    storageRoot: baseStorage,
    incoming: path.join(baseStorage, "incoming"),
    originals: path.join(baseStorage, "originals"),
    preview: path.join(baseStorage, "preview"),
    processed: path.join(baseStorage, "processed"),
    metadata: path.join(baseStorage, "metadata"),
  },
};
