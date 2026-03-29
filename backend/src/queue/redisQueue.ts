import { Queue, Worker, type Job, type WorkerOptions } from "bullmq";
import type { QueueDriver, QueueTask } from "./types.js";

const QUEUE_NAME = "mirror-ai-process";

function makeConnection(redisUrl: string) {
  return { url: redisUrl, maxRetriesPerRequest: null };
}

export function createRedisQueue(redisUrl: string, concurrency = 2): QueueDriver {
  const queue = new Queue<QueueTask>(QUEUE_NAME, {
    connection: makeConnection(redisUrl),
  });

  let worker: Worker<QueueTask, void, string> | null = null;

  return {
    kind: "redis",
    enqueue: async (task) => {
      await queue.add("process", task, {
        removeOnComplete: 1000,
        removeOnFail: 1000,
      });
    },
    start: async (handler) => {
      const options: WorkerOptions = {
        connection: makeConnection(redisUrl),
        concurrency,
      };
      worker = new Worker<QueueTask>(
        QUEUE_NAME,
        async (job: Job<QueueTask>) => {
          await handler(job.data);
        },
        options,
      );
      worker.on("error", () => {
        // Keep process alive; task-level failures are reflected in image statuses.
      });
    },
    close: async () => {
      await worker?.close();
      await queue.close();
    },
  };
}
