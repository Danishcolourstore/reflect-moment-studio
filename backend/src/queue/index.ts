import { env } from "../config.js";
import { MemoryQueue } from "./memoryQueue.js";
import { createRedisQueue } from "./redisQueue.js";
import type { QueueDriver } from "./types.js";

export const createQueue = (): QueueDriver => {
  const wantsRedis = env.QUEUE_DRIVER === "redis" || env.QUEUE_DRIVER === "auto";
  if (wantsRedis) {
    try {
      return createRedisQueue(env.REDIS_URL, env.PROCESS_CONCURRENCY);
    } catch (error) {
      if (env.QUEUE_DRIVER === "redis") throw error;
      return new MemoryQueue(env.PROCESS_CONCURRENCY);
    }
  }
  return new MemoryQueue(env.PROCESS_CONCURRENCY);
};
