import path from 'node:path';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { ImageAnalysis, PresetDefinition } from '../types/models.js';

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const warmTint = (warmth: number): { r: number; g: number; b: number } => {
  const temp = clamp(warmth, -0.2, 0.2);
  const rise = Math.round(Math.abs(temp) * 45);

  if (temp >= 0) {
    return { r: 255, g: 240 + rise, b: 235 - rise };
  }

  return { r: 235 - rise, g: 245 - rise, b: 255 };
};

const exposureMultiplier = (analysis: ImageAnalysis, presetExposure: number): number => {
  let adaptive = presetExposure;
  if (analysis.lightingLabel === 'underexposed') adaptive += 0.06;
  if (analysis.lightingLabel === 'overexposed') adaptive -= 0.06;

  return clamp(1 + adaptive, 0.7, 1.4);
};

const contrastLinear = (analysis: ImageAnalysis, presetContrast: number): { m: number; b: number } => {
  const adaptive = presetContrast + (0.45 - analysis.contrastScore) * 0.1;
  const m = clamp(1 + adaptive, 0.8, 1.4);
  const b = clamp(128 * (1 - m), -35, 35);
  return { m, b };
};

export interface ProcessingOutput {
  processedPath: string;
  previewPath: string;
}

export interface ProcessorInput {
  sourcePath: string;
  imageId: string;
  preset: PresetDefinition;
  retouchIntensity: number;
  processedDir: string;
  previewsDir: string;
  analysis: ImageAnalysis;
}

export const processImage = async (input: ProcessorInput): Promise<ProcessingOutput> => {
  const extension = path.extname(input.sourcePath).toLowerCase() || '.jpg';
  const outputFile = `${input.imageId}${extension === '.png' ? '.png' : '.jpg'}`;

  const processedPath = path.join(input.processedDir, outputFile);
  const previewPath = path.join(input.previewsDir, outputFile);

  const contrast = contrastLinear(input.analysis, input.preset.adjustments.contrast);
  const exposure = exposureMultiplier(input.analysis, input.preset.adjustments.exposure);

  let pipeline = sharp(input.sourcePath)
    .rotate()
    .modulate({
      brightness: exposure,
      saturation: clamp(1 + input.preset.adjustments.saturation, 0.6, 1.6),
    })
    .linear(contrast.m, contrast.b)
    .sharpen({ sigma: clamp(input.preset.adjustments.sharpness, 0.4, 1.6) });

  if (input.preset.adjustments.warmth !== 0) {
    pipeline = pipeline.tint(warmTint(input.preset.adjustments.warmth));
  }

  if (input.preset.adjustments.monochrome) {
    pipeline = pipeline.grayscale();
  }

  // Natural retouch: mild median + sharpen rebalance, keeping details.
  if (input.retouchIntensity > 0) {
    const medianSize = input.retouchIntensity >= 65 ? 3 : 1;
    pipeline = pipeline.median(medianSize).sharpen({ sigma: 0.9 });
  }

  await pipeline
    .clone()
    .jpeg({ quality: 90, chromaSubsampling: '4:4:4' })
    .toFile(processedPath);

  await pipeline
    .resize({ width: env.PREVIEW_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toFile(previewPath);

  return { processedPath, previewPath };
};
