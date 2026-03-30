export type ProcessingStatus = "queued" | "processing" | "done" | "error";

export interface ImageAnalysis {
  exposureScore: number;
  skinToneScore: number;
  lightingScore: number;
  contrastScore: number;
  warmthScore: number;
  recommendations: string[];
}

export interface ImageRecord {
  id: string;
  fileName: string;
  originalPath: string;
  originalUrl: string;
  previewPath?: string;
  previewUrl?: string;
  fullPath?: string;
  fullUrl?: string;
  source: "ftp" | "api" | "filesystem";
  status: ProcessingStatus;
  shootCategory: string;
  presetId: string;
  retouchIntensity: number;
  analysis?: ImageAnalysis;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MirrorControlState {
  activePresetId: string;
  retouchIntensity: number;
  shootCategory: string;
  updatedAt: string;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  exposure: number;
  contrast: number;
  saturation: number;
  warmth: number;
  highlights: number;
  shadows: number;
  clarity: number;
}

export interface MirrorDatabase {
  images: ImageRecord[];
  control: MirrorControlState;
}

export interface ImageFilter {
  limit?: number;
  status?: ProcessingStatus;
  category?: string;
}

export interface ProcessJobPayload {
  imageId: string;
  requestedAt: string;
}
