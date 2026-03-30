import sharp from "sharp";
import type { ImageAnalysis } from "../types/models.js";

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export async function analyzeImage(filePath: string): Promise<ImageAnalysis> {
  const { data, info } = await sharp(filePath).resize(320, 320, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const totalPixels = info.width * info.height;

  let luminanceSum = 0;
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let skinLikePixels = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    redSum += r;
    greenSum += g;
    blueSum += b;
    luminanceSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Practical skin-tone heuristic for natural look guidance.
    if (r > 60 && g > 40 && b > 20 && r > b && Math.abs(r - g) < 80 && r - g > 5) {
      skinLikePixels += 1;
    }
  }

  const avgLuminance = luminanceSum / totalPixels / 255;
  const avgR = redSum / totalPixels;
  const avgG = greenSum / totalPixels;
  const avgB = blueSum / totalPixels;
  const skinRatio = skinLikePixels / totalPixels;

  const exposureScore = clamp(1 - Math.abs(avgLuminance - 0.54) / 0.54);
  const skinToneScore = clamp(1 - Math.abs(skinRatio - 0.24) / 0.24);
  const warmth = (avgR + 1) / (avgB + 1);
  const warmthScore = clamp(1 - Math.abs(warmth - 1.12) / 1.12);
  const contrastEstimate = clamp(Math.abs(avgLuminance - 0.5) * 2);
  const lightingScore = clamp((exposureScore * 0.7) + (contrastEstimate * 0.3));

  const recommendations: string[] = [];
  if (exposureScore < 0.45) recommendations.push("Increase exposure slightly for cleaner skin highlights.");
  if (lightingScore < 0.45) recommendations.push("Lift shadows for more subject separation.");
  if (skinToneScore < 0.5) recommendations.push("Reduce saturation in oranges to protect skin realism.");
  if (warmthScore < 0.5) recommendations.push("Warm white balance subtly to avoid cold cast.");

  return {
    exposureScore,
    skinToneScore,
    lightingScore,
    contrastScore: contrastEstimate,
    warmthScore,
    recommendations,
  };
}
