export type ProcessingStatus = "uploaded" | "processing" | "done" | "failed";

export type ShootCategory =
  | "portrait"
  | "wedding"
  | "studio"
  | "fashion"
  | "event"
  | "product";

export type PresetKey =
  | "mirror-clean"
  | "golden-hour"
  | "cinematic"
  | "editorial"
  | "natural-pop";

export interface ImageQualityMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
  warmth: number;
  skinToneBalance: number;
}

export interface ImageRecord {
  id: string;
  filename: string;
  category: ShootCategory;
  preset: PresetKey;
  retouchIntensity: number;
  status: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
  originalPath: string;
  previewPath: string | null;
  processedPath: string | null;
  error?: string;
  metadata: {
    sizeBytes: number;
    width?: number;
    height?: number;
    mimeType?: string;
  };
  metrics?: ImageQualityMetrics;
}

export interface PipelineOptions {
  preset: PresetKey;
  retouchIntensity: number;
  category: ShootCategory;
}

export interface RealtimeEvent<T = unknown> {
  type:
    | "image:uploaded"
    | "image:processing"
    | "image:done"
    | "image:failed"
    | "settings:updated";
  payload: T;
  timestamp: string;
}

