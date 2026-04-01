import sharp from "sharp";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const analyzeImage = async (filePath) => {
  const image = sharp(filePath, { failOn: "none" });
  const stats = await image.stats();
  const metadata = await image.metadata();

  const [r, g, b] = stats.channels;
  const brightness = clamp((r.mean + g.mean + b.mean) / (3 * 255), 0, 1);
  const dynamicRange = clamp((r.stdev + g.stdev + b.stdev) / (3 * 128), 0, 1);
  const warmth = clamp((r.mean - b.mean) / 255, -1, 1);
  const skinToneBalance = clamp((r.mean + 0.4 * g.mean - 1.1 * b.mean) / 255, -1, 1);

  let lightingLabel = "balanced";
  if (brightness < 0.33) lightingLabel = "low-light";
  if (brightness > 0.72) lightingLabel = "high-key";

  const exposureHint = clamp(0.5 - brightness, -0.35, 0.35);

  return {
    dimensions: {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    },
    file: {
      format: metadata.format ?? "unknown",
      colorSpace: metadata.space ?? "unknown",
    },
    metrics: {
      brightness,
      dynamicRange,
      warmth,
      skinToneBalance,
    },
    guidance: {
      lightingLabel,
      exposureHint,
    },
    computedAt: new Date().toISOString(),
  };
};
