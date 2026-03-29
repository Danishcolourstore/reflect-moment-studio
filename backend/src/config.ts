import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:8080"),
  FTP_PORT: z.coerce.number().int().positive().default(2121),
  FTP_HOST: z.string().default("0.0.0.0"),
  FTP_USER: z.string().default("mirror"),
  FTP_PASSWORD: z.string().default("mirror123"),
  STORAGE_ROOT: z.string().default("storage"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  QUEUE_DRIVER: z.enum(["auto", "redis", "memory"]).default("auto"),
  PREVIEW_MAX_WIDTH: z.coerce.number().int().positive().default(1800),
  JPEG_QUALITY: z.coerce.number().int().min(1).max(100).default(90),
  PROCESS_CONCURRENCY: z.coerce.number().int().positive().max(16).default(2),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${formatted}`);
}

export const env = parsed.data;

const root = path.resolve(process.cwd(), env.STORAGE_ROOT);

export const storagePaths = {
  root,
  originals: path.join(root, "originals"),
  processed: path.join(root, "processed"),
  previews: path.join(root, "previews"),
  uploads: path.join(root, "ftp-incoming"),
  metadata: path.join(root, "metadata"),
  metadataFile: path.join(root, "metadata", "db.json"),
};
