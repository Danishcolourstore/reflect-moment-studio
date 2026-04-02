import { Redis } from "ioredis";
import { env } from "../config/env.js";

export const imageQueueName = "mirror-ai-processing";

export const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

