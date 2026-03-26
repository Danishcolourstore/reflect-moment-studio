export type ProcessingStatus = 'queued' | 'processing' | 'done' | 'error';

export type ShootCategory =
  | 'wedding'
  | 'portrait'
  | 'fashion'
  | 'event'
  | 'commercial'
  | 'other';

export interface ImageAnalysis {
  exposureScore: number;
  contrastScore: number;
  skinToneScore: number;
  lightingLabel: 'underexposed' | 'balanced' | 'overexposed';
}

export interface ImageRecord {
  id: string;
  filename: string;
  category: ShootCategory;
  status: ProcessingStatus;
  presetId: string;
  retouchIntensity: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
  width?: number;
  height?: number;
  analysis?: ImageAnalysis;
  files: {
    original: string;
    preview?: string;
    processed?: string;
  };
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  adjustments: {
    exposure: number;
    contrast: number;
    saturation: number;
    warmth: number;
    sharpness: number;
    monochrome?: boolean;
  };
}

export interface ControlDefaults {
  presetId: string;
  retouchIntensity: number;
}

export interface RealtimeEvent<T = unknown> {
  type: 'image:new' | 'image:processing' | 'image:done' | 'image:error' | 'control:updated' | 'system:welcome';
  payload: T;
  timestamp: string;
}
