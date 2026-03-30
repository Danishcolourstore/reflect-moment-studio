import sharp from "sharp";
import { config } from "../config.js";
import { getPresetById } from "../presets.js";
import type { ImageAnalysis } from "../types/models.js";

function mapSharpModulation(warmth: number): { saturation: number; brightness: number } {
  return {
    saturation: Math.max(0.7, Math.min(1.4, warmth)),
    brightness: warmth > 1 ? 1.01 : 0.99,
  };
}

function buildGamma(exposure: number): number {
  const normalized = Math.max(-0.3, Math.min(0.3, exposure - 0.1));
  return normalized >= 0 ? 1 - normalized * 0.4 : 1 + Math.abs(normalized) * 0.5;
}

export interface ProcessingResult {
  previewPath: string;
  fullPath: string;
}

export async function processImage(
  inputPath: string,
  outputPreviewPath: string,
  outputFullPath: string,
  presetId: string,
  retouchIntensity: number,
  analysis: ImageAnalysis,
): Promise<ProcessingResult> {
  const preset = getPresetById(presetId);
  const retouch = Math.max(0, Math.min(1, retouchIntensity));
  const modulation = mapSharpModulation(preset.warmth);
  const gamma = buildGamma(preset.exposure + (0.52 - analysis.exposureScore) * 0.15);

  // Keep retouch subtle: slight denoise + very low sharpen to avoid plastic skin.
  const blurSigma = retouch * 0.6;
  const sharpenAmount = 0.5 + (1 - retouch) * 0.8;

  const base = sharp(inputPath).rotate().withMetadata();

  const fullPipeline = base
    .clone()
    .modulate({
      brightness: modulation.brightness,
      saturation: preset.saturation,
    })
    .gamma(gamma)
    .linear(preset.contrast, -(128 * (preset.contrast - 1)))
    .blur(blurSigma || undefined)
    .sharpen({ sigma: sharpenAmount })
    .jpeg({ quality: 93, mozjpeg: true, chromaSubsampling: "4:4:4" });

  const previewPipeline = base
    .clone()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .modulate({
      brightness: modulation.brightness,
      saturation: preset.saturation,
    })
    .gamma(gamma)
    .linear(preset.contrast, -(128 * (preset.contrast - 1)))
    .blur(blurSigma || undefined)
    .sharpen({ sigma: sharpenAmount })
    .jpeg({ quality: 82, mozjpeg: true });

  await Promise.all([fullPipeline.toFile(outputFullPath), previewPipeline.toFile(outputPreviewPath)]);

  return {
    previewPath: outputPreviewPath,
    fullPath: outputFullPath,
  };
}
