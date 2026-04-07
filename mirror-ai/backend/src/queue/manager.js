import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import { config } from "../config.js";
import { logger } from "../logger.js";

const withTimeout = async (promise, timeoutMs) => {
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error("Timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const createLocalQueue = (processor) => {
  const jobs = [];
  let running = false;
  let closed = false;

  const run = async () => {
    if (running || closed) {
      return;
    }
    const nextJob = jobs.shift();
    if (!nextJob) {
      return;
    }
    running = true;
    try {
      await processor(nextJob.data);
    } catch (error) {
      logger.error({ err: error, job: nextJob }, "Local queue job failed");
    } finally {
      running = false;
      setImmediate(run);
    }
  };

  return {
    mode: "memory",
    add: async (name, data) => {
      jobs.push({ name, data });
      setImmediate(run);
    },
    close: async () => {
      closed = true;
      jobs.length = 0;
    },
  };
};

const createBullMqQueue = async (processor) => {
  const probe = new Redis(config.redis.url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    connectTimeout: 1500,
  });
  // Prevent noisy unhandled events when Redis is unavailable.
  probe.on("error", () => {});

  try {
    await withTimeout(probe.connect(), 2000);
    await withTimeout(probe.ping(), 1000);
  } finally {
    probe.disconnect();
  }

  const connection = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy: () => null,
    connectTimeout: 1500,
  });
  // Avoid unhandled error event warnings from ioredis.
  connection.on("error", () => {});
  await withTimeout(connection.connect(), 2000);
  await withTimeout(connection.ping(), 1000);

  const queue = new Queue(config.queue.name, {
    connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 300,
      attempts: 2,
      backoff: {
        type: "fixed",
        delay: 500,
      },
    },
  });

  const worker = new Worker(
    config.queue.name,
    async (job) => {
      await processor(job.data);
    },
    {
      connection,
      concurrency: config.queue.concurrency,
    },
  );

  worker.on("failed", (job, error) => {
    logger.error(
      { err: error, jobId: job?.id, imageId: job?.data?.imageId },
      "Queue job failed",
    );
  });

  worker.on("completed", (job) => {
    logger.debug({ jobId: job.id, imageId: job?.data?.imageId }, "Queue job completed");
  });

  return {
    mode: "bullmq",
    add: async (name, data) => {
      await queue.add(name, data, {
        jobId: `${data.imageId}:${Date.now()}`,
      });
    },
    close: async () => {
      await worker.close();
      await queue.close();
      await connection.quit();
    },
  };
};

let queueAdapter = null;

export const initQueue = async (processor) => {
  if (queueAdapter) {
    return queueAdapter;
  }

  try {
    queueAdapter = await createBullMqQueue(processor);
    logger.info({ mode: queueAdapter.mode }, "Queue initialized");
  } catch (error) {
    logger.warn(
      { err: error },
      "Redis unavailable. Falling back to in-memory queue adapter",
    );
    queueAdapter = createLocalQueue(processor);
  }

  return queueAdapter;
};

export const enqueueImageProcessing = async (payload) => {
  if (!queueAdapter) {
    throw new Error("Queue adapter not initialized");
  }
  await queueAdapter.add("process-image", payload);
};

export const getQueueMode = () => queueAdapter?.mode ?? "uninitialized";

export const closeQueue = async () => {
  if (!queueAdapter) {
    return;
  }
  await queueAdapter.close();
  queueAdapter = null;
};
