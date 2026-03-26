import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { ProcessingJob } from '../types/models.js';
import { logger } from '../utils/logger.js';

export type JobHandler = (job: ProcessingJob) => Promise<void>;

export interface IJobQueue {
  start(handler: JobHandler): Promise<void>;
  enqueue(job: ProcessingJob): Promise<void>;
}

class InMemoryQueue implements IJobQueue {
  private handler?: JobHandler;
  private readonly queue: ProcessingJob[] = [];
  private running = false;

  async start(handler: JobHandler): Promise<void> {
    this.handler = handler;
    this.drain().catch((error) => logger.error({ error }, 'InMemory queue drain failed'));
  }

  async enqueue(job: ProcessingJob): Promise<void> {
    this.queue.push(job);
    await this.drain();
  }

  private async drain(): Promise<void> {
    if (this.running || !this.handler) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        if (!job) continue;
        await this.handler(job);
      }
    } finally {
      this.running = false;
    }
  }
}

class BullQueue implements IJobQueue {
  private queue: Queue<ProcessingJob>;
  private worker?: Worker<ProcessingJob>;

  constructor(private readonly redis: Redis) {
    this.queue = new Queue<ProcessingJob>('mirror-processing', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }

  async start(handler: JobHandler): Promise<void> {
    this.worker = new Worker<ProcessingJob>(
      'mirror-processing',
      async (job) => {
        await handler(job.data);
      },
      {
        connection: this.redis,
        concurrency: 2,
      },
    );

    this.worker.on('failed', (job, error) => {
      logger.error({ jobId: job?.id, error }, 'Bull job failed');
    });
  }

  async enqueue(job: ProcessingJob): Promise<void> {
    await this.queue.add('process-image', job);
  }
}

export const buildQueue = async (): Promise<IJobQueue> => {
  if (!env.REDIS_ENABLED) {
    logger.info('Redis queue disabled, using in-memory queue');
    return new InMemoryQueue();
  }

  try {
    const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    await redis.ping();
    logger.info('Connected to Redis queue');
    return new BullQueue(redis);
  } catch (error) {
    logger.warn({ error }, 'Redis unavailable, falling back to in-memory queue');
    return new InMemoryQueue();
  }
};
