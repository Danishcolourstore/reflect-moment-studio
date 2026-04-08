export type ProcessingStatus = "queued" | "processing" | "done" | "error";

export type ShootCategory = "portrait" | "fashion" | "wedding" | "product" | "street";

export type PresetId = "clean" | "editorial" | "warm-film" | "night-luxury";

export interface ImageAnalysis {
  exposureScore: number;
  exposureState: "under" | "balanced" | "over";
  skinToneScore: number;
  lightingContrast: number;
  width: number;
  height: number;
}

export interface ControlState {
  presetId: PresetId;
  retouchIntensity: number;
  category: ShootCategory;
}

export interface MirrorImage {
  id: string;
  originalFilename: string;
  originalBasename: string;
  originalStoredFilename?: string;
  originalPath: string;
  previewPath: string | null;
  processedPath: string | null;
  status: ProcessingStatus;
  controls: ControlState;
  metadata: {
    width: number;
    height: number;
    bytesOriginal: number;
    bytesPreview: number;
    bytesProcessed: number;
    analysis: ImageAnalysis | null;
  } | null;
  error: string | null;
  createdAt: number;
  processingStartedAt: number | null;
  processingFinishedAt: number | null;
  processedAt: number | null;
  originalUrl: string;
  previewUrl: string | null;
  processedUrl: string | null;
}

export interface MirrorPreset {
  id: PresetId;
  name: string;
  description: string;
}

export interface MirrorStats {
  total: number;
  queued: number;
  processing: number;
  done: number;
  error: number;
}

export type AppEvent =
  | { type: "ready"; payload: { images: MirrorImage[]; controls: ControlState } }
  | { type: "image.received"; payload: { image: MirrorImage } }
  | { type: "image.updated"; payload: { image: MirrorImage } }
  | { type: "control.updated"; payload: { controls: ControlState } };
