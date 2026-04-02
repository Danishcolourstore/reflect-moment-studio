export type ProcessingStatus = "queued" | "processing" | "done" | "failed";

export type SourceType = "ftp" | "api" | "manual";

export interface ImageAnalysis {
  exposureScore: number;
  exposureLabel: "underexposed" | "balanced" | "overexposed";
  skinToneWarmth: number;
  lightingContrast: number;
  width: number;
  height: number;
}

export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  adjustments: {
    brightness: number;
    saturation: number;
    contrast: number;
    sharpness: number;
    warmth: number;
  };
}

export interface ImageRecord {
  id: string;
  filename: string;
  source: SourceType;
  createdAt: string;
  updatedAt: string;
  status: ProcessingStatus;
  category: string;
  presetId: string;
  retouchIntensity: number;
  originalPath: string;
  previewPath?: string;
  processedPath?: string;
  error?: string;
  analysis?: ImageAnalysis;
}

export interface ControlState {
  presetId: string;
  retouchIntensity: number;
  category: string;
}

export interface QueueJobPayload {
  imageId: string;
  presetId: string;
  retouchIntensity: number;
  category: string;
}

export interface QueueStatusEvent {
  type: "queued" | "active" | "completed" | "failed";
  imageId: string;
  error?: string;
}

export interface ProcessedResult {
  previewPath: string;
  processedPath: string;
  analysis: ImageAnalysis;
}

export interface PublicImageRecord extends Omit<ImageRecord, "originalPath" | "previewPath" | "processedPath"> {
  originalUrl: string;
  previewUrl?: string;
  processedUrl?: string;
}

export interface WebSocketEvent<T = unknown> {
  event: string;
  data: T;
  at: string;
}
