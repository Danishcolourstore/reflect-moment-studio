import sharp from "sharp";
import type { ImageAnalysis } from "../types.js";

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

const normalize = (value: number): number => clamp(Math.round(value * 100), 0, 100);

export const analyzeImage = async (inputPath: string): Promise<ImageAnalysis> => {
  const image = sharp(inputPath, { failOn: "none" });
  const metadata = await image.metadata();
  const stats = await image.stats();

  const luminance = stats.channels.length > 2 ? stats.channels[0].mean : stats.channels[0].mean;
  const gMean = stats.channels.length > 1 ? stats.channels[1].mean : luminance;
  const bMean = stats.channels.length > 2 ? stats.channels[2].mean : luminance;
  const contrast = stats.channels[0].stdev;

  const exposureScore = normalize(luminance / 255);
  const contrastScore = normalize(contrast / 64);
  const skinToneEstimate = normalize((0.45 * luminance + 0.4 * gMean + 0.15 * bMean) / 255);
  const lighting: ImageAnalysis["lighting"] =
    exposureScore < 40 ? "low" : exposureScore > 68 ? "bright" : "balanced";

  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? "unknown",
    exposureScore,
    contrastScore,
    skinToneScore: skinToneEstimate,
    lighting,
  };
};
