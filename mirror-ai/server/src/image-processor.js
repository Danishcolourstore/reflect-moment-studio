import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { analyzeImageMetrics } from "./analysis.js";
import { getPresetById } from "./presets.js";
import { clamp } from "./utils.js";

async function applyNaturalRetouch(buffer, intensity) {
  if (intensity <= 0.001) {
    return buffer;
  }

  const smoothSigma = clamp(0.35 + intensity * 1.3, 0.35, 1.9);
  const blendBack = clamp(1 - intensity * 0.2, 0.74, 1);
  const softened = await sharp(buffer).blur(smoothSigma).toBuffer();

  return sharp(softened)
    .composite([{ input: buffer, blend: "over", opacity: blendBack }])
    .toBuffer();
}

async function renderVariant({
  inputBuffer,
  metrics,
  preset,
  retouchIntensity,
  maxWidth,
  quality,
}) {
  const tunedExposure = clamp(
    preset.params.exposureShift + (0.5 - metrics.exposure.normalized) * 0.25,
    -0.28,
    0.32,
  );
  const brightness = clamp(1 + tunedExposure, 0.84, 1.26);
  const saturation = clamp(
    preset.params.saturation * (1 - Math.abs(metrics.skin.deltaWarmth) * 0.1),
    0.85,
    1.18,
  );
  const gamma = clamp(
    1 + (metrics.lighting.score - 0.5) * 0.1,
    0.92,
    1.12,
  );

  let pipeline = sharp(inputBuffer).rotate();
  if (maxWidth) {
    pipeline = pipeline.resize({
      width: maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const tintStrength = preset.params.warmth;
  const redGain = clamp(1 + tintStrength * 0.08 + metrics.skin.deltaWarmth * 0.03, 0.92, 1.1);
  const blueGain = clamp(1 - tintStrength * 0.05 - metrics.skin.deltaWarmth * 0.02, 0.9, 1.1);
  let out = await pipeline
    .modulate({
      brightness,
      saturation,
    })
    .gamma(gamma)
    .linear([redGain, 1, blueGain], [0, 0, 0])
    .sharpen({
      sigma: clamp(0.8 + preset.params.sharpness * 1.1, 0.8, 1.8),
      m1: 1,
      m2: 2,
      x1: 2,
      y2: 10,
      y3: 18,
    })
    .toBuffer();

  out = await applyNaturalRetouch(out, retouchIntensity);

  return sharp(out).jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
}

export async function processImageJob({
  imageId,
  originalFilePath,
  originalFileName,
  presetId,
  category,
  retouchIntensity,
  previewMaxWidth,
  previewQuality,
  outputQuality,
  previewsDir,
  processedDir,
}) {
  const sourceBuffer = await fs.readFile(originalFilePath);
  const preset = getPresetById(presetId);
  const analysis = await analyzeImageMetrics(sourceBuffer);
  const safeRetouch = clamp(retouchIntensity, 0, 1);

  const [previewBuffer, processedBuffer] = await Promise.all([
    renderVariant({
      inputBuffer: sourceBuffer,
      metrics: analysis,
      preset,
      retouchIntensity: safeRetouch,
      maxWidth: previewMaxWidth,
      quality: previewQuality,
    }),
    renderVariant({
      inputBuffer: sourceBuffer,
      metrics: analysis,
      preset,
      retouchIntensity: safeRetouch,
      maxWidth: null,
      quality: outputQuality,
    }),
  ]);

  const extless = path.parse(originalFileName).name.replace(/[^a-zA-Z0-9-_]/g, "_");
  const outputName = `${imageId}-${extless}.jpg`;
  const previewFilePath = path.join(previewsDir, outputName);
  const processedFilePath = path.join(processedDir, outputName);

  await Promise.all([
    fs.writeFile(previewFilePath, previewBuffer),
    fs.writeFile(processedFilePath, processedBuffer),
  ]);

  return {
    imageId,
    presetId: preset.id,
    category,
    retouchIntensity: safeRetouch,
    analysis,
    previewFilePath,
    processedFilePath,
  };
}
