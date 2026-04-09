import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  MIRROR_API_HOST: z.string().default("0.0.0.0"),
  MIRROR_API_PORT: z.coerce.number().int().positive().default(8787),
  MIRROR_WS_CORS_ORIGIN: z.string().default("*"),
  MIRROR_FTP_HOST: z.string().default("0.0.0.0"),
  MIRROR_FTP_PORT: z.coerce.number().int().positive().default(2121),
  MIRROR_FTP_USER: z.string().default("mirror"),
  MIRROR_FTP_PASS: z.string().default("mirrorpass"),
  MIRROR_STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), "mirror-ai/storage")),
  MIRROR_REDIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid Mirror AI environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  api: {
    host: env.MIRROR_API_HOST,
    port: env.MIRROR_API_PORT,
    corsOrigin: env.MIRROR_WS_CORS_ORIGIN,
  },
  ftp: {
    host: env.MIRROR_FTP_HOST,
    port: env.MIRROR_FTP_PORT,
    user: env.MIRROR_FTP_USER,
    pass: env.MIRROR_FTP_PASS,
  },
  storage: {
    root: env.MIRROR_STORAGE_ROOT,
    incoming: path.join(env.MIRROR_STORAGE_ROOT, "incoming"),
    originals: path.join(env.MIRROR_STORAGE_ROOT, "originals"),
    previews: path.join(env.MIRROR_STORAGE_ROOT, "previews"),
    processed: path.join(env.MIRROR_STORAGE_ROOT, "processed"),
    metadataFile: path.join(env.MIRROR_STORAGE_ROOT, "metadata.json"),
  },
  redisUrl: env.MIRROR_REDIS_URL,
};

export type MirrorConfig = typeof config;
