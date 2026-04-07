import Redis from "ioredis";
import { config } from "../config.js";

export const redisConnection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});
