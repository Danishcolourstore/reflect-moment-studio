import { randomUUID } from "node:crypto";

const nowIso = () => new Date().toISOString();

export const DEFAULT_PRESETS = [
  {
    id: "natural-luxe",
    name: "Natural Luxe",
    exposureBias: 0.08,
    warmthBias: 0.04,
    contrast: 1.07,
    saturation: 1.03,
    sharpnessSigma: 0.5,
    grain: 0.0,
  },
  {
    id: "editorial-clean",
    name: "Editorial Clean",
    exposureBias: 0.02,
    warmthBias: -0.02,
    contrast: 1.12,
    saturation: 0.95,
    sharpnessSigma: 0.4,
    grain: 0.0,
  },
  {
    id: "cinematic-night",
    name: "Cinematic Night",
    exposureBias: -0.04,
    warmthBias: -0.05,
    contrast: 1.2,
    saturation: 0.9,
    sharpnessSigma: 0.7,
    grain: 0.04,
  },
];

const DEFAULT_SETTINGS = {
  activePresetId: DEFAULT_PRESETS[0].id,
  retouchIntensity: 0.3,
  category: "portrait",
};

const DEFAULT_CATEGORIES = [
  "portrait",
  "wedding",
  "fashion",
  "events",
  "studio",
  "lifestyle",
  "night",
];

export class MirrorState {
  constructor(seed = null) {
    this.images = new Map((seed?.images ?? []).map((image) => [image.id, image]));
    this.presets = seed?.presets?.length ? seed.presets : DEFAULT_PRESETS;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(seed?.settings ?? {}),
    };
  }

  getPresetById(id) {
    return this.presets.find((preset) => preset.id === id) ?? null;
  }

  getActivePreset() {
    return this.getPresetById(this.settings.activePresetId) ?? this.presets[0];
  }

  getPresets() {
    return this.presets;
  }

  getSettings() {
    return this.settings;
  }

  getCategories() {
    return DEFAULT_CATEGORIES;
  }

  setSettings(partial) {
    this.settings = {
      ...this.settings,
      ...partial,
    };
    return this.settings;
  }

  upsertImage(image) {
    this.images.set(image.id, {
      ...image,
      updatedAt: nowIso(),
    });
    return this.images.get(image.id);
  }

  createImage(input) {
    const now = nowIso();
    const image = {
      id: randomUUID(),
      originalFilename: input.originalFilename,
      originalPath: input.originalPath,
      previewPath: null,
      processedPath: null,
      status: "queued",
      category: input.category ?? this.settings.category,
      createdAt: now,
      updatedAt: now,
      metadata: input.metadata ?? {},
      analysis: {},
      processing: {
        presetId: input.presetId ?? this.settings.activePresetId,
        retouchIntensity:
          typeof input.retouchIntensity === "number"
            ? input.retouchIntensity
            : this.settings.retouchIntensity,
      },
      error: null,
    };
    this.images.set(image.id, image);
    return image;
  }

  addIncomingImage(input) {
    return this.createImage(input);
  }

  updateImage(id, patch) {
    const existing = this.images.get(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...patch,
      processing: {
        ...existing.processing,
        ...(patch.processing ?? {}),
      },
      updatedAt: nowIso(),
    };
    this.images.set(id, merged);
    return merged;
  }

  getImage(id) {
    return this.images.get(id) ?? null;
  }

  listImages() {
    return [...this.images.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  serialize() {
    return {
      images: this.listImages(),
      presets: this.presets,
      settings: this.settings,
    };
  }
}
