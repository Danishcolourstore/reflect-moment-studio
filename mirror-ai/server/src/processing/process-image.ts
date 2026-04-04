import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { dirs } from "../config/env.js";
import { extOrDefault } from "../lib/path-utils.js";
import { getPreset } from "./presets.js";
import { analyzeImage } from "./analyze-image.js";
import type { ImageAnalysis, PresetId } from "../types.js";

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const applyPreset = (base: sharp.Sharp, presetId: PresetId, retouchIntensity: number): sharp.Sharp => {
  const preset = getPreset(presetId);
  const retouchFactor = clamp(retouchIntensity / 100, 0, 1);

  const brightness = preset.brightness + retouchFactor * 0.03;
  const saturation = preset.saturation - retouchFactor * 0.05;
  const sharpenSigma = clamp(preset.sharpen - retouchFactor * 0.2, 0.6, 2);
  const blurSigma = retouchFactor * 0.6;

  let pipeline = base
    .modulate({
      brightness,
      saturation,
    })
    .linear(preset.contrast, -(preset.warmth * 0.8))
    .sharpen(sharpenSigma, 1.1);

  if (blurSigma > 0.15) {
    // Softens texture very lightly to keep natural skin while avoiding plastic look.
    pipeline = pipeline.blur(blurSigma).sharpen(1, 0.85);
  }

  return pipeline;
};

export interface ProcessImageInput {
  imageId: string;
  originalPath: string;
  preset: PresetId;
  retouchIntensity: number;
}

export interface ProcessImageOutput {
  previewPath: string;
  fullPath: string;
  thumbnailPath: string;
  analysis: ImageAnalysis;
}

export const processImage = async (input: ProcessImageInput): Promise<ProcessImageOutput> => {
  const ext = extOrDefault(input.originalPath, ".jpg");
  const previewPath = path.join(dirs.previews, `${input.imageId}${ext}`);
  const fullPath = path.join(dirs.full, `${input.imageId}${ext}`);
  const thumbnailPath = path.join(dirs.thumbnails, `${input.imageId}.webp`);

  fs.mkdirSync(path.dirname(previewPath), { recursive: true });
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true });

  const analysis = await analyzeImage(input.originalPath);

  const basePreview = sharp(input.originalPath, { failOn: "none" }).rotate();
  const baseFull = sharp(input.originalPath, { failOn: "none" }).rotate();

  const preview = applyPreset(basePreview, input.preset, input.retouchIntensity)
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
      fastShrinkOnLoad: true,
    })
    .jpeg({
      quality: 82,
      chromaSubsampling: "4:4:4",
      progressive: true,
      mozjpeg: true,
    });

  const full = applyPreset(baseFull, input.preset, input.retouchIntensity).jpeg({
    quality: 92,
    chromaSubsampling: "4:4:4",
    progressive: true,
    mozjpeg: true,
  });

  const thumb = sharp(input.originalPath, { failOn: "none" })
    .rotate()
    .resize({
      width: 420,
      height: 420,
      fit: "cover",
      position: "attention",
      withoutEnlargement: true,
    })
    .webp({ quality: 78 });

  await Promise.all([preview.toFile(previewPath), full.toFile(fullPath), thumb.toFile(thumbnailPath)]);

  return {
    previewPath,
    fullPath,
    thumbnailPath,
    analysis,
  };
};
