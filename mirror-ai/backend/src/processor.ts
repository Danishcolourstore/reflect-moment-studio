import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { getAdaptiveAdjustments } from "./presets.js";
import { updateImageRecord } from "./metadataStore.js";
import type { ImageQualityMetrics, PipelineOptions } from "./types.js";
import { nowIso } from "./utils.js";

export async function analyzeImage(inputPath: string): Promise<ImageQualityMetrics> {
  const stats = await sharp(inputPath).stats();
  const channels = stats.channels;
  const r = channels[0]?.mean ?? 128;
  const g = channels[1]?.mean ?? 128;
  const b = channels[2]?.mean ?? 128;
  const brightness = (r + g + b) / (3 * 255);
  const warmth = (r - b + 255) / (2 * 255);
  const contrast = ((channels[0]?.stdev ?? 40) + (channels[1]?.stdev ?? 40) + (channels[2]?.stdev ?? 40)) / (3 * 128);
  const sharpness = ((channels[0]?.max ?? 255) - (channels[0]?.min ?? 0)) / 255;
  const skinToneBalance = ((r + g) / 2) / (b + 1);

  return {
    brightness: clamp(brightness),
    contrast: clamp(contrast),
    sharpness: clamp(sharpness),
    warmth: clamp(warmth),
    skinToneBalance: clamp(skinToneBalance / 2),
  };
}

export async function processImageJob(params: {
  imageId: string;
  originalPath: string;
  filename: string;
  options: PipelineOptions;
}) {
  const { imageId, originalPath, filename, options } = params;
  const previewOut = path.join(config.paths.preview, `${imageId}.jpg`);
  const processedOut = path.join(config.paths.processed, `${imageId}-${filename.replace(/\s+/g, "-")}`);

  const metrics = await analyzeImage(originalPath);
  const adaptive = getAdaptiveAdjustments(options, metrics);
  const retouch = clamp(options.retouchIntensity);
  const blurSigma = retouch * 0.6;
  const sharpenBoost = 1 + retouch * 0.25;

  // Balanced edits: slight blur + sharpen avoids plastic skin while preserving detail.
  const full = sharp(originalPath)
    .modulate({
      brightness: adaptive.brightness,
      saturation: adaptive.saturation,
      hue: adaptive.hue,
    })
    .linear(adaptive.contrast, -(128 * (adaptive.contrast - 1)))
    .blur(blurSigma)
    .sharpen({
      sigma: adaptive.sharpenSigma * sharpenBoost,
      m1: 1,
      m2: 2,
    })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true });

  await fs.mkdir(path.dirname(previewOut), { recursive: true });
  await fs.mkdir(path.dirname(processedOut), { recursive: true });

  await full.toFile(processedOut);

  await sharp(processedOut)
    .resize({ width: 1280, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(previewOut);

  await updateImageRecord(imageId, (record) => ({
    ...record,
    status: "done",
    previewPath: previewOut,
    processedPath: processedOut,
    updatedAt: nowIso(),
    metrics,
  }));

  logger.info({ imageId, preset: options.preset }, "image processed");
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}
