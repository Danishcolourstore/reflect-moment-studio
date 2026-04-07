import { Queue } from "bullmq";
import { config } from "../config.js";
import { redisConnection } from "./connection.js";

export const imageQueue = new Queue(config.queue.name, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});
