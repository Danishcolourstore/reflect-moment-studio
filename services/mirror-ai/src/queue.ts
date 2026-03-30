import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config.js";
import type { ProcessJobPayload } from "./types/models.js";

const redisConnection = new IORedis({
  host: config.MIRROR_REDIS_HOST,
  port: config.MIRROR_REDIS_PORT,
  password: config.MIRROR_REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

export const processingQueue = new Queue<ProcessJobPayload>(config.MIRROR_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 1000,
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const queueEvents = new QueueEvents(config.MIRROR_QUEUE_NAME, {
  connection: redisConnection.duplicate(),
});

export function getRedisConnection(): IORedis {
  return redisConnection;
}
