import sharp from "sharp";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildSharpAdjustments = ({ analysis, preset, retouchIntensity }) => {
  const exposureScore = analysis?.metrics?.brightness ?? 0.5;
  const skinToneWarmth = analysis?.metrics?.skinToneBalance ?? 0;
  const lightingDirectionConfidence = analysis?.metrics?.dynamicRange ?? 0.5;

  const exposureDelta = (exposureScore - 0.5) * -0.8 + preset.exposureBias;
  const brightness = clamp(1 + exposureDelta, 0.75, 1.35);
  const saturation = clamp(preset.saturation + skinToneWarmth * 0.08, 0.75, 1.35);
  const lightness = clamp(lightingDirectionConfidence * 0.03, -0.03, 0.08);

  return {
    modulate: {
      brightness,
      saturation,
      hue: clamp(preset.warmthBias * 10, -8, 8),
      lightness,
    },
    linear: {
      a: clamp(preset.contrast, 0.85, 1.35),
      b: clamp(exposureDelta * 14, -18, 22),
    },
    retouchSigma: clamp(0.05 + retouchIntensity * 1.0, 0.05, 1.2),
    sharpenSigma: clamp(preset.sharpnessSigma, 0.2, 1.5),
  };
};

export const processImage = async ({
  inputPath,
  previewPath,
  processedPath,
  analysis,
  preset,
  retouchIntensity,
  previewMaxWidth,
}) => {
  const adjustments = buildSharpAdjustments({ analysis, preset, retouchIntensity });

  const outputPipeline = sharp(inputPath, { failOn: "none" })
    .rotate()
    .modulate(adjustments.modulate)
    .linear(adjustments.linear.a, adjustments.linear.b)
    .blur(adjustments.retouchSigma)
    .sharpen({ sigma: adjustments.sharpenSigma })
    .withMetadata();

  await outputPipeline.clone().toFile(processedPath);
  await outputPipeline
    .clone()
    .resize({
      width: previewMaxWidth,
      withoutEnlargement: true,
      fit: "inside",
    })
    .toFile(previewPath);

  return {
    adjustments,
    output: {
      previewPath,
      processedPath,
    },
  };
};
