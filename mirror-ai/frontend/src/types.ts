export type ImageStatus = "processing" | "done" | "failed";

export type Analysis = {
  exposureScore: number;
  warmthScore: number;
  skinToneScore: number;
  highlightsClip: number;
  shadowsClip: number;
  suggestedExposure: number;
  suggestedWarmth: number;
};

export type Preset = {
  id: string;
  label: string;
  exposure: number;
  warmth: number;
  saturation: number;
  contrast: number;
  skinSoftening: number;
  shadowsLift: number;
  grain: number;
};

export type Controls = {
  activePresetId: string;
  retouchIntensity: number;
};

export type Category = {
  id: string;
  label: string;
};

export type BatchCategoryResponse = {
  updated: number;
  categoryId: string;
  categories: Category[];
};

export type MirrorImage = {
  id: string;
  originalName: string;
  originalPath: string;
  originalUrl: string | null;
  previewUrl: string | null;
  fullUrl: string | null;
  categoryId: string;
  status: ImageStatus;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  error?: string | null;
  analysis?: Analysis;
};
