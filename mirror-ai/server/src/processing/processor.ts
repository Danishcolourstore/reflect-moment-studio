import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { config } from "../config";
import { getPresetByKey } from "../presets";
import type { ImageAnalysis, ImageRecord } from "../types";
import { analyzeImage } from "./analyzer";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isSupportedImage(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp");
}

function buildModulation(analysis: ImageAnalysis, presetKey: string) {
  const preset = getPresetByKey(presetKey);
  const exposureBoost = analysis.exposure.bucket === "underexposed" ? 1.08 : analysis.exposure.bucket === "overexposed" ? 0.96 : 1;
  const warmthOffset = analysis.skinTone.bucket === "cool" ? 0.04 : analysis.skinTone.bucket === "warm" ? -0.03 : 0;
  const contrastTaming = analysis.lighting.bucket === "high-contrast" ? 0.96 : 1;

  return {
    brightness: clamp(preset.adjustments.brightness * exposureBoost * contrastTaming, 0.7, 1.4),
    saturation: clamp(preset.adjustments.saturation * (analysis.skinTone.detected ? 1.02 : 1), 0.6, 1.5),
    hue: clamp(preset.adjustments.warmth * 20 + warmthOffset * 100, -18, 18),
  };
}

function buildSharpenSigma(baseSharpen: number, retouchIntensity: number): number {
  const normalizedRetouch = clamp(retouchIntensity, 0, 100) / 100;
  return clamp(baseSharpen - normalizedRetouch * 0.45, 0.45, 2.4);
}

function buildBlurSigma(retouchIntensity: number): number {
  const normalizedRetouch = clamp(retouchIntensity, 0, 100) / 100;
  return clamp(normalizedRetouch * 0.65, 0, 0.7);
}

async function exportPreview(baseImage: sharp.Sharp, outputPath: string): Promise<void> {
  await baseImage
    .clone()
    .resize({ width: 1920, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(outputPath);
}

async function exportProcessed(baseImage: sharp.Sharp, outputPath: string): Promise<void> {
  await baseImage.clone().jpeg({ quality: 92, mozjpeg: true }).toFile(outputPath);
}

export async function processImageRecord(record: ImageRecord): Promise<{
  updated: Partial<ImageRecord>;
}> {
  if (!isSupportedImage(record.filename)) {
    throw new Error(`Unsupported image format for ${record.filename}`);
  }

  const analysis = await analyzeImage(record.originalPath);
  const preset = getPresetByKey(record.preset);
  const sharpenSigma = buildSharpenSigma(preset.adjustments.sharpen, record.retouchIntensity);
  const blurSigma = buildBlurSigma(record.retouchIntensity);
  const modulation = buildModulation(analysis, record.preset);

  const input = sharp(record.originalPath).rotate();
  const timestamp = Date.now();
  const fileStem = `${path.parse(record.filename).name}-${timestamp}-${randomUUID().slice(0, 6)}`;
  const previewPath = path.join(config.storage.previews, `${fileStem}.jpg`);
  const processedPath = path.join(config.storage.processed, `${fileStem}.jpg`);

  const working = input
    .clone()
    .modulate(modulation)
    .linear(preset.adjustments.contrast, -(preset.adjustments.contrast - 1) * 24);

  // Natural retouching: light blur first, then controlled sharpening.
  const retouched = blurSigma > 0 ? working.clone().blur(blurSigma) : working.clone();
  const finalImage = retouched.sharpen({ sigma: sharpenSigma });

  await Promise.all([exportPreview(finalImage, previewPath), exportProcessed(finalImage, processedPath)]);

  return {
    updated: {
      status: "done",
      analysis,
      previewPath,
      processedPath,
      updatedAt: new Date().toISOString(),
    },
  };
}
