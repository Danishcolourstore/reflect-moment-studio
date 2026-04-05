export const PRESETS = [
  {
    id: "editorial-balanced",
    name: "Editorial Balanced",
    description: "Clean highlights, neutral skin, and refined contrast.",
    params: {
      exposureShift: 0.05,
      contrast: 1.05,
      saturation: 1.03,
      warmth: 0.01,
      vibrance: 0.04,
      highlightCompression: 0.22,
      shadowLift: 0.08,
      sharpness: 0.45,
    },
  },
  {
    id: "warm-luxe",
    name: "Warm Luxe",
    description: "Golden warmth with soft shadows for weddings and portraits.",
    params: {
      exposureShift: 0.08,
      contrast: 1.02,
      saturation: 1.08,
      warmth: 0.09,
      vibrance: 0.05,
      highlightCompression: 0.25,
      shadowLift: 0.1,
      sharpness: 0.34,
    },
  },
  {
    id: "clean-commercial",
    name: "Clean Commercial",
    description: "Neutral, crisp style for products and campaigns.",
    params: {
      exposureShift: 0.03,
      contrast: 1.08,
      saturation: 1.01,
      warmth: 0.0,
      vibrance: 0.03,
      highlightCompression: 0.2,
      shadowLift: 0.06,
      sharpness: 0.55,
    },
  },
  {
    id: "night-modern",
    name: "Night Modern",
    description: "Low-light friendly contrast and controlled color depth.",
    params: {
      exposureShift: 0.16,
      contrast: 1.03,
      saturation: 0.95,
      warmth: 0.02,
      vibrance: 0.02,
      highlightCompression: 0.3,
      shadowLift: 0.18,
      sharpness: 0.3,
    },
  },
];

export const CATEGORY_OPTIONS = [
  "portrait",
  "wedding",
  "fashion",
  "street",
  "studio",
  "commercial",
  "event",
  "lifestyle",
];

export const DEFAULT_PRESET_ID = PRESETS[0].id;
export const DEFAULT_CATEGORY = CATEGORY_OPTIONS[0];
export const DEFAULT_RETOUCH_INTENSITY = 0.45;

export function getPresetById(id) {
  return PRESETS.find((preset) => preset.id === id) || PRESETS[0];
}
