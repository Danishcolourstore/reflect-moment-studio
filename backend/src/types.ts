export type ProcessingStatus = "queued" | "processing" | "done" | "error";
export type ShootCategory = "wedding" | "portrait" | "fashion" | "commercial" | "event";

export interface Preset {
  id: string;
  name: string;
  description: string;
  exposure: number;
  contrast: number;
  saturation: number;
  warmth: number;
  skinToneLift: number;
  highlightRecovery: number;
}

export interface RuntimeSettings {
  activePresetId: string;
  retouchIntensity: number;
  activeCategory: ShootCategory;
}

export interface ImageQualityMetrics {
  brightness: number;
  contrast: number;
  skinToneConfidence: number;
  warmth: number;
  dynamicRange: number;
}

export interface ProcessingMetadata {
  presetId: string;
  retouchIntensity: number;
  qualityMetrics: ImageQualityMetrics;
  sourceSizeBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  processingMs: number;
}

export interface ImageRecord {
  id: string;
  fileName: string;
  category: ShootCategory;
  status: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
  originalPath: string;
  previewPath?: string;
  processedPath?: string;
  metadata?: ProcessingMetadata;
  error?: string;
}

export interface BatchOperation {
  id: string;
  imageIds: string[];
  presetId: string;
  retouchIntensity: number;
  status: "pending" | "running" | "done" | "error";
  total: number;
  completed: number;
  createdAt: string;
  updatedAt: string;
}

export interface MirrorSnapshot {
  images: ImageRecord[];
  presets: Preset[];
  settings: RuntimeSettings;
  batches: BatchOperation[];
}
