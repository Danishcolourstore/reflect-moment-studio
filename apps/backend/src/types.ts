export type ProcessingStatus = "queued" | "processing" | "done" | "error";

export type ShootCategory = "portrait" | "fashion" | "wedding" | "product" | "street";

export type PresetId = "clean" | "editorial" | "warm-film" | "night-luxury";

export interface PresetDefinition {
  id: PresetId;
  name: string;
  description: string;
  settings: {
    brightness: number;
    saturation: number;
    contrast: number;
    hue: number;
    sharpen: number;
  };
}

export interface ImageAnalysis {
  exposureScore: number;
  exposureState: "under" | "balanced" | "over";
  skinToneScore: number;
  lightingContrast: number;
  width: number;
  height: number;
}

export interface ImageControls {
  presetId: PresetId;
  retouchIntensity: number;
  category: ShootCategory;
}

export interface ImageMetadata {
  width: number;
  height: number;
  bytesOriginal: number;
  bytesPreview: number;
  bytesProcessed: number;
  analysis: ImageAnalysis | null;
}

export interface ImageRecord {
  id: string;
  originalFilename: string;
  originalBasename: string;
  originalStoredFilename: string;
  originalPath: string;
  previewPath: string | null;
  processedPath: string | null;
  status: ProcessingStatus;
  controls: ImageControls;
  metadata: ImageMetadata | null;
  error: string | null;
  createdAt: number;
  processingStartedAt: number | null;
  processingFinishedAt: number | null;
  processedAt: number | null;
}

export interface ControlState {
  presetId: PresetId;
  retouchIntensity: number;
  category: ShootCategory;
}

export type AppEvent =
  | { type: "ready"; payload: { images: ImageRecord[]; controls: ControlState } }
  | { type: "image.received"; payload: { image: ImageRecord } }
  | { type: "image.updated"; payload: { image: ImageRecord } }
  | { type: "control.updated"; payload: { controls: ControlState } };
