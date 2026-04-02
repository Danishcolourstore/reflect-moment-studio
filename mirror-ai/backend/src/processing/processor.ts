import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { presets } from "../data/presets.js";
import { analyzeImage } from "./analyzer.js";
import { paths, toAbsoluteStoragePath, toRelativeStoragePath } from "../config/paths.js";
import type { ImageRecord, ProcessedResult } from "../types/domain.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function tintMatrix(warmth: number): [[number, number, number], [number, number, number], [number, number, number]] {
  const normalized = clamp(warmth, -1, 1);
  return [
    [1 + normalized * 0.1, 0, 0],
    [0, 1, 0],
    [0, 0, 1 - normalized * 0.1],
  ];
}

export async function processImage(params: {
  image: ImageRecord;
  presetId: string;
  retouchIntensity: number;
  category: string;
}): Promise<ProcessedResult> {
  const preset = presets.find((item) => item.id === params.presetId) ?? presets[0]!;

  const originalAbsolutePath = toAbsoluteStoragePath(params.image.originalPath);
  const analysis = await analyzeImage(originalAbsolutePath);

  const exposureAssist =
    analysis.exposureLabel === "underexposed" ? 0.04 : analysis.exposureLabel === "overexposed" ? -0.03 : 0;

  const brightness = clamp(1 + preset.adjustments.brightness + exposureAssist, 0.6, 1.4);
  const saturation = clamp(1 + preset.adjustments.saturation, 0.5, 1.5);
  const contrast = clamp(1 + preset.adjustments.contrast, 0.7, 1.5);
  const warmth = clamp(preset.adjustments.warmth + (analysis.skinToneWarmth - 0.5) * 0.06, -0.4, 0.4);

  const retouch = clamp(params.retouchIntensity, 0, 100) / 100;
  const medianRadius = retouch < 0.15 ? 0 : retouch < 0.5 ? 1 : 2;

  let pipeline = sharp(originalAbsolutePath, { failOn: "none" })
    .rotate()
    .modulate({ brightness, saturation })
    .linear(contrast, -(128 * (contrast - 1)))
    .recomb(tintMatrix(warmth));

  if (medianRadius > 0) {
    // Small median filtering gives natural skin smoothing without waxy texture.
    pipeline = pipeline.median(medianRadius);
  }

  pipeline = pipeline.sharpen({
    sigma: 1.1,
    m1: 0.8,
    m2: clamp(1 + preset.adjustments.sharpness + retouch * 0.2, 1, 2.2),
    x1: 2,
    y2: 10,
    y3: 20,
  });

  const extension = path.extname(params.image.filename) || ".jpg";
  const base = path.basename(params.image.filename, extension);
  const unique = randomUUID().slice(0, 8);

  const previewAbsolute = path.join(paths.previews, `${base}_${unique}_preview.jpg`);
  const fullAbsolute = path.join(paths.processed, `${base}_${unique}_full.jpg`);

  await pipeline
    .clone()
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(previewAbsolute);

  await pipeline
    .clone()
    .jpeg({ quality: 93, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(fullAbsolute);

  return {
    previewPath: toRelativeStoragePath(previewAbsolute),
    processedPath: toRelativeStoragePath(fullAbsolute),
    analysis,
  };
}
