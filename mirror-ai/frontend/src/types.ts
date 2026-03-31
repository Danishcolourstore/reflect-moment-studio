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
  originalUrl: string | null;
  previewUrl: string | null;
  processedUrl: string | null;
  error?: string;
  metadata: {
    sizeBytes: number;
    width?: number;
    height?: number;
    mimeType?: string;
  };
}

export interface Preset {
  key: PresetKey;
  name: string;
  description: string;
}

export interface Settings {
  preset: PresetKey;
  retouchIntensity: number;
  category: ShootCategory;
}
