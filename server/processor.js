import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "./config.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRetouch(value) {
  return clamp(Number.isFinite(value) ? value : config.defaultRetouchIntensity, 0, 1);
}

export async function analyzeImage(sourcePath) {
  const { data, info } = await sharp(sourcePath, { failOn: "none" })
    .rotate()
    .resize(320, 320, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = Math.max(info.channels, 3);
  const pixels = info.width * info.height;
  let luma = 0;
  let red = 0;
  let green = 0;
  let blue = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    luma += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    red += r;
    green += g;
    blue += b;
  }

  const avgLuma = luma / pixels / 255;
  const avgRed = red / pixels;
  const avgGreen = green / pixels;
  const avgBlue = blue / pixels;

  const warmthScore = (avgRed - avgBlue) / 255;
  const skinToneScore = clamp((avgRed - avgGreen * 0.62 - avgBlue * 0.38) / 80, 0, 1);
  const lightingScore = clamp(1 - Math.abs(avgLuma - 0.54) * 1.7, 0, 1);

  return {
    exposureScore: Number(avgLuma.toFixed(4)),
    skinToneScore: Number(skinToneScore.toFixed(4)),
    lightingScore: Number(lightingScore.toFixed(4)),
    warmthScore: Number(warmthScore.toFixed(4)),
  };
}

function deriveSettings(analysis, presetConfig, retouchIntensity) {
  const exposureError = 0.55 - analysis.exposureScore;
  const exposure = clamp((presetConfig.exposure ?? 0) + exposureError * 0.62, -0.22, 0.3);
  const brightness = clamp(1 + exposure, 0.8, 1.32);
  const saturation = clamp(
    1 + (presetConfig.saturation ?? 0) + analysis.skinToneScore * 0.02,
    0.8,
    1.3,
  );
  const warmth = clamp(
    (presetConfig.warmth ?? 0) + (analysis.warmthScore < -0.04 ? 0.05 : 0),
    -0.2,
    0.22,
  );
  const clarity = clamp(1 + (presetConfig.clarity ?? 0) * (1 - retouchIntensity * 0.22), 0.84, 1.32);
  const blurSigma =
    retouchIntensity > 0.02 ? Math.max(0.3, Number((retouchIntensity * 0.95).toFixed(2))) : 0;

  return {
    brightness,
    saturation,
    warmth,
    clarity,
    blurSigma,
  };
}

export async function processImage({
  imageId,
  sourcePath,
  previewPath,
  processedPath,
  metadataPath,
  preset,
  retouchIntensity,
  category,
}) {
  const analysis = await analyzeImage(sourcePath);
  const normalizedRetouch = normalizeRetouch(retouchIntensity);
  const settings = deriveSettings(analysis, preset.config ?? {}, normalizedRetouch);

  const base = sharp(sourcePath, { failOn: "none" }).rotate();
  const imageMeta = await base.metadata();
  const width = imageMeta.width ?? 0;
  const height = imageMeta.height ?? 0;

  const warmthTint =
    settings.warmth > 0
      ? { r: 1 + settings.warmth, g: 1, b: 1 - settings.warmth * 0.5 }
      : { r: 1 + settings.warmth * 0.3, g: 1, b: 1 - settings.warmth };

  let pipeline = base
    .clone()
    .modulate({
      brightness: settings.brightness,
      saturation: saturationForPreset(preset.id, settings.saturation),
    })
    .linear(settings.clarity, -(settings.clarity - 1) * 12)
    .recomb([
      [warmthTint.r, 0, 0],
      [0, warmthTint.g, 0],
      [0, 0, warmthTint.b],
    ]);

  if (preset.id === "studio-bw") {
    pipeline = pipeline.grayscale();
  }
  if (settings.blurSigma > 0) {
    pipeline = pipeline.blur(settings.blurSigma);
  }

  await pipeline.clone().jpeg({ quality: config.fullQuality, mozjpeg: true }).toFile(processedPath);

  await pipeline
    .clone()
    .resize({
      width: Math.min(1280, width || 1280),
      height: Math.min(1280, height || 1280),
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: config.previewQuality, mozjpeg: true })
    .toFile(previewPath);

  const metadata = {
    imageId,
    category,
    presetId: preset.id,
    retouchIntensity: normalizedRetouch,
    analysis: {
      exposureScore: analysis.exposureScore,
      skinToneScore: analysis.skinToneScore,
      lightingScore: analysis.lightingScore,
    },
    adjustments: {
      brightness: Number(settings.brightness.toFixed(3)),
      saturation: Number(settings.saturation.toFixed(3)),
      warmth: Number(settings.warmth.toFixed(3)),
      clarity: Number(settings.clarity.toFixed(3)),
      blurSigma: settings.blurSigma,
    },
    generatedAt: new Date().toISOString(),
  };

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    previewPath,
    processedPath,
    analysis: {
      exposureScore: analysis.exposureScore,
      skinToneScore: analysis.skinToneScore,
      lightingScore: analysis.lightingScore,
      notes: `Preset ${preset.name} applied. Natural retouch ${Math.round(normalizedRetouch * 100)}%.`,
    },
    metadata: {
      width,
      height,
      ...metadata,
    },
  };
}

function saturationForPreset(presetId, value) {
  if (presetId === "studio-bw") return 0;
  return value;
}
