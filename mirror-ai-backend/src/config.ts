import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";
import type { MirrorPresetId } from "./types.js";

loadEnv();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:8787"),
  STORAGE_ROOT: z.string().default("./storage"),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().max(16).default(2),
  WATCH_DEBOUNCE_MS: z.coerce.number().int().min(50).max(5000).default(200),
  FTP_URL: z.string().default("ftp://0.0.0.0:2121"),
  FTP_HOST: z.string().default("0.0.0.0"),
  FTP_PORT: z.coerce.number().int().positive().default(2121),
  FTP_USERNAME: z.string().min(1).default("mirror"),
  FTP_PASSWORD: z.string().min(1).default("mirror"),
  DEFAULT_PRESET: z
    .enum(["balanced", "bright-clean", "moody-cinematic", "skin-first"])
    .default("balanced"),
  DEFAULT_RETOUCH_INTENSITY: z.coerce.number().min(0).max(1).default(0.2),
});

export interface AppConfig {
  env: "development" | "test" | "production";
  port: number;
  corsOrigin: string;
  publicBaseUrl: string;
  queueConcurrency: number;
  watchDebounceMs: number;
  ftp: {
    url: string;
    host: string;
    port: number;
    username: string;
    password: string;
  };
  defaultPreset: MirrorPresetId;
  defaultRetouchIntensity: number;
  storageRoot: string;
}

export function loadConfig(): AppConfig {
  const env = schema.parse(process.env);
  return {
    env: env.NODE_ENV,
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    publicBaseUrl: env.PUBLIC_BASE_URL.replace(/\/$/, ""),
    queueConcurrency: env.QUEUE_CONCURRENCY,
    watchDebounceMs: env.WATCH_DEBOUNCE_MS,
    ftp: {
      url: env.FTP_URL,
      host: env.FTP_HOST,
      port: env.FTP_PORT,
      username: env.FTP_USERNAME,
      password: env.FTP_PASSWORD,
    },
    defaultPreset: env.DEFAULT_PRESET,
    defaultRetouchIntensity: env.DEFAULT_RETOUCH_INTENSITY,
    storageRoot: path.resolve(process.cwd(), env.STORAGE_ROOT),
  };
}
