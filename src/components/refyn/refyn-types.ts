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
}

export type RefynToolId = 'frequency' | 'lumina' | 'sculpt' | 'ghostLight' | 'grain' | 'layer';

export const DEFAULT_TOOL_VALUES: RefynToolValues = {
  frequency: 0,
  lumina: 0,
  sculpt: 0,
  ghostLight: 0,
  grain: { style: 'film', strength: 0, shadowsOnly: false },
  layerTexture: 50,
  layerTone: 50,
};
