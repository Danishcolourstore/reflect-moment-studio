import { supabase } from '@/integrations/supabase/client';
import { readExif } from './exif';
import type { ZoneData } from '@/components/refyn/refyn-types';

export interface ColourAnalysis {
  detected: string;
  zones: ZoneData;
  tools: {
    skin: number;
    glow: number;
    form: number;
    light: number;
    grain: number;
    depth: { texture: number; tone: number };
    outfit: number;
    jewellery: number;
    hair: number;
  };
}

const FALLBACK: ColourAnalysis = {
  detected: 'Portrait detected',
  zones: {},
  tools: {
    skin: 45, glow: 35, form: 30,
    light: 25, grain: 15,
    depth: { texture: 65, tone: 45 },
    outfit: 40, jewellery: 35, hair: 30,
  },
};

export async function analysePhoto(file: File): Promise<ColourAnalysis> {
  try {
    const exif = await readExif(file);

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    const { data, error } = await supabase.functions.invoke('colour-intelligence', {
      body: {
        imageBase64: base64,
        mediaType: file.type || 'image/jpeg',
        exif,
      },
    });

    if (error) {
      console.error('Colour Intelligence error:', error);
      return FALLBACK;
    }

    const tools = data?.tools;
    if (!tools) return FALLBACK;

    return {
      detected: data.detected || FALLBACK.detected,
      zones: data.zones || {},
      tools: {
        skin: clamp(tools.skin ?? 45, 0, 68),
        glow: clamp(tools.glow ?? 35, 0, 100),
        form: clamp(tools.form ?? 30, 0, 100),
        light: clamp(tools.light ?? 25, 0, 100),
        grain: clamp(tools.grain ?? 15, 0, 100),
        depth: {
          texture: clamp(tools.depth?.texture ?? 65, 55, 75),
          tone: clamp(tools.depth?.tone ?? 45, 0, 100),
        },
        outfit: clamp(tools.outfit ?? 40, 0, 100),
        jewellery: clamp(tools.jewellery ?? 35, 0, 100),
        hair: clamp(tools.hair ?? 30, 0, 100),
      },
    };
  } catch (err) {
    console.error('analysePhoto failed:', err);
    return FALLBACK;
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}
