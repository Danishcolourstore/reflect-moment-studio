import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { QueuePayload, QueueStats } from "../types";
import { env } from "../config/env";
import { IMAGE_PROCESSING_QUEUE } from "./queueNames";
import { logger } from "../utils/logger";

const redisEnabled = Boolean(env.REDIS_URL);
const redis = redisEnabled
  ? new IORedis(env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : null;

const queue = redisEnabled && redis ? new Queue<QueuePayload>(IMAGE_PROCESSING_QUEUE, { connection: redis }) : null;

const inMemoryQueue: QueuePayload[] = [];
let processor: ((payload: QueuePayload) => Promise<void>) | null = null;
let draining = false;
let active = 0;
let completed = 0;
let failed = 0;

async function drainMemoryQueue(): Promise<void> {
  if (!processor || draining) {
    return;
  }
  draining = true;
  while (inMemoryQueue.length > 0) {
    const payload = inMemoryQueue.shift()!;
    active += 1;
    try {
      await processor(payload);
      completed += 1;
    } catch (error) {
      failed += 1;
      logger.error({ error, imageId: payload.imageId }, "In-memory processing failed");
    } finally {
      active = Math.max(0, active - 1);
    }
  }
  draining = false;
}

export const queueClient = {
  isRedisEnabled(): boolean {
    return redisEnabled;
  },

  registerProcessor(fn: (payload: QueuePayload) => Promise<void>): void {
    processor = fn;
    void drainMemoryQueue();
  },

  async add(payload: QueuePayload): Promise<void> {
    if (queue) {
      await queue.add("process-image", payload, {
        attempts: 2,
        removeOnComplete: 250,
        removeOnFail: 250,
      });
      return;
    }
    inMemoryQueue.push(payload);
    void drainMemoryQueue();
  },

  async stats(): Promise<QueueStats> {
    if (queue) {
      const [waiting, qActive, qCompleted, qFailed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
      ]);
      return {
        waiting,
        active: qActive,
        completed: qCompleted,
        failed: qFailed,
      };
    }
    return {
      waiting: inMemoryQueue.length,
      active,
      completed,
      failed,
    };
  },

  getConnection(): IORedis | null {
    return redis;
  },

  async close(): Promise<void> {
    if (queue) {
      await queue.close();
    }
    if (redis) {
      await redis.quit();
    }
  },
};
