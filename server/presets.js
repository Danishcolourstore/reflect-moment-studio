export const BUILTIN_PRESETS = [
  {
    id: "natural-luxe",
    name: "Natural Luxe",
    description: "Balanced skin tone and contrast with subtle warmth.",
    config: {
      exposure: 0.06,
      contrast: 0.1,
      saturation: 0.05,
      warmth: 0.04,
      highlights: -0.08,
      shadows: 0.1,
      clarity: 0.12,
    },
  },
  {
    id: "editorial-cool",
    name: "Editorial Cool",
    description: "Soft highlights with modern cool-neutral finish.",
    config: {
      exposure: 0.03,
      contrast: 0.06,
      saturation: -0.03,
      warmth: -0.05,
      highlights: -0.12,
      shadows: 0.09,
      clarity: 0.08,
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warm cinematic light for portraits and wedding scenes.",
    config: {
      exposure: 0.09,
      contrast: 0.08,
      saturation: 0.08,
      warmth: 0.12,
      highlights: -0.1,
      shadows: 0.12,
      clarity: 0.1,
    },
  },
  {
    id: "clean-commercial",
    name: "Clean Commercial",
    description: "Neutral and crisp with reliable skin rendering.",
    config: {
      exposure: 0.04,
      contrast: 0.12,
      saturation: 0.01,
      warmth: 0,
      highlights: -0.05,
      shadows: 0.06,
      clarity: 0.16,
    },
  },
];

export const DEFAULT_PRESET_ID = BUILTIN_PRESETS[0].id;

export function getPresetById(id) {
  return BUILTIN_PRESETS.find((preset) => preset.id === id) ?? BUILTIN_PRESETS[0];
}

export const SHOOT_CATEGORIES = [
  "portrait",
  "fashion",
  "wedding",
  "commercial",
  "lifestyle",
  "event",
  "general",
];
