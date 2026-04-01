export type MirrorImageStatus = "queued" | "processing" | "done" | "failed";
export type MirrorConnectionStatus = "connecting" | "connected" | "disconnected";

export interface MirrorPreset {
  id: string;
  name: string;
  exposureBias: number;
  warmthBias: number;
  contrast: number;
  saturation: number;
  sharpnessSigma: number;
  grain: number;
}

export interface MirrorSettings {
  activePresetId: string;
  retouchIntensity: number;
  category: string;
}

export interface MirrorQueueStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface MirrorAnalysis {
  dimensions?: {
    width?: number | null;
    height?: number | null;
  };
  file?: {
    format?: string;
    colorSpace?: string;
  };
  metrics?: {
    brightness?: number;
    dynamicRange?: number;
    warmth?: number;
    skinToneBalance?: number;
  };
  guidance?: {
    lightingLabel?: string;
    exposureHint?: number;
  };
  computedAt?: string;
}

export interface MirrorImage {
  id: string;
  originalFilename: string;
  storageFilename: string;
  source: string;
  status: MirrorImageStatus;
  category: string;
  originalPath: string;
  previewPath: string | null;
  processedPath: string | null;
  originalUrl?: string;
  previewUrl?: string;
  processedUrl?: string;
  metadataUrl?: string;
  createdAt: string;
  updatedAt: string;
  analysis: MirrorAnalysis;
  metadata: Record<string, unknown>;
  processing: {
    presetId: string;
    retouchIntensity: number;
  };
  error: string | null;
}

export interface MirrorImagesResponse {
  images: MirrorImage[];
  queue: MirrorQueueStats;
  settings: MirrorSettings;
}

export interface MirrorSettingsResponse {
  presets: MirrorPreset[];
  settings: MirrorSettings;
  categories: string[];
}

export interface MirrorSnapshotPayload {
  images: MirrorImage[];
  presets: MirrorPreset[];
  settings: MirrorSettings;
  queue: MirrorQueueStats | null;
  categories: string[];
}

export interface MirrorWsEvent {
  type: string;
  payload?: unknown;
  at?: string;
}

