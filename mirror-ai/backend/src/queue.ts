import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import type { PipelineOptions } from "./types.js";
import { config } from "./config.js";
import { logger } from "./logger.js";

export interface ProcessingJobData {
  imageId: string;
  originalPath: string;
  filename: string;
  options: PipelineOptions;
}

type ProcessHandler = (data: ProcessingJobData) => Promise<void>;

interface QueueAdapter {
  enqueue(data: ProcessingJobData): Promise<void>;
  startWorker(handler: ProcessHandler): Promise<void>;
  close?(): Promise<void>;
}

class InMemoryQueue implements QueueAdapter {
  private readonly queue: ProcessingJobData[] = [];
  private working = false;

  async enqueue(data: ProcessingJobData) {
    this.queue.push(data);
    this.drain();
  }

  async startWorker(handler: ProcessHandler) {
    this.handler = handler;
    this.drain();
  }

  private handler: ProcessHandler | null = null;

  private async drain() {
    if (this.working || !this.handler) {
      return;
    }
    this.working = true;
    try {
      while (this.queue.length > 0 && this.handler) {
        const next = this.queue.shift();
        if (!next) {
          continue;
        }
        try {
          await this.handler(next);
        } catch (error) {
          logger.error({ err: error, imageId: next.imageId }, "in-memory job failed");
        }
      }
    } finally {
      this.working = false;
    }
  }
}

class RedisQueueAdapter implements QueueAdapter {
  private readonly queueName = "mirror-ai-processing";
  private readonly connection: Redis;
  private readonly queue: Queue<ProcessingJobData>;
  private worker: Worker<ProcessingJobData> | null = null;

  constructor(redisUrl: string) {
    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    this.queue = new Queue<ProcessingJobData>(this.queueName, {
      connection: this.connection,
    });
  }

  async enqueue(data: ProcessingJobData) {
    await this.queue.add("process", data, {
      removeOnComplete: 1000,
      removeOnFail: 1000,
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 500,
      },
    });
  }

  async startWorker(handler: ProcessHandler) {
    this.worker = new Worker<ProcessingJobData>(
      this.queueName,
      async (job) => {
        await handler(job.data);
      },
      {
        connection: this.connection,
        concurrency: 2,
      },
    );
    this.worker.on("failed", (job, error) => {
      logger.error({ err: error, jobId: job?.id }, "redis processing job failed");
    });
  }

  async close() {
    await this.worker?.close();
    await this.queue.close();
    await this.connection.quit();
  }
}

function createQueueAdapter(): QueueAdapter {
  if (config.REDIS_URL) {
    try {
      logger.info("using redis queue adapter");
      return new RedisQueueAdapter(config.REDIS_URL);
    } catch (error) {
      logger.warn({ err: error }, "failed to initialize redis queue, falling back to in-memory");
    }
  }
  logger.warn("using in-memory queue adapter");
  return new InMemoryQueue();
}

export const processingQueue = createQueueAdapter();
