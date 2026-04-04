import type { PresetDefinition, PresetId } from "../types.js";

export const presets: PresetDefinition[] = [
  {
    id: "editorial",
    name: "Editorial",
    description: "Balanced contrast, subtle warmth, crisp details.",
    brightness: 1.05,
    saturation: 1.07,
    contrast: 1.08,
    warmth: 6,
    sharpen: 1.1,
  },
  {
    id: "portrait-natural",
    name: "Portrait Natural",
    description: "Soft skin rendering and color-stable output.",
    brightness: 1.03,
    saturation: 1.02,
    contrast: 1.03,
    warmth: 4,
    sharpen: 1.03,
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Moody contrast with reduced saturation and micro-sharpness.",
    brightness: 0.98,
    saturation: 0.92,
    contrast: 1.16,
    warmth: -3,
    sharpen: 1.2,
  },
  {
    id: "night-glow",
    name: "Night Glow",
    description: "Lift shadows in low light with gentle highlights.",
    brightness: 1.12,
    saturation: 1.03,
    contrast: 0.95,
    warmth: 8,
    sharpen: 1.05,
  },
  {
    id: "wedding-luxe",
    name: "Wedding Luxe",
    description: "Bright, polished finish with skin-safe tonal shifts.",
    brightness: 1.08,
    saturation: 1.08,
    contrast: 1.05,
    warmth: 10,
    sharpen: 1.08,
  },
  {
    id: "sport-crisp",
    name: "Sport Crisp",
    description: "High edge clarity and punchy dynamic contrast.",
    brightness: 1.02,
    saturation: 1.12,
    contrast: 1.22,
    warmth: 2,
    sharpen: 1.3,
  },
];

const presetMap = new Map<PresetId, PresetDefinition>(presets.map((preset) => [preset.id, preset]));

export const getPreset = (presetId: PresetId): PresetDefinition => {
  const preset = presetMap.get(presetId);
  if (!preset) {
    return presetMap.get("editorial")!;
  }
  return preset;
};
