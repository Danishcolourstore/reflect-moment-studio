export type ImageStatus = "queued" | "processing" | "done" | "failed";

export type PresetId =
  | "editorial"
  | "portrait-natural"
  | "cinematic"
  | "night-glow"
  | "wedding-luxe"
  | "sport-crisp";

export interface PresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  brightness: number;
  saturation: number;
  contrast: number;
  warmth: number;
  sharpen: number;
}

export interface ImageAnalysis {
  width: number;
  height: number;
  format: string;
  exposureScore: number;
  contrastScore: number;
  skinToneScore: number;
  lighting: "low" | "balanced" | "bright";
}

export interface ImageRecord {
  id: string;
  fileName: string;
  category: string;
  status: ImageStatus;
  preset: PresetId;
  retouchIntensity: number;
  originalPath: string;
  previewPath?: string;
  fullPath?: string;
  thumbnailPath?: string;
  analysis?: ImageAnalysis;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicImageRecord
  extends Omit<ImageRecord, "originalPath" | "previewPath" | "fullPath" | "thumbnailPath"> {
  originalUrl: string;
  previewUrl?: string;
  fullUrl?: string;
  thumbnailUrl?: string;
}

export interface ControlState {
  defaultPreset: PresetId;
  defaultRetouchIntensity: number;
  defaultCategory: string;
  updatedAt: string;
}

export interface MirrorState {
  images: Record<string, ImageRecord>;
  imageOrder: string[];
  controls: ControlState;
  presets: PresetDefinition[];
}

export interface ProcessingJobData {
  imageId: string;
  forcePreset?: PresetId;
  forceRetouchIntensity?: number;
  reason?: "ingest" | "batch-update" | "manual";
}

export interface WsEvent<T = unknown> {
  type:
    | "snapshot"
    | "image:queued"
    | "image:processing"
    | "image:done"
    | "image:failed"
    | "image:updated"
    | "controls:updated";
  payload: T;
  timestamp: string;
}
