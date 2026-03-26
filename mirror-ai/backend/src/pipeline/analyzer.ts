import sharp from 'sharp';
import { ImageAnalysis } from '../types/models.js';

const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

export const analyzeImage = async (filePath: string): Promise<ImageAnalysis> => {
  const stats = await sharp(filePath).stats();
  const [r, g, b] = stats.channels;

  const meanBrightness = (r.mean + g.mean + b.mean) / (255 * 3);
  const contrast = (r.stdev + g.stdev + b.stdev) / (255 * 3);

  // Lightweight skin-likelihood heuristic from RGB channel balance.
  const skinRaw = (r.mean - b.mean) / 255 + (g.mean / 255) * 0.4;
  const skinToneScore = clamp(skinRaw / 1.2);

  let lightingLabel: ImageAnalysis['lightingLabel'] = 'balanced';
  if (meanBrightness < 0.35) lightingLabel = 'underexposed';
  if (meanBrightness > 0.78) lightingLabel = 'overexposed';

  return {
    exposureScore: clamp(meanBrightness),
    contrastScore: clamp(contrast),
    skinToneScore,
    lightingLabel,
  };
};
