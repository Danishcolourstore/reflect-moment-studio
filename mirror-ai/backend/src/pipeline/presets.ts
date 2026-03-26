import { PresetDefinition } from '../types/models.js';

export const PRESETS: PresetDefinition[] = [
  {
    id: 'mirror-natural',
    name: 'Mirror Natural',
    description: 'Balanced skin-first preset with subtle dynamic range lift.',
    adjustments: {
      exposure: 0.06,
      contrast: 0.08,
      saturation: 0.04,
      warmth: 0.02,
      sharpness: 0.7,
    },
  },
  {
    id: 'editorial-luxe',
    name: 'Editorial Luxe',
    description: 'Fashion-forward crisp tones with rich contrast.',
    adjustments: {
      exposure: 0.03,
      contrast: 0.16,
      saturation: 0.06,
      warmth: -0.01,
      sharpness: 1.15,
    },
  },
  {
    id: 'golden-hour-glow',
    name: 'Golden Hour Glow',
    description: 'Warm romantic highlight roll-off and smooth skin rendering.',
    adjustments: {
      exposure: 0.09,
      contrast: 0.05,
      saturation: 0.08,
      warmth: 0.08,
      sharpness: 0.6,
    },
  },
  {
    id: 'noir-mono',
    name: 'Noir Mono',
    description: 'High-fidelity monochrome with rich micro-contrast.',
    adjustments: {
      exposure: 0.02,
      contrast: 0.18,
      saturation: -1,
      warmth: 0,
      sharpness: 1.1,
      monochrome: true,
    },
  },
];

export const presetById = (id: string): PresetDefinition | undefined => PRESETS.find((preset) => preset.id === id);
