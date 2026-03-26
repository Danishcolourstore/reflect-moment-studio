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

export interface ImageFiles {
  original: string;
  processed?: string;
  preview?: string;
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
  metadata?: {
    cameraModel?: string;
    focalLength?: string;
    iso?: number;
  };
  analysis?: ImageAnalysis;
  files: ImageFiles;
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

export interface ProcessingJob {
  imageId: string;
}

export interface ControlDefaults {
  presetId: string;
  retouchIntensity: number;
}
