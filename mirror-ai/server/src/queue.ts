import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";

type QueueJob = { imageId: string };
type JobWorker = (imageId: string) => Promise<void>;

const queueName = "mirror-ai-image-processing";

export interface QueueController {
  enqueue(imageId: string): Promise<void>;
  registerWorker(worker: JobWorker): void;
  close(): Promise<void>;
}

export function createQueueController(): QueueController {
  const redis = config.redisUrl ? new IORedis(config.redisUrl, { maxRetriesPerRequest: null }) : null;
  const queue = redis ? new Queue<QueueJob>(queueName, { connection: redis }) : null;
  let bullWorker: Worker<QueueJob> | null = null;
  let registeredWorker: JobWorker | null = null;
  let inMemoryChain: Promise<void> = Promise.resolve();

  if (!redis) {
    console.warn("[mirror-ai] Redis not configured. Falling back to in-memory queue.");
  }

  const ensureWorker = () => {
    if (!redis || !queue || !registeredWorker || bullWorker) {
      return;
    }
    bullWorker = new Worker<QueueJob>(
      queueName,
      async (job) => {
        if (!registeredWorker) {
          return;
        }
        await registeredWorker(job.data.imageId);
      },
      { connection: redis },
    );
  };

  return {
    async enqueue(imageId: string) {
      if (queue) {
        await queue.add("process-image", { imageId }, { removeOnComplete: 1000, removeOnFail: 1000 });
        return;
      }

      if (!registeredWorker) {
        throw new Error("Queue worker has not been registered.");
      }

      inMemoryChain = inMemoryChain.then(async () => {
        if (!registeredWorker) {
          return;
        }
        await registeredWorker(imageId);
      });
      await inMemoryChain;
    },

    registerWorker(worker: JobWorker) {
      registeredWorker = worker;
      ensureWorker();
    },

    async close() {
      await bullWorker?.close();
      await queue?.close();
      await redis?.quit();
    },
  };
}
