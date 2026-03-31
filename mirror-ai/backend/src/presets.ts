import type { ImageQualityMetrics, PipelineOptions, PresetKey } from "./types.js";

export interface PresetDefinition {
  key: PresetKey;
  name: string;
  description: string;
  adjustments: {
    brightness: number;
    saturation: number;
    hue: number;
    contrast: number;
    sharpenSigma: number;
  };
}

const presetCatalog: Record<PresetKey, PresetDefinition> = {
  "mirror-clean": {
    key: "mirror-clean",
    name: "Mirror Clean",
    description: "Neutral polished look with balanced skin tones.",
    adjustments: {
      brightness: 1.04,
      saturation: 1.02,
      hue: 0,
      contrast: 1.05,
      sharpenSigma: 0.75,
    },
  },
  "golden-hour": {
    key: "golden-hour",
    name: "Golden Hour",
    description: "Warm highlights and soft shadows for sunset portraits.",
    adjustments: {
      brightness: 1.08,
      saturation: 1.08,
      hue: 6,
      contrast: 1.04,
      sharpenSigma: 0.65,
    },
  },
  cinematic: {
    key: "cinematic",
    name: "Cinematic",
    description: "Cooler tones with richer contrast for narrative mood.",
    adjustments: {
      brightness: 1.0,
      saturation: 0.96,
      hue: -4,
      contrast: 1.12,
      sharpenSigma: 0.8,
    },
  },
  editorial: {
    key: "editorial",
    name: "Editorial",
    description: "High-end magazine style with clarity and soft lift.",
    adjustments: {
      brightness: 1.03,
      saturation: 1.01,
      hue: 1,
      contrast: 1.09,
      sharpenSigma: 0.9,
    },
  },
  "natural-pop": {
    key: "natural-pop",
    name: "Natural Pop",
    description: "True-to-life tones with subtle, vibrant presence.",
    adjustments: {
      brightness: 1.05,
      saturation: 1.1,
      hue: 0,
      contrast: 1.06,
      sharpenSigma: 0.7,
    },
  },
};

export function listPresets() {
  return Object.values(presetCatalog);
}

export function getPreset(key: PresetKey) {
  return presetCatalog[key];
}

export function getAdaptiveAdjustments(
  options: PipelineOptions,
  metrics: ImageQualityMetrics,
) {
  const preset = getPreset(options.preset);
  const exposureCorrection = metrics.brightness < 0.42 ? 1.1 : metrics.brightness > 0.64 ? 0.95 : 1;
  const warmthCorrection = metrics.warmth < 0.46 ? 2 : metrics.warmth > 0.58 ? -2 : 0;
  const skinBalanceCorrection =
    metrics.skinToneBalance < 0.44 ? 1.03 : metrics.skinToneBalance > 0.62 ? 0.97 : 1;

  return {
    brightness: preset.adjustments.brightness * exposureCorrection,
    saturation: preset.adjustments.saturation * skinBalanceCorrection,
    hue: preset.adjustments.hue + warmthCorrection,
    contrast: preset.adjustments.contrast,
    sharpenSigma: preset.adjustments.sharpenSigma,
  };
}
