export type MirrorProcessingStatus = "queued" | "processing" | "done" | "error";

export interface MirrorImageAnalysis {
  exposureScore: number;
  skinToneScore: number;
  lightingScore: number;
  contrastScore: number;
  warmthScore: number;
  recommendations: string[];
}

export interface MirrorImage {
  id: string;
  fileName: string;
  originalUrl: string;
  previewUrl?: string;
  fullUrl?: string;
  source: "ftp" | "api" | "filesystem";
  status: MirrorProcessingStatus;
  shootCategory: string;
  presetId: string;
  retouchIntensity: number;
  analysis?: MirrorImageAnalysis;
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

export interface MirrorPreset {
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

export interface MirrorWsMessage<T = unknown> {
  type: "image.updated" | "control.updated";
  payload: T;
}
