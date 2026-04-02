import { Queue } from "bullmq";
import type { QueueJobPayload } from "../types/domain.js";
import { redisConnection } from "./connection.js";
import { imageQueueName } from "./connection.js";

const imageQueue = new Queue<QueueJobPayload>(imageQueueName, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 250,
    removeOnFail: 500,
    backoff: {
      type: "exponential",
      delay: 350,
    },
  },
});

export async function enqueueImageJob(payload: QueueJobPayload): Promise<void> {
  await imageQueue.add(`img-${payload.imageId}`, payload, {
    priority: 2,
  });
}
