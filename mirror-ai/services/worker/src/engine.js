import { promises as fs } from "node:fs";
import sharp from "sharp";
import {
  ORIGINALS_DIR,
  PROCESSED_FULL_DIR,
  PROCESSED_PREVIEW_DIR,
  getPresetById,
} from "@mirror-ai/shared";
import path from "node:path";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function exposureScore(stats) {
  const channels = [stats.channels[0], stats.channels[1], stats.channels[2]].filter(Boolean);
  const means = channels.map((channel) => channel.mean ?? 0);
  const avg = means.reduce((sum, value) => sum + value, 0) / Math.max(means.length, 1);
  return clamp(avg / 255, 0, 1);
}

function skinToneBalance(stats) {
  const [r, g, b] = stats.channels;
  if (!r || !g || !b) {
    return 0.5;
  }
  const rg = r.mean / Math.max(g.mean, 1);
  const rb = r.mean / Math.max(b.mean, 1);
  const normalized = (rg * 0.45 + rb * 0.55) / 2;
  return clamp(normalized, 0, 1);
}

function lightingScore(stats) {
  const channels = [stats.channels[0], stats.channels[1], stats.channels[2]].filter(Boolean);
  const stdev = channels.map((channel) => channel.stdev ?? 0);
  const avgStdev = stdev.reduce((sum, value) => sum + value, 0) / Math.max(stdev.length, 1);
  return clamp(avgStdev / 90, 0, 1);
}

function buildRetouchKernel(intensity) {
  const safe = clamp(intensity, 0, 1);
  const center = 1 + safe * 0.8;
  const surround = -safe * 0.1;
  return {
    width: 3,
    height: 3,
    kernel: [
      surround, surround, surround,
      surround, center, surround,
      surround, surround, surround,
    ],
  };
}

export async function processImage({
  imageId,
  originalPath,
  originalName,
  presetId,
  retouchIntensity,
}) {
  const preset = getPresetById(presetId);
  const inputPath = path.join(ORIGINALS_DIR, originalPath);
  const fullOutput = path.join(PROCESSED_FULL_DIR, originalPath);
  const previewOutput = path.join(PROCESSED_PREVIEW_DIR, `${imageId}.jpg`);
  await fs.mkdir(path.dirname(fullOutput), { recursive: true });
  await fs.mkdir(path.dirname(previewOutput), { recursive: true });

  const source = sharp(inputPath, { failOn: "none" }).rotate();
  const metadata = await source.metadata();
  const stats = await source.stats();

  const analysis = {
    exposure: Number(exposureScore(stats).toFixed(3)),
    skinToneBalance: Number(skinToneBalance(stats).toFixed(3)),
    lighting: Number(lightingScore(stats).toFixed(3)),
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    colorSpace: metadata.space ?? null,
  };

  const tuning = preset.tuning;
  const retouch = clamp(retouchIntensity ?? 0.3, 0, 1);

  let pipeline = sharp(inputPath, { failOn: "none" }).rotate();
  if (tuning.grayscale) {
    pipeline = pipeline.grayscale();
  }

  const baseBrightness = tuning.brightness ?? 1;
  const exposureBoost = analysis.exposure < 0.45 ? 1.04 : analysis.exposure > 0.75 ? 0.98 : 1;
  const warmth = tuning.warmth ?? 1;
  const saturation = tuning.saturation ?? 1;
  const contrast = tuning.contrast ?? 1;

  pipeline = pipeline
    .modulate({
      brightness: clamp(baseBrightness * exposureBoost, 0.8, 1.4),
      saturation: clamp(saturation, 0.5, 1.5),
    })
    .linear(contrast, -(128 * contrast) + 128)
    .recomb([
      [warmth, 0, 0],
      [0, 1, 0],
      [0, 0, 2 - warmth],
    ]);

  if (retouch > 0.03) {
    pipeline = pipeline
      .median(Math.max(1, Math.floor(retouch * 3)))
      .convolve(buildRetouchKernel(retouch));
  }

  const sharpenSigma = clamp((tuning.sharpen ?? 0.5) * (1 + retouch * 0.25), 0, 2);
  pipeline = pipeline.sharpen(sharpenSigma);

  await pipeline
    .clone()
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(fullOutput);

  await pipeline
    .clone()
    .resize({ width: 1800, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(previewOutput);

  return {
    id: imageId,
    originalName,
    presetId: preset.id,
    retouchIntensity: retouch,
    analysis,
    fullPath: originalPath,
    previewPath: `${imageId}.jpg`,
  };
}
