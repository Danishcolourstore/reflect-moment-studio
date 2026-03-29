import type { Preset } from "./types.js";

export const defaultPresets: Preset[] = [
  {
    id: "clean-natural",
    name: "Clean Natural",
    description: "Balanced exposure with natural skin tones and mild contrast.",
    exposure: 0.08,
    contrast: 1.04,
    saturation: 1.03,
    warmth: 1.02,
    skinToneLift: 0.08,
    highlightRecovery: 0.12,
  },
  {
    id: "editorial-soft",
    name: "Editorial Soft",
    description: "Luxury editorial softness with delicate highlight roll-off.",
    exposure: 0.14,
    contrast: 0.96,
    saturation: 0.95,
    warmth: 1.06,
    skinToneLift: 0.12,
    highlightRecovery: 0.2,
  },
  {
    id: "cinematic-bold",
    name: "Cinematic Bold",
    description: "Dramatic contrast and rich tones for impactful scenes.",
    exposure: 0.02,
    contrast: 1.16,
    saturation: 1.08,
    warmth: 0.98,
    skinToneLift: 0.05,
    highlightRecovery: 0.1,
  },
  {
    id: "wedding-luxe",
    name: "Wedding Luxe",
    description: "Clean whites, warm skin and gentle contrast for weddings.",
    exposure: 0.12,
    contrast: 1.01,
    saturation: 1.02,
    warmth: 1.08,
    skinToneLift: 0.14,
    highlightRecovery: 0.24,
  },
];

export const presets = defaultPresets;
