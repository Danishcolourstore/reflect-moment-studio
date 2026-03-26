import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(8080),
  WS_PATH: z.string().default('/ws'),
  STORAGE_ROOT: z.string().default('./storage'),
  FTP_PORT: z.coerce.number().default(2121),
  FTP_HOST: z.string().default('0.0.0.0'),
  FTP_USER: z.string().default('mirror'),
  FTP_PASSWORD: z.string().default('mirror123'),
  FTP_PASV_URL: z.string().default('127.0.0.1'),
  FTP_PASV_MIN: z.coerce.number().default(2100),
  FTP_PASV_MAX: z.coerce.number().default(2110),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  REDIS_ENABLED: z.string().default('false'),
  CORS_ORIGIN: z.string().default('*'),
  DEFAULT_PRESET_ID: z.string().default('mirror-natural'),
  DEFAULT_RETOUCH_INTENSITY: z.coerce.number().min(0).max(100).default(25),
  PREVIEW_MAX_WIDTH: z.coerce.number().default(1440),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = {
  ...parsed.data,
  REDIS_ENABLED: parsed.data.REDIS_ENABLED === 'true',
};
