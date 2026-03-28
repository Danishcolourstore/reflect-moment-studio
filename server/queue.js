import { randomUUID } from "node:crypto";
import { config } from "./config.js";

const waiting = [];
let running = 0;
const concurrency = config.processingConcurrency;

function runNext() {
  if (running >= concurrency) return;
  const item = waiting.shift();
  if (!item) return;

  running += 1;
  Promise.resolve()
    .then(() => item.handler(item.payload, item.jobId))
    .then(item.resolve)
    .catch(item.reject)
    .finally(() => {
      running -= 1;
      runNext();
    });
}

export function getQueueStats() {
  return {
    running,
    waiting: waiting.length,
    concurrency,
  };
}

export async function enqueueJob(handler, payload) {
  const jobId = randomUUID();
  const task = new Promise((resolve, reject) => {
    waiting.push({ jobId, payload, handler, resolve, reject });
    runNext();
  });

  return { jobId, task };
}

export async function closeQueue() {
  while (running > 0 || waiting.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
