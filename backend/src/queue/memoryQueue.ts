import type { QueueDriver, QueueTask } from "./types.js";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class MemoryQueue implements QueueDriver {
  kind: "memory" = "memory";
  private readonly queue: QueueTask[] = [];
  private handler?: (task: QueueTask) => Promise<void>;
  private running = false;
  private stopRequested = false;
  private readonly workers: Promise<void>[] = [];

  constructor(private readonly concurrency: number) {}

  async enqueue(task: QueueTask): Promise<void> {
    this.queue.push(task);
  }

  async start(onTask: (task: QueueTask) => Promise<void>): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.stopRequested = false;
    this.handler = onTask;

    for (let i = 0; i < this.concurrency; i += 1) {
      this.workers.push(this.workerLoop());
    }
  }

  private async workerLoop(): Promise<void> {
    while (!this.stopRequested) {
      const task = this.queue.shift();
      if (!task || !this.handler) {
        await sleep(80);
        continue;
      }

      try {
        await this.handler(task);
      } catch {
        // Keep worker loop alive on failures.
      }
    }
  }

  async close(): Promise<void> {
    this.stopRequested = true;
    await Promise.all(this.workers);
  }
}
