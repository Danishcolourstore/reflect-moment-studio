import sharp from "sharp";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const average = (values) => {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, item) => sum + item, 0) / values.length;
};

export const analyzeImage = async (sourcePath) => {
  const sampleBuffer = await sharp(sourcePath)
    .rotate()
    .resize(240, 240, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = sampleBuffer;
  const pixelCount = info.width * info.height;
  if (!pixelCount) {
    return {
      exposureScore: 0.5,
      warmthScore: 0,
      skinToneScore: 0.5,
      highlightsClip: 0,
      shadowsClip: 0,
      suggestedExposure: 0,
      suggestedWarmth: 0,
    };
  }

  let brightnessSum = 0;
  let highlights = 0;
  let shadows = 0;
  const skinCandidates = [];
  const warmthSamples = [];

  for (let index = 0; index < data.length; index += 3) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

    brightnessSum += luminance / 255;

    if (luminance >= 248) {
      highlights += 1;
    }
    if (luminance <= 12) {
      shadows += 1;
    }

    const warmth = (red - blue) / 255;
    warmthSamples.push(warmth);

    const skinLike = red > 78 && green > 40 && blue > 20 && red > blue && red > green * 0.95;
    if (skinLike) {
      const skinLuma = clamp(luminance / 255, 0, 1);
      skinCandidates.push(skinLuma);
    }
  }

  const exposureScore = clamp(brightnessSum / pixelCount, 0, 1);
  const warmthScore = clamp(average(warmthSamples), -1, 1);
  const skinToneScore = clamp(average(skinCandidates) || exposureScore, 0, 1);
  const highlightsClip = clamp(highlights / pixelCount, 0, 1);
  const shadowsClip = clamp(shadows / pixelCount, 0, 1);

  return {
    exposureScore,
    warmthScore,
    skinToneScore,
    highlightsClip,
    shadowsClip,
    suggestedExposure: clamp((0.52 - exposureScore) * 1.4, -0.45, 0.45),
    suggestedWarmth: clamp((0.1 - warmthScore) * 0.5, -0.25, 0.25),
  };
};
