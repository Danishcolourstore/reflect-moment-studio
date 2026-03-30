import type { PresetDefinition } from "./types/models.js";

export const PRESETS: PresetDefinition[] = [
  {
    id: "editorial-luxe",
    name: "Editorial Luxe",
    description: "Clean highlights, rich blacks, subtle warm skin.",
    exposure: 0.08,
    contrast: 1.08,
    saturation: 1.03,
    warmth: 1.04,
    highlights: 0.9,
    shadows: 1.08,
    clarity: 1.04,
  },
  {
    id: "wedding-soft",
    name: "Wedding Soft",
    description: "Bright airy wedding style with gentle contrast.",
    exposure: 0.14,
    contrast: 0.95,
    saturation: 1.02,
    warmth: 1.07,
    highlights: 0.85,
    shadows: 1.15,
    clarity: 0.97,
  },
  {
    id: "street-crisp",
    name: "Street Crisp",
    description: "High micro-contrast with cinematic depth.",
    exposure: 0.04,
    contrast: 1.18,
    saturation: 1.06,
    warmth: 0.98,
    highlights: 0.92,
    shadows: 1.02,
    clarity: 1.12,
  },
  {
    id: "portrait-natural",
    name: "Portrait Natural",
    description: "Natural skin-first portrait look, minimal stylization.",
    exposure: 0.1,
    contrast: 1.0,
    saturation: 1.0,
    warmth: 1.05,
    highlights: 0.88,
    shadows: 1.1,
    clarity: 0.95,
  },
];

export function hasPreset(id: string): boolean {
  return PRESETS.some((preset) => preset.id === id);
}

export function getPresetById(id: string): PresetDefinition {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}
