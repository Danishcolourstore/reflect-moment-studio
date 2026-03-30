import { processingQueue } from "./queue.js";
import { logger } from "./logger.js";

export async function enqueueImageProcessing(imageId: string): Promise<void> {
  await processingQueue.add(
    "process-image",
    {
      imageId,
      requestedAt: new Date().toISOString(),
    },
    {
      jobId: imageId,
    },
  );
  logger.info({ imageId }, "Queued image for processing");
}
