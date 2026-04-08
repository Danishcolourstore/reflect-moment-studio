import sharp from "sharp";
import { analyzeImage } from "./analyze.js";
import type { PresetDefinition, ShootCategory } from "../types.js";

export interface ProcessingOptions {
  preset: PresetDefinition;
  retouchIntensity: number;
  category: ShootCategory;
  previewMaxWidth: number;
  previewQuality: number;
  fullQuality: number;
}

export interface ProcessingResult {
  previewBuffer: Buffer;
  fullBuffer: Buffer;
  analysis: Awaited<ReturnType<typeof analyzeImage>>;
  width: number;
  height: number;
  bytesOriginal: number;
  bytesPreview: number;
  bytesProcessed: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function categoryExposureBias(category: ShootCategory): number {
  switch (category) {
    case "wedding":
      return 0.02;
    case "fashion":
      return 0.0;
    case "product":
      return 0.015;
    case "street":
      return -0.01;
    case "portrait":
    default:
      return 0.01;
  }
}

function retouchSigma(intensity: number): number {
  return clamp(intensity, 0, 1) * 0.55;
}

export async function applyPresetToBuffer(inputPath: string, options: ProcessingOptions): Promise<ProcessingResult> {
  const metadata = await sharp(inputPath).metadata();
  const analysis = await analyzeImage(inputPath);
  const originalBuffer = await sharp(inputPath).rotate().toBuffer();

  const baseBrightness = options.preset.settings.brightness + categoryExposureBias(options.category);
  const exposureComp = analysis.exposureState === "under" ? 1.06 : analysis.exposureState === "over" ? 0.95 : 1.0;
  const brightness = clamp(baseBrightness * exposureComp, 0.88, 1.18);

  const contrastAdjust = clamp(options.preset.settings.contrast + analysis.lightingContrast / 800, 0.92, 1.2);
  const softBlur = retouchSigma(options.retouchIntensity);

  let pipeline = sharp(originalBuffer)
    .modulate({
      brightness,
      saturation: clamp(options.preset.settings.saturation, 0.75, 1.25),
      hue: options.preset.settings.hue,
    })
    .linear(contrastAdjust, -(128 * (contrastAdjust - 1)));

  if (softBlur > 0.02) {
    pipeline = pipeline.blur(softBlur);
  }

  pipeline = pipeline.sharpen(clamp(options.preset.settings.sharpen, 0.8, 1.8));

  const previewWidth =
    metadata.width && metadata.width > options.previewMaxWidth ? options.previewMaxWidth : metadata.width;

  const previewBuffer = await pipeline
    .clone()
    .resize({
      width: previewWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: options.previewQuality, mozjpeg: true })
    .toBuffer();

  const fullBuffer = await pipeline.clone().jpeg({ quality: options.fullQuality, mozjpeg: true }).toBuffer();

  return {
    previewBuffer,
    fullBuffer,
    analysis,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    bytesOriginal: originalBuffer.byteLength,
    bytesPreview: previewBuffer.byteLength,
    bytesProcessed: fullBuffer.byteLength,
  };
}
