import { randomUUID } from "node:crypto";
import type {
  ImageRecord,
  ProcessingPreset,
  QueueStats,
  RuntimeSettings,
  ShootCategory,
} from "../types";

class ImageRepository {
  private readonly images: ImageRecord[] = [];
  private readonly presets: ProcessingPreset[] = [
    {
      id: "editorial-clean",
      name: "Editorial Clean",
      description: "Balanced skin tones and clean commercial contrast.",
      settings: {
        exposureBoost: 0.05,
        contrastBoost: 1.05,
        saturationBoost: 1.04,
        warmthShift: 1.02,
        skinToneBalance: 1.03,
        retouchIntensity: 0.16,
      },
    },
    {
      id: "golden-hour",
      name: "Golden Hour",
      description: "Warm cinematic toning for sunset and lifestyle.",
      settings: {
        exposureBoost: 0.09,
        contrastBoost: 1.08,
        saturationBoost: 1.1,
        warmthShift: 1.12,
        skinToneBalance: 1.06,
        retouchIntensity: 0.22,
      },
    },
    {
      id: "neutral-studio",
      name: "Neutral Studio",
      description: "High-fidelity neutral rendering for studio sets.",
      settings: {
        exposureBoost: 0.03,
        contrastBoost: 1.03,
        saturationBoost: 1.01,
        warmthShift: 1,
        skinToneBalance: 1,
        retouchIntensity: 0.12,
      },
    },
  ];

  private settings: RuntimeSettings = {
    activePresetId: "editorial-clean",
    retouchIntensity: 0.16,
    category: "wedding",
  };

  private queueStats: QueueStats = {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  };

  createImage(input: Omit<ImageRecord, "id"> & { id?: string }): ImageRecord {
    const image: ImageRecord = {
      ...input,
      id: input.id || randomUUID(),
    };
    this.images.unshift(image);
    return image;
  }

  listImages(limit = 200): ImageRecord[] {
    return this.images.slice(0, Math.max(1, limit));
  }

  getImageById(id: string): ImageRecord | null {
    return this.images.find((item) => item.id === id) || null;
  }

  updateImage(id: string, patch: Partial<ImageRecord>): ImageRecord | null {
    const idx = this.images.findIndex((item) => item.id === id);
    if (idx < 0) {
      return null;
    }
    const current = this.images[idx];
    const next: ImageRecord = {
      ...current,
      ...patch,
      metadata: {
        ...current.metadata,
        ...(patch.metadata || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    this.images[idx] = next;
    return next;
  }

  listPresets(): ProcessingPreset[] {
    return this.presets;
  }

  getPresetById(id: string): ProcessingPreset | null {
    return this.presets.find((item) => item.id === id) || null;
  }

  getSettings(): RuntimeSettings {
    return { ...this.settings };
  }

  setSettings(input: Partial<RuntimeSettings>): RuntimeSettings {
    if (input.activePresetId) {
      const preset = this.getPresetById(input.activePresetId);
      if (!preset) {
        throw new Error("Preset not found");
      }
      this.settings.activePresetId = preset.id;
    }
    if (typeof input.retouchIntensity === "number") {
      this.settings.retouchIntensity = Math.max(0, Math.min(1, input.retouchIntensity));
    }
    if (input.category) {
      this.settings.category = input.category;
    }
    return this.getSettings();
  }

  getQueueStats(): QueueStats {
    return { ...this.queueStats };
  }

  setQueueStats(stats: QueueStats): QueueStats {
    this.queueStats = { ...stats };
    return this.getQueueStats();
  }

  generateId(_filename?: string): string {
    return randomUUID();
  }

  setCategory(category: ShootCategory): RuntimeSettings {
    return this.setSettings({ category });
  }
}

export const imageRepository = new ImageRepository();
