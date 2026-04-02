export type ProcessingStatus = "queued" | "processing" | "done" | "failed";

export interface ImageAnalysis {
  exposureScore: number;
  exposureLabel: "underexposed" | "balanced" | "overexposed";
  skinToneWarmth: number;
  lightingContrast: number;
  width: number;
  height: number;
}

export interface ImageItem {
  id: string;
  filename: string;
  source: "ftp" | "api" | "manual";
  createdAt: string;
  updatedAt: string;
  status: ProcessingStatus;
  category: string;
  presetId: string;
  retouchIntensity: number;
  error?: string;
  analysis?: ImageAnalysis;
  originalUrl: string;
  previewUrl?: string;
  processedUrl?: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  adjustments: {
    brightness: number;
    saturation: number;
    contrast: number;
    sharpness: number;
    warmth: number;
  };
}

export interface ControlState {
  presetId: string;
  retouchIntensity: number;
  category: string;
}

export interface WsEnvelope<T = unknown> {
  event: string;
  data: T;
  at: string;
}
