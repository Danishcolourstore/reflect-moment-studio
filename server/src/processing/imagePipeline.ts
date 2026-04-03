import path from "node:path";
import sharp from "sharp";
import { promises as fs } from "node:fs";
import { env } from "../config/env";
import type { ImageRecord, ProcessingPreset, QueuePayload } from "../types";
import { imageRepository } from "../storage/imageRepository";
import { toStorageUrl } from "../storage/fileStore";

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const deriveExposure = (score: number): "underexposed" | "balanced" | "overexposed" => {
  if (score < 0.38) {
    return "underexposed";
  }
  if (score > 0.68) {
    return "overexposed";
  }
  return "balanced";
};

const deriveLighting = (spread: number): "flat" | "balanced" | "high-contrast" => {
  if (spread < 40) {
    return "flat";
  }
  if (spread > 72) {
    return "high-contrast";
  }
  return "balanced";
};

const deriveSkinTone = (r: number, g: number, b: number): "cool" | "neutral" | "warm" => {
  const warmth = (r + g * 0.5) - b;
  if (warmth < 40) {
    return "cool";
  }
  if (warmth > 75) {
    return "warm";
  }
  return "neutral";
};

async function analyzeImage(inputPath: string): Promise<NonNullable<ImageRecord["analysis"]>> {
  const image = sharp(inputPath);
  const [stats, meta] = await Promise.all([image.stats(), image.metadata()]);
  const red = stats.channels[0]?.mean ?? 0;
  const green = stats.channels[1]?.mean ?? 0;
  const blue = stats.channels[2]?.mean ?? 0;
  const luma = clamp((0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255, 0, 1);
  const spread = stats.channels.reduce((sum, channel) => sum + channel.stdev, 0) / stats.channels.length;

  return {
    exposureScore: Number(luma.toFixed(3)),
    exposure: deriveExposure(luma),
    lighting: deriveLighting(spread),
    skinTone: deriveSkinTone(red, green, blue),
    dimensions: {
      width: meta.width || 0,
      height: meta.height || 0,
    },
  };
}

function applyPreset(transformer: sharp.Sharp, preset: ProcessingPreset, retouchIntensity: number): sharp.Sharp {
  const retouch = clamp(retouchIntensity, 0, 1);
  const saturation = clamp(preset.settings.saturationBoost, 0.5, 2);
  const brightness = clamp(1 + preset.settings.exposureBoost, 0.4, 2);

  let pipe = transformer
    .modulate({ brightness, saturation })
    .linear(preset.settings.contrastBoost, -(preset.settings.contrastBoost - 1) * 8);

  if (preset.settings.warmthShift > 1) {
    const warm = clamp((preset.settings.warmthShift - 1) * 0.18, 0, 0.25);
    pipe = pipe.tint({
      r: Math.round(255 - 10 * warm),
      g: Math.round(246 - 8 * warm),
      b: Math.round(236 - 22 * warm),
    });
  }

  if (retouch > 0.01) {
    // Keep retouch natural: mild skin smoothing followed by detail recovery.
    pipe = pipe.blur(0.18 + retouch * 0.9).sharpen(0.85 + retouch * 0.6);
  }

  return pipe;
}

function makeOutputPath(imageId: string, type: "preview" | "full"): string {
  const dir = type === "preview" ? env.storagePaths.processedPreview : env.storagePaths.processedFull;
  return path.join(dir, `${imageId}.jpg`);
}

export async function processImage(
  image: ImageRecord,
  preset: ProcessingPreset,
  retouchIntensity: number,
): Promise<{
  fullPath: string;
  previewPath: string;
  analysis: NonNullable<ImageRecord["analysis"]>;
}> {
  await fs.access(image.originalPath);
  const analysis = await analyzeImage(image.originalPath);
  const fullPath = makeOutputPath(image.id, "full");
  const previewPath = makeOutputPath(image.id, "preview");

  await applyPreset(sharp(image.originalPath).rotate(), preset, retouchIntensity)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(fullPath);

  await applyPreset(
    sharp(image.originalPath).rotate().resize({ width: env.PREVIEW_WIDTH, withoutEnlargement: true }),
    preset,
    retouchIntensity * 0.9,
  )
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(previewPath);

  return { fullPath, previewPath, analysis };
}

export const imagePipeline = {
  async processJob(payload: QueuePayload): Promise<ImageRecord> {
    const current = imageRepository.getImageById(payload.imageId);
    if (!current) {
      throw new Error(`Image not found: ${payload.imageId}`);
    }

    const preset = imageRepository.getPresetById(current.presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${current.presetId}`);
    }

    imageRepository.updateImage(current.id, {
      status: "processing",
      statusMessage: "AI pipeline processing",
    });

    try {
      const { fullPath, previewPath, analysis } = await processImage(
        current,
        preset,
        current.retouchIntensity,
      );

      const updated = imageRepository.updateImage(current.id, {
        status: "done",
        statusMessage: "Processed",
        fullPath,
        previewPath,
        fullUrl: toStorageUrl(fullPath),
        previewUrl: toStorageUrl(previewPath),
        processedAt: new Date().toISOString(),
        analysis,
      });

      if (!updated) {
        throw new Error(`Unable to finalize image: ${current.id}`);
      }
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Processing failed";
      imageRepository.updateImage(current.id, {
        status: "failed",
        statusMessage: message,
      });
      throw error;
    }
  },
};
