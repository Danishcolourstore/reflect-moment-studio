import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config.js";

const redisConnection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

export const mirrorQueue = new Queue("mirror-ai-images", {
  connection: redisConnection,
});

export function buildRedisConnection() {
  return new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
  });
}

export async function enqueueImageJob(payload) {
  return mirrorQueue.add("process-image", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 250 },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  });
}

export async function closeQueue() {
  await mirrorQueue.close();
  await redisConnection.quit();
}
