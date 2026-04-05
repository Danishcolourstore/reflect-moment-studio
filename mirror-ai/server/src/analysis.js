import sharp from "sharp";
import { clamp } from "./utils.js";

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export async function analyzeImageMetrics(buffer) {
  const stats = await sharp(buffer).stats();
  const channels = stats.channels || [];
  const r = channels[0]?.mean ?? 0;
  const g = channels[1]?.mean ?? 0;
  const b = channels[2]?.mean ?? 0;

  const luma = luminance(r, g, b);
  const normalized = clamp(luma / 255, 0, 1);
  const dynamicRange = clamp(
    ((channels[0]?.stdev ?? 0) + (channels[1]?.stdev ?? 0) + (channels[2]?.stdev ?? 0)) / (3 * 128),
    0,
    1,
  );

  const skinWarmth = clamp((r - b) / 255, -1, 1);
  const skinBalance = clamp(((r + g) / 2 - b) / 255, -1, 1);

  return {
    exposure: {
      normalized: Number(normalized.toFixed(4)),
      deltaToMid: Number((normalized - 0.5).toFixed(4)),
      score: Number((1 - Math.abs(normalized - 0.5) * 2).toFixed(4)),
      averageRgb: [Math.round(r), Math.round(g), Math.round(b)],
    },
    lighting: {
      dynamicRange: Number(dynamicRange.toFixed(4)),
      score: Number((1 - dynamicRange).toFixed(4)),
    },
    skin: {
      warmth: Number(skinWarmth.toFixed(4)),
      deltaWarmth: Number((skinWarmth - 0.12).toFixed(4)),
      score: Number((1 - Math.min(1, Math.abs(skinBalance - 0.12) * 2.6)).toFixed(4)),
    },
  };
}

export async function analyzeImageBuffer(buffer) {
  const metrics = await analyzeImageMetrics(buffer);
  return {
    exposure: {
      score: metrics.exposure.score,
      deltaToMidGrey: metrics.exposure.deltaToMid,
      averageRgb: metrics.exposure.averageRgb,
    },
    skin: {
      score: metrics.skin.score,
      warmth: metrics.skin.warmth,
      deltaToNeutral: metrics.skin.deltaWarmth,
    },
    lighting: {
      score: metrics.lighting.score,
    },
  };
}

