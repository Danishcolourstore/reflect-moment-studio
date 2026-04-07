const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const mapExposureToBrightness = (exposure) => clamp(Math.round(exposure * 78), -55, 55);
const mapWarmthToTint = (warmth) => ({
  red: clamp(1 + warmth * 0.08, 0.85, 1.2),
  blue: clamp(1 - warmth * 0.08, 0.85, 1.2),
});

export const buildAdjustments = ({
  preset,
  controls,
  analysis,
  overridePreset,
  overrideRetouchIntensity,
}) => {
  const resolvedPreset = overridePreset ?? preset;
  const retouchIntensity = clamp(
    overrideRetouchIntensity ?? controls.retouchIntensity ?? resolvedPreset.skinSoftening ?? 0,
    0,
    1,
  );

  const exposure = (resolvedPreset.exposure ?? 0) + (analysis.suggestedExposure ?? 0);
  const warmth = (resolvedPreset.warmth ?? 0) + (analysis.suggestedWarmth ?? 0);
  const saturation = resolvedPreset.saturation ?? 1;
  const contrast = resolvedPreset.contrast ?? 1;
  const shadowsLift = resolvedPreset.shadowsLift ?? 0;
  const grain = resolvedPreset.grain ?? 0;

  return {
    presetId: resolvedPreset.id,
    presetLabel: resolvedPreset.label,
    retouchIntensity,
    color: {
      brightness: mapExposureToBrightness(exposure),
      saturation: clamp(saturation, 0.75, 1.3),
      contrast: clamp(contrast, 0.75, 1.45),
      tint: mapWarmthToTint(clamp(warmth, -0.5, 0.5)),
      gamma: clamp(1 + shadowsLift * 0.12, 0.92, 1.2),
    },
    texture: {
      sharpenSigma: clamp(0.2 + (1 - retouchIntensity) * 0.7, 0.1, 1.2),
      sharpenM1: 0.8,
      sharpenM2: 1.2,
      smoothSigma: clamp(0.35 + retouchIntensity * 1.8, 0.35, 2.2),
      smoothM1: clamp(0.8 + retouchIntensity * 1.1, 0.8, 2.3),
      smoothM2: clamp(1 + retouchIntensity * 1.7, 1, 2.8),
      grain,
    },
  };
};
