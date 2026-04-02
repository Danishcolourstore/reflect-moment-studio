import sharp from "sharp";
import type { ImageAnalysis } from "../types/domain.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function analyzeImage(imagePath: string): Promise<ImageAnalysis> {
  const instance = sharp(imagePath, { failOn: "none" }).rotate();
  const [metadata, stats] = await Promise.all([instance.metadata(), instance.stats()]);

  const channels = stats.channels;
  const red = channels[0]?.mean ?? 127;
  const green = channels[1]?.mean ?? 127;
  const blue = channels[2]?.mean ?? 127;

  const exposureScore = (red + green + blue) / (3 * 255);
  const exposureLabel: ImageAnalysis["exposureLabel"] =
    exposureScore < 0.38 ? "underexposed" : exposureScore > 0.72 ? "overexposed" : "balanced";

  const skinToneWarmth = clamp((red - blue + 128) / 255, 0, 1);
  const lightingContrast = clamp(
    ((channels[0]?.stdev ?? 30) + (channels[1]?.stdev ?? 30) + (channels[2]?.stdev ?? 30)) / 180,
    0,
    1,
  );

  return {
    exposureScore: Number(exposureScore.toFixed(3)),
    exposureLabel,
    skinToneWarmth: Number(skinToneWarmth.toFixed(3)),
    lightingContrast: Number(lightingContrast.toFixed(3)),
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
}
