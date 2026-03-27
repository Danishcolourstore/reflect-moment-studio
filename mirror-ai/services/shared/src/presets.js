export const PRESETS = Object.freeze([
  {
    id: "clean-natural",
    name: "Clean Natural",
    description: "Balanced contrast, natural skin, editorial-safe.",
    tuning: {
      brightness: 1.03,
      saturation: 1.05,
      sharpen: 0.6,
      warmth: 1.02,
      contrast: 1.05,
    },
  },
  {
    id: "golden-hour-luxe",
    name: "Golden Hour Luxe",
    description: "Warm highlights and elegant contrast for portraits.",
    tuning: {
      brightness: 1.08,
      saturation: 1.08,
      sharpen: 0.5,
      warmth: 1.08,
      contrast: 1.1,
    },
  },
  {
    id: "crisp-monochrome",
    name: "Crisp Monochrome",
    description: "Classic black-and-white with punchy mid-tones.",
    tuning: {
      grayscale: true,
      brightness: 1.02,
      contrast: 1.14,
      sharpen: 0.7,
    },
  },
]);

export function getPresetById(id) {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}
