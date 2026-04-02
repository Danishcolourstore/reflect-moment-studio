import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("*"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:4000"),
  STORAGE_ROOT: z.string().default("./storage"),

  FTP_PORT: z.coerce.number().default(2121),
  FTP_USER: z.string().default("mirror"),
  FTP_PASS: z.string().default("mirror123"),
  FTP_PASV_URL: z.string().optional(),
  FTP_PASV_MIN: z.coerce.number().default(1025),
  FTP_PASV_MAX: z.coerce.number().default(1050),

  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_PASSWORD: z.string().optional(),

  QUEUE_CONCURRENCY: z.coerce.number().default(2),
  WATCH_STABILITY_MS: z.coerce.number().default(800),
  MAX_UPLOAD_MB: z.coerce.number().default(32),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = parsed.data;
