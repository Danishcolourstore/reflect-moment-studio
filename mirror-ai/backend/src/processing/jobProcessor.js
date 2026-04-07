import fs from "node:fs/promises";
import { getActivePreset, getControls, getImageById, updateImage } from "../storage/store.js";
import { analyzeImage } from "../services/imageAnalyzer.js";
import { buildAdjustments } from "../services/presetEngine.js";
import { processImage } from "../services/imageProcessor.js";
import { logger } from "../logger.js";
import { publishEvent, realtimeEvents } from "../realtime/hub.js";
import { toPublicImage } from "../api/serializers.js";

const ensureFileExists = async (filePath) => {
  await fs.access(filePath);
};

export const processImageJob = async ({ imageId, overridePreset, overrideRetouchIntensity }) => {
  const image = getImageById(imageId);
  if (!image) {
    logger.warn({ imageId }, "Skipping process job: image not found");
    return;
  }

  try {
    await ensureFileExists(image.originalPath);
    const beforeProcessing = await updateImage(image.id, {
      status: "processing",
      processingStartedAt: new Date().toISOString(),
      error: null,
    });
    publishEvent(realtimeEvents.imageProcessing, { image: toPublicImage(beforeProcessing) });

    const analysis = await analyzeImage(image.originalPath);
    const adjustments = buildAdjustments({
      preset: getActivePreset(),
      controls: getControls(),
      analysis,
      overridePreset,
      overrideRetouchIntensity,
    });

    const output = await processImage({
      originalPath: image.originalPath,
      imageId: image.id,
      adjustments,
    });

    const completed = await updateImage(image.id, {
      status: "done",
      analysis,
      adjustments,
      previewPath: output.previewPath,
      fullPath: output.fullPath,
      processedAt: new Date().toISOString(),
      error: null,
    });
    publishEvent(realtimeEvents.imageProcessed, { image: toPublicImage(completed) });
    logger.info({ imageId: image.id }, "Image processing completed");
  } catch (error) {
    const failed = await updateImage(image.id, {
      status: "failed",
      error: error.message,
    });
    publishEvent(realtimeEvents.imageProcessed, { image: toPublicImage(failed) });
    logger.error({ err: error, imageId: image.id }, "Image processing failed");
  }
};
