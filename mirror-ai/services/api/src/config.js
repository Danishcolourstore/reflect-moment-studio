import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function num(name, fallback) {
  const value = process.env[name];
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  api: {
    host: process.env.MIRROR_API_HOST ?? "0.0.0.0",
    port: num("MIRROR_API_PORT", 4100),
    origin: process.env.MIRROR_API_ORIGIN ?? "http://localhost:5178",
    publicBaseUrl: process.env.MIRROR_PUBLIC_BASE_URL ?? "http://localhost:4100",
  },
  ftp: {
    host: process.env.MIRROR_FTP_HOST ?? "0.0.0.0",
    port: num("MIRROR_FTP_PORT", 2121),
    user: process.env.MIRROR_FTP_USER ?? "mirror",
    password: process.env.MIRROR_FTP_PASSWORD ?? "mirrorpass",
  },
  redis: {
    host: process.env.MIRROR_REDIS_HOST ?? "127.0.0.1",
    port: num("MIRROR_REDIS_PORT", 6379),
    password: process.env.MIRROR_REDIS_PASSWORD || undefined,
  },
  processing: {
    defaultPreset: process.env.MIRROR_DEFAULT_PRESET ?? "clean-natural",
    defaultRetouchIntensity: Number(process.env.MIRROR_DEFAULT_RETOUCH_INTENSITY ?? 0.3),
  },
};
