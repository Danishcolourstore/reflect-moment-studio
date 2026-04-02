import type { PresetDefinition } from "../types/domain.js";

export const presets: PresetDefinition[] = [
  {
    id: "clean-luxe",
    name: "Clean Luxe",
    description: "Premium clean contrast with subtle warmth.",
    category: "wedding",
    adjustments: {
      brightness: 0.08,
      saturation: 0.06,
      contrast: 0.12,
      sharpness: 0.24,
      warmth: 0.05,
    },
  },
  {
    id: "soft-editorial",
    name: "Soft Editorial",
    description: "Natural airy tones with gentle highlights.",
    category: "fashion",
    adjustments: {
      brightness: 0.12,
      saturation: -0.06,
      contrast: -0.05,
      sharpness: 0.18,
      warmth: 0.03,
    },
  },
  {
    id: "cinematic-night",
    name: "Cinematic Night",
    description: "Deep cinematic contrast for low light scenes.",
    category: "event",
    adjustments: {
      brightness: 0.03,
      saturation: 0.04,
      contrast: 0.2,
      sharpness: 0.28,
      warmth: -0.02,
    },
  },
  {
    id: "vivid-commercial",
    name: "Vivid Commercial",
    description: "Punchy detail and controlled vivid colors.",
    category: "commercial",
    adjustments: {
      brightness: 0.06,
      saturation: 0.18,
      contrast: 0.15,
      sharpness: 0.3,
      warmth: 0.01,
    },
  },
  {
    id: "skin-natural",
    name: "Skin Natural",
    description: "Natural portrait retouch with skin-safe tones.",
    category: "portrait",
    adjustments: {
      brightness: 0.09,
      saturation: 0.03,
      contrast: 0.07,
      sharpness: 0.15,
      warmth: 0.06,
    },
  },
];

export const defaultPresetId = "editorial-clean";
