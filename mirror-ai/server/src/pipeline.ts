import { eventBus } from "./events";
import { processImageRecord } from "./processing/processor";
import { getImageRecord, updateImageRecord } from "./storage";
import type { QueueController } from "./queue";

export function startPipelineWorker(queue: QueueController) {
  queue.registerWorker(async (imageId) => {
    const existing = await getImageRecord(imageId);
    if (!existing) {
      return;
    }

    const processing = await updateImageRecord(imageId, {
      status: "processing",
      error: undefined,
    });
    if (processing) {
      eventBus.emit("imageUpdated", processing);
    }

    try {
      const result = await processImageRecord(existing);
      const completed = await updateImageRecord(imageId, result.updated);
      if (completed) {
        eventBus.emit("imageUpdated", completed);
      }
    } catch (error) {
      const failed = await updateImageRecord(imageId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });
      if (failed) {
        eventBus.emit("imageUpdated", failed);
      }
    }
  });

  return {
    async stop() {
      // Queue lifecycle is managed by the queue controller itself.
    },
  };
}
