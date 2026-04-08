import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(8787),
  CORS_ORIGIN: z.string().default("*"),

  STORAGE_ROOT: z.string().default(path.resolve(process.cwd(), "storage")),
  PROCESS_CONCURRENCY: z.coerce.number().int().positive().max(16).default(2),

  FTP_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  FTP_HOST: z.string().default("0.0.0.0"),
  FTP_PORT: z.coerce.number().int().positive().default(2121),
  FTP_USER: z.string().default("mirror"),
  FTP_PASSWORD: z.string().default("mirror-pass"),

  PREVIEW_MAX_WIDTH: z.coerce.number().int().positive().default(1600),
  PREVIEW_QUALITY: z.coerce.number().int().min(1).max(100).default(82),
  FULL_QUALITY: z.coerce.number().int().min(1).max(100).default(92),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
