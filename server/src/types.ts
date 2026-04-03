export type ImageStatus = "queued" | "processing" | "done" | "failed";

export type ShootCategory =
  | "portrait"
  | "wedding"
  | "fashion"
  | "product"
  | "editorial"
  | "event"
  | "lifestyle";

export interface AnalysisReport {
  exposureScore: number;
  exposure: "underexposed" | "balanced" | "overexposed";
  lighting: "flat" | "balanced" | "high-contrast";
  skinTone: "cool" | "neutral" | "warm";
  dimensions: {
    width: number;
    height: number;
  };
}

export interface PresetSettings {
  exposureBoost: number;
  contrastBoost: number;
  saturationBoost: number;
  warmthShift: number;
  skinToneBalance: number;
  retouchIntensity: number;
}

export interface ProcessingPreset {
  id: string;
  name: string;
  description: string;
  settings: PresetSettings;
}

export interface ImageMetadata {
  from: "ftp" | "api";
  originalName: string;
  fileSize?: number;
}

export interface ImageRecord {
  id: string;
  fileName: string;
  sourcePath: string;
  originalPath: string;
  originalUrl: string;
  previewPath?: string;
  fullPath?: string;
  previewUrl?: string;
  fullUrl?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  status: ImageStatus;
  statusMessage?: string;
  presetId: string;
  retouchIntensity: number;
  shootCategory: ShootCategory;
  analysis?: AnalysisReport;
  metadata: ImageMetadata;
}

export interface RuntimeSettings {
  activePresetId: string;
  retouchIntensity: number;
  category: ShootCategory;
}

export interface QueuePayload {
  imageId: string;
  originalPath: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface BatchApplyPayload {
  imageIds: string[];
  activePresetId?: string;
  retouchIntensity?: number;
  category?: ShootCategory;
}

export type WsEvent =
  | { type: "system:connected"; payload: { connected: true; ts: number } }
  | { type: "image:created"; payload: ImageRecord }
  | { type: "image:updated"; payload: ImageRecord }
  | { type: "control:updated"; payload: RuntimeSettings }
  | { type: "queue:stats"; payload: QueueStats }
  | {
      type: "batch:started";
      payload: { imageIds: string[]; appliedPresetId?: string; retouchIntensity?: number; category?: ShootCategory };
    };
