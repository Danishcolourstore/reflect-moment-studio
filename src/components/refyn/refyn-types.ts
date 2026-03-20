export interface GrainState {
  style: 'film' | 'texture' | 'noise';
  strength: number;
  shadowsOnly: boolean;
}

export interface RefynToolValues {
  frequency: number;
  lumina: number;
  sculpt: number;
  ghostLight: number;
  grain: GrainState;
  layerTexture: number;
  layerTone: number;
  outfit: number;
  jewellery: number;
  hair: number;
}

export type RefynToolId = 'frequency' | 'lumina' | 'sculpt' | 'ghostLight' | 'grain' | 'layer' | 'outfit' | 'jewellery' | 'hair';

export const DEFAULT_TOOL_VALUES: RefynToolValues = {
  frequency: 0,
  lumina: 0,
  sculpt: 0,
  ghostLight: 0,
  grain: { style: 'film', strength: 0, shadowsOnly: false },
  layerTexture: 50,
  layerTone: 50,
  outfit: 0,
  jewellery: 0,
  hair: 0,
};

export interface ZoneData {
  skin?: {
    tone?: string;
    lighting?: string;
    areas?: string[];
  };
  outfit?: {
    type?: string;
    fabric?: string;
    color?: string;
    embroidery?: boolean;
  };
  jewellery?: {
    gold?: boolean;
    diamonds?: boolean;
    heavy?: boolean;
  };
  hair?: {
    accessories?: boolean;
    flowers?: boolean;
  };
  background?: {
    type?: string;
    complexity?: string;
  };
}
