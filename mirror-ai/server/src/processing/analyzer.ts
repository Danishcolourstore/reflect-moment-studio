import sharp from "sharp";
import type { ImageAnalysis } from "../types";

function toBucketExposure(score: number): ImageAnalysis["exposure"]["bucket"] {
  if (score < 0.4) return "underexposed";
  if (score > 0.7) return "overexposed";
  return "balanced";
}

function toSkinBucket(warmth: number): ImageAnalysis["skinTone"]["bucket"] {
  if (warmth < 0.92) return "cool";
  if (warmth > 1.08) return "warm";
  return "neutral";
}

function toLightingBucket(contrast: number): ImageAnalysis["lighting"]["bucket"] {
  if (contrast < 38) return "flat";
  if (contrast > 70) return "high-contrast";
  return "balanced";
}

export async function analyzeImage(filePath: string): Promise<ImageAnalysis> {
  const stats = await sharp(filePath).stats();
  const [r, g, b] = stats.channels;

  const brightness = (r.mean + g.mean + b.mean) / (3 * 255);
  const contrast = (r.stdev + g.stdev + b.stdev) / 3;
  const dynamicRange = Math.max(r.max, g.max, b.max) - Math.min(r.min, g.min, b.min);

  const warmth = (r.mean + 1) / (b.mean + 1);
  const skinDetected = r.mean > g.mean && g.mean > b.mean * 0.75;

  return {
    exposure: {
      score: Number(brightness.toFixed(3)),
      bucket: toBucketExposure(brightness),
    },
    skinTone: {
      detected: skinDetected,
      warmth: Number(warmth.toFixed(3)),
      bucket: skinDetected ? toSkinBucket(warmth) : "not-detected",
    },
    lighting: {
      dynamicRange: Number(dynamicRange.toFixed(2)),
      contrast: Number(contrast.toFixed(2)),
      bucket: toLightingBucket(contrast),
    },
  };
}
