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
