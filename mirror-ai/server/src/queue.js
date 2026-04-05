import { EventEmitter } from "node:events";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { sleep } from "./utils.js";

const JOB_NAME = "mirror-ai-process-image";

class MemoryQueue {
  constructor({ processor, concurrency, logger }) {
    this.processor = processor;
    this.concurrency = Math.max(1, Number(concurrency) || 1);
    this.logger = logger;
    this.events = new EventEmitter();
    this.pending = [];
    this.running = 0;
    this.stopped = false;
  }

  add(data) {
    this.pending.push({ data, attempts: 0 });
    this.#pump();
  }

  on(event, handler) {
    this.events.on(event, handler);
  }

  getPendingCount() {
    return this.pending.length + this.running;
  }

  async close() {
    this.stopped = true;
  }

  #pump() {
    if (this.stopped) return;
    while (this.running < this.concurrency && this.pending.length > 0) {
      const next = this.pending.shift();
      this.running += 1;
      this.#run(next)
        .catch((error) => {
          this.logger.error("Memory queue run error", { error: String(error) });
        })
        .finally(() => {
          this.running -= 1;
          this.#pump();
        });
    }
  }

  async #run(job) {
    const maxRetries = 2;
    const attempt = job.attempts + 1;
    this.events.emit("active", { data: job.data, attempt });
    try {
      const result = await this.processor(job.data);
      this.events.emit("completed", { data: job.data, result, attempt });
    } catch (error) {
      if (job.attempts < maxRetries) {
        this.logger.warn("Retrying memory queue job", {
          imageId: job.data?.imageId,
          attempt,
          error: String(error),
        });
        job.attempts += 1;
        await sleep(250 * attempt);
        this.pending.push(job);
      } else {
        this.events.emit("failed", { data: job.data, error, attempt });
      }
    }
  }
}

export async function createQueueSystem({ redisUrl, queueName, logger, concurrency, onJob }) {
  if (!redisUrl) {
    logger.warn("MIRRORAI_REDIS_URL missing, using in-memory queue");
    const mem = new MemoryQueue({ processor: onJob, concurrency, logger });
    return {
      mode: "memory",
      addJob: async (payload) => mem.add(payload),
      add: async (payload) => mem.add(payload),
      on: (event, handler) => mem.on(event, handler),
      pendingCount: async () => mem.getPendingCount(),
      getPendingCount: async () => mem.getPendingCount(),
      close: async () => mem.close(),
    };
  }

  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const queue = new Queue(queueName, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 500 },
      removeOnComplete: 300,
      removeOnFail: 500,
    },
  });

  const worker = new Worker(
    queueName,
    async (job) => onJob(job.data),
    {
      connection: redis,
      concurrency: Math.max(1, Number(concurrency) || 1),
    },
  );

  worker.on("failed", (job, error) => {
    logger.error("Queue job failed", {
      imageId: job?.data?.imageId,
      error: String(error),
    });
  });

  return {
    mode: "bullmq",
    addJob: async (payload) => {
      await queue.add(JOB_NAME, payload);
    },
    add: async (payload) => {
      await queue.add(JOB_NAME, payload);
    },
    on: (event, handler) => {
      if (event === "completed") {
        worker.on("completed", (job, result) => handler({ data: job.data, result }));
      }
      if (event === "active") {
        worker.on("active", (job) => handler({ data: job.data }));
      }
      if (event === "failed") {
        worker.on("failed", (job, error) => handler({ data: job?.data, error }));
      }
    },
    pendingCount: async () => {
      const [waiting, active, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getDelayedCount(),
      ]);
      return waiting + active + delayed;
    },
    getPendingCount: async () => {
      const [waiting, active, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getDelayedCount(),
      ]);
      return waiting + active + delayed;
    },
    close: async () => {
      await worker.close();
      await queue.close();
      await redis.quit();
    },
  };
}
