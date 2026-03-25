export type ProcessingStatus = "queued" | "processing" | "done" | "error";

export type MirrorPresetId =
  | "balanced"
  | "bright-clean"
  | "moody-cinematic"
  | "skin-first";

export type ShootCategory =
  | "portrait"
  | "wedding"
  | "fashion"
  | "product"
  | "event";

export interface ImageAnalysis {
  exposureScore: number;
  lightingScore: number;
  skinToneScore: number;
  width: number;
  height: number;
}

export interface ImageRecord {
  id: string;
  sourceFilename: string;
  originalRelPath: string;
  previewRelPath?: string;
  processedRelPath?: string;
  createdAt: string;
  updatedAt: string;
  status: ProcessingStatus;
  preset: MirrorPresetId;
  retouchIntensity: number;
  category: ShootCategory;
  analysis?: ImageAnalysis;
  errorMessage?: string;
}

export interface PublicImageRecord extends ImageRecord {
  originalUrl: string;
  previewUrl?: string;
  processedUrl?: string;
}

export interface GlobalControlSettings {
  preset: MirrorPresetId;
  retouchIntensity: number;
  category: ShootCategory;
}

export interface ReprocessOptions {
  preset?: MirrorPresetId;
  retouchIntensity?: number;
  category?: ShootCategory;
}

export interface QueueSnapshot {
  queued: number;
  processing: number;
}

export type MirrorEvent =
  | { type: "image.created"; image: PublicImageRecord }
  | { type: "image.updated"; image: PublicImageRecord }
  | { type: "controls.updated"; controls: GlobalControlSettings }
  | { type: "queue.stats"; queue: QueueSnapshot };
