export type ProcessingStatus = "queued" | "processing" | "done" | "failed";

export interface ExposureAnalysis {
  score: number;
  bucket: "underexposed" | "balanced" | "overexposed";
}

export interface SkinToneAnalysis {
  detected: boolean;
  warmth: number;
  bucket: "cool" | "neutral" | "warm" | "not-detected";
}

export interface LightingAnalysis {
  dynamicRange: number;
  contrast: number;
  bucket: "flat" | "balanced" | "high-contrast";
}

export interface ImageAnalysis {
  exposure: ExposureAnalysis;
  skinTone: SkinToneAnalysis;
  lighting: LightingAnalysis;
}

export interface ImageRecord {
  id: string;
  filename: string;
  originalPath: string;
  previewPath?: string;
  processedPath?: string;
  status: ProcessingStatus;
  preset: string;
  retouchIntensity: number;
  category: string;
  analysis?: ImageAnalysis;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MirrorSettings {
  defaultPreset: string;
  defaultRetouchIntensity: number;
  defaultCategory: string;
}

export interface MirrorDatabaseSchema {
  images: ImageRecord[];
  settings: MirrorSettings;
}

export interface PresetDefinition {
  key: string;
  label: string;
  description: string;
  adjustments: {
    brightness: number;
    saturation: number;
    contrast: number;
    warmth: number;
    sharpen: number;
  };
}

