import { createRequire } from "node:module";
import { Queue } from "bullmq";
import { env } from "../config/env.js";
import type { ProcessingJobData } from "../types.js";

export const PROCESSING_QUEUE_NAME = "mirror-ai-image-processing";

const require = createRequire(import.meta.url);
const RedisCtor = require("ioredis") as new (...args: unknown[]) => {
  quit: () => Promise<unknown>;
};

const redis = new RedisCtor(env.MIRROR_AI_REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: false,
}) as any;

const queue = new Queue<any, any, string>(PROCESSING_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 300,
    },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

export const enqueueProcessingJob = async (job: ProcessingJobData): Promise<void> => {
  await queue.add("process-image", job, {
    jobId: job.imageId,
  });
};

export const getRedisConnection = (): any => redis;

export const createWorkerRedisConnection = (): any =>
  new RedisCtor(env.MIRROR_AI_REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: false,
  });

export const getProcessingQueue = (): Queue<any, any, string> => queue;

export const closeQueueResources = async (): Promise<void> => {
  await queue.close();
  await redis.quit();
};
