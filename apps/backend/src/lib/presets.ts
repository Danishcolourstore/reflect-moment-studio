import type { PresetDefinition, PresetId } from "../types.js";

const PRESETS: PresetDefinition[] = [
  {
    id: "clean",
    name: "Clean",
    description: "Neutral highlights and true skin tones.",
    settings: { brightness: 1.02, saturation: 1.0, contrast: 1.04, hue: 0, sharpen: 1.1 },
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Soft premium contrast with subtle desaturation.",
    settings: { brightness: 1.0, saturation: 0.95, contrast: 1.08, hue: -2, sharpen: 1.2 },
  },
  {
    id: "warm-film",
    name: "Warm Film",
    description: "Filmic warmth and gentle glow for portraits.",
    settings: { brightness: 1.03, saturation: 1.05, contrast: 1.06, hue: 4, sharpen: 1.0 },
  },
  {
    id: "night-luxury",
    name: "Night Luxury",
    description: "Deep blacks with selective exposure lift.",
    settings: { brightness: 0.99, saturation: 0.92, contrast: 1.12, hue: -4, sharpen: 1.35 },
  },
];

export function listPresets(): PresetDefinition[] {
  return PRESETS;
}

export function getPresetById(id: PresetId): PresetDefinition {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}

export const defaultPreset = PRESETS[0];
export type { PresetId };
