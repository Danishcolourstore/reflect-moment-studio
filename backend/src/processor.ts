import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { env, storagePaths } from "./config.js";
import { db } from "./database.js";
import { bus } from "./events.js";
import { toPublicPath } from "./helpers.js";
import type { QueueTask } from "./queue/types.js";
import type { ImageQualityMetrics, Preset, ProcessingMetadata, RuntimeSettings } from "./types.js";

interface ProcessResult {
  previewPath: string;
  processedPath: string;
  metadata: ProcessingMetadata;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const computeMetrics = async (inputPath: string): Promise<{
  metrics: ImageQualityMetrics;
  width: number;
  height: number;
  sizeBytes: number;
}> => {
  const stat = await fs.stat(inputPath);
  const image = sharp(inputPath).rotate();
  const imageStats = await image.stats();
  const imageMeta = await image.metadata();

  const channels = imageStats.channels;
  const avgBrightness = channels.length
    ? (channels[0]?.mean ?? 0) * 0.299 + (channels[1]?.mean ?? 0) * 0.587 + (channels[2]?.mean ?? 0) * 0.114
    : 128;
  const contrast = channels.length ? (channels[0]?.stdev ?? 0) / 64 : 1;
  const warmth = channels.length ? ((channels[0]?.mean ?? 128) - (channels[2]?.mean ?? 128)) / 64 : 0;
  const dynamicRange = channels.length
    ? (((channels[0]?.max ?? 255) - (channels[0]?.min ?? 0)) +
        ((channels[1]?.max ?? 255) - (channels[1]?.min ?? 0)) +
        ((channels[2]?.max ?? 255) - (channels[2]?.min ?? 0))) /
      (255 * 3)
    : 1;

  const skinToneConfidence = clamp(0.6 + warmth * 0.2 + (avgBrightness / 255) * 0.2, 0, 1);

  return {
    metrics: {
      brightness: clamp(avgBrightness / 255, 0, 1),
      contrast: clamp(contrast, 0, 2),
      warmth: clamp(0.5 + warmth, 0, 1),
      dynamicRange: clamp(dynamicRange, 0, 1),
      skinToneConfidence,
    },
    width: imageMeta.width ?? 0,
    height: imageMeta.height ?? 0,
    sizeBytes: stat.size,
  };
};

const applyPreset = (
  image: sharp.Sharp,
  preset: Preset,
  metrics: ImageQualityMetrics,
  retouchIntensity: number,
): sharp.Sharp => {
  const normalizedRetouch = clamp(retouchIntensity, 0, 1);
  const exposureCompensation = preset.exposure + (0.52 - metrics.brightness) * 0.35;
  const gamma = clamp(1 - exposureCompensation * 0.32, 0.75, 1.25);
  const linearB = clamp(exposureCompensation * 0.12, -0.15, 0.15);
  const linearA = clamp(preset.contrast + (1 - metrics.dynamicRange) * 0.04, 0.85, 1.25);
  const skinSaturationNudge = clamp(preset.skinToneLift * normalizedRetouch * 18, 0, 8);
  const warmthTint = clamp((preset.warmth - 1) * 18, -12, 18);
  const recoverHighlights = clamp(preset.highlightRecovery * 20, 0, 8);
  const sharpen = clamp(1 + preset.contrast * 0.2, 1.05, 1.5);
  const denoise = clamp(0.2 + normalizedRetouch * 0.8, 0.2, 1.2);

  return image
    .gamma(gamma)
    .linear(linearA, linearB)
    .modulate({
      saturation: clamp(preset.saturation + skinSaturationNudge / 100, 0.8, 1.25),
      brightness: clamp(1 + exposureCompensation * 0.4, 0.8, 1.2),
    })
    .recomb([
      [1 + warmthTint / 100, 0, 0],
      [0, 1, 0],
      [0, 0, 1 - warmthTint / 100],
    ])
    .median(Math.round(denoise))
    .sharpen(sharpen, 0.7, 2)
    .normalise({ lower: 1, upper: clamp(99 - recoverHighlights, 90, 99) })
    .withMetadata()
    .jpeg({ quality: env.JPEG_QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" });
};

export const processImage = async (
  imageId: string,
  override?: Partial<Pick<RuntimeSettings, "activePresetId" | "retouchIntensity">>,
): Promise<ProcessResult> => {
  const record = await db.getImageById(imageId);
  if (!record) {
    throw new Error(`Image not found: ${imageId}`);
  }

  const settings = await db.getSettings();
  const selectedPresetId = override?.activePresetId ?? settings.activePresetId;
  const retouchIntensity = override?.retouchIntensity ?? settings.retouchIntensity;
  const preset = await db.getPresetById(selectedPresetId);
  if (!preset) {
    throw new Error(`Preset not found: ${selectedPresetId}`);
  }

  const startedAt = Date.now();
  const sourcePath = path.resolve(record.originalPath);
  const { metrics, width, height, sizeBytes } = await computeMetrics(sourcePath);
  const baseName = path.parse(record.fileName).name;
  const previewOutputPath = path.join(storagePaths.previews, `${baseName}-${record.id}-preview.jpg`);
  const processedOutputPath = path.join(storagePaths.processed, `${baseName}-${record.id}-processed.jpg`);

  await applyPreset(sharp(sourcePath).rotate(), preset, metrics, retouchIntensity)
    .resize({
      width: env.PREVIEW_MAX_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    })
    .toFile(previewOutputPath);

  await applyPreset(sharp(sourcePath).rotate(), preset, metrics, retouchIntensity).toFile(processedOutputPath);

  const metadata: ProcessingMetadata = {
    presetId: preset.id,
    retouchIntensity,
    qualityMetrics: metrics,
    sourceSizeBytes: sizeBytes,
    sourceWidth: width,
    sourceHeight: height,
    processingMs: Date.now() - startedAt,
  };

  return {
    previewPath: toPublicPath(previewOutputPath),
    processedPath: toPublicPath(processedOutputPath),
    metadata,
  };
};

export const processImageWithTask = async (task: QueueTask): Promise<void> => {
  const record = await db.getImageById(task.imageId);
  if (!record) return;

  const processing = await db.patchImage(task.imageId, {
    status: "processing",
    error: undefined,
  });
  if (processing) {
    bus.emit("imageUpdated", processing);
  }

  try {
    const result = await processImage(task.imageId, {
      activePresetId: task.presetId,
      retouchIntensity: task.retouchIntensity,
    });

    const updated = await db.patchImage(task.imageId, {
      status: "done",
      previewPath: result.previewPath,
      processedPath: result.processedPath,
      metadata: result.metadata,
      error: undefined,
    });
    if (updated) {
      bus.emit("imageUpdated", updated);
    }

    if (task.batchId) {
      const batch = await db.getBatchById(task.batchId);
      if (batch) {
        const completed = Math.min(batch.total, batch.completed + 1);
        const nextStatus = completed >= batch.total ? "done" : "running";
        const patched = await db.patchBatch(batch.id, {
          completed,
          status: nextStatus,
        });
        if (patched) {
          bus.emit("batchUpdated", patched);
        }
      }
    }
  } catch (error) {
    const failed = await db.patchImage(task.imageId, {
      status: "error",
      error: (error as Error).message,
    });
    if (failed) {
      bus.emit("imageUpdated", failed);
    }

    if (task.batchId) {
      const patchedBatch = await db.patchBatch(task.batchId, {
        status: "error",
      });
      if (patchedBatch) {
        bus.emit("batchUpdated", patchedBatch);
      }
    }
  }
};
