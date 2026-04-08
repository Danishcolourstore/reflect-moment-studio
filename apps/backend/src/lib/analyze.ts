import sharp from "sharp";
import type { ImageAnalysis } from "../types.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function analyzeImage(inputPath: string): Promise<ImageAnalysis> {
  const image = sharp(inputPath, { failOn: "none" }).rotate();
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const pixelCount = info.width * info.height;
  let lumaSum = 0;
  let lumaSq = 0;
  let skinLike = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumaSum += luma;
    lumaSq += luma * luma;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const range = max - min;
    if (r > 85 && g > 40 && b > 20 && range > 15 && Math.abs(r - g) > 12 && r > g && r > b) {
      skinLike += 1;
    }
  }

  const avgLuma = lumaSum / pixelCount;
  const exposureScore = clamp((avgLuma / 255) * 100, 0, 100);
  const variance = lumaSq / pixelCount - avgLuma * avgLuma;
  const contrastNorm = clamp(Math.sqrt(Math.max(0, variance)) / 128, 0, 1);
  const skinToneScore = clamp((skinLike / pixelCount) * 100, 0, 100);

  return {
    exposureScore,
    exposureState: exposureScore < 35 ? "under" : exposureScore > 72 ? "over" : "balanced",
    skinToneScore,
    lightingContrast: Math.round(contrastNorm * 100),
    width: info.width,
    height: info.height,
  };
}
