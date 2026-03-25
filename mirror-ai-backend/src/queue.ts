import PQueue from "p-queue";
import type { ProcessorService } from "./processor.js";
import type { QueueSnapshot } from "./types.js";

export class ProcessingQueue {
  private readonly queue: PQueue;

  constructor(
    concurrency: number,
    private readonly processor: ProcessorService,
  ) {
    this.queue = new PQueue({ concurrency });
  }

  public enqueue(imageId: string): void {
    void this.queue.add(async () => {
      await this.processor.processImage(imageId);
    });
  }

  public snapshot(): QueueSnapshot {
    return {
      queued: this.queue.size,
      processing: this.queue.pending,
    };
  }
}
