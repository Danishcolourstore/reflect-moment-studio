export type MirrorPresetId =
  | "editorial"
  | "portrait-natural"
  | "cinematic"
  | "night-glow"
  | "wedding-luxe"
  | "sport-crisp";

export type MirrorImageStatus = "queued" | "processing" | "done" | "failed";

export interface MirrorPresetDefinition {
  id: MirrorPresetId;
  name: string;
  description: string;
  brightness: number;
  saturation: number;
  contrast: number;
  warmth: number;
  sharpen: number;
}

export const MIRROR_PRESET_IDS = [
  "editorial",
  "portrait-natural",
  "cinematic",
  "night-glow",
  "wedding-luxe",
  "sport-crisp",
] as const;

export interface MirrorAnalysis {
  width: number;
  height: number;
  format: string;
  exposureScore: number;
  contrastScore: number;
  skinToneScore: number;
  lighting: "low" | "balanced" | "bright";
}

export interface MirrorImage {
  id: string;
  fileName: string;
  category: string;
  status: MirrorImageStatus;
  preset: MirrorPresetId;
  retouchIntensity: number;
  analysis?: MirrorAnalysis;
  error?: string;
  createdAt: string;
  updatedAt: string;
  originalUrl: string;
  previewUrl?: string;
  fullUrl?: string;
  thumbnailUrl?: string;
}

export interface MirrorControls {
  defaultPreset: MirrorPresetId;
  defaultRetouchIntensity: number;
  defaultCategory: string;
  updatedAt: string;
}

export interface MirrorSnapshot {
  controls: MirrorControls;
  presets: MirrorPresetDefinition[];
  images: MirrorImage[];
}

export interface MirrorWsEvent<T = unknown> {
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
