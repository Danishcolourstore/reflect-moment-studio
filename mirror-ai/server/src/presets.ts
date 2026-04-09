import type { PresetDefinition } from "./types";

export const PRESETS: PresetDefinition[] = [
  {
    key: "clean-editorial",
    label: "Clean Editorial",
    description: "Balanced premium look with controlled contrast and neutral skin tones.",
    adjustments: {
      brightness: 1.05,
      saturation: 1.03,
      contrast: 1.07,
      warmth: 0.02,
      sharpen: 1.15,
    },
  },
  {
    key: "golden-hour-luxe",
    label: "Golden Hour Luxe",
    description: "Warm cinematic profile ideal for portraits and lifestyle captures.",
    adjustments: {
      brightness: 1.08,
      saturation: 1.08,
      contrast: 1.02,
      warmth: 0.11,
      sharpen: 1.08,
    },
  },
  {
    key: "high-contrast-fashion",
    label: "High Contrast Fashion",
    description: "Bold shadows and crisp structure for dramatic visual impact.",
    adjustments: {
      brightness: 1.01,
      saturation: 1.04,
      contrast: 1.18,
      warmth: -0.01,
      sharpen: 1.2,
    },
  },
  {
    key: "soft-wedding",
    label: "Soft Wedding",
    description: "Gentle highlight rolloff and flattering skin response.",
    adjustments: {
      brightness: 1.1,
      saturation: 0.97,
      contrast: 0.95,
      warmth: 0.06,
      sharpen: 1.05,
    },
  },
];

export const DEFAULT_PRESET = PRESETS[0].key;

export function getPresetByKey(key: string): PresetDefinition {
  return PRESETS.find((preset) => preset.key === key) ?? PRESETS[0];
}
