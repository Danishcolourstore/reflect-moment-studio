import type { GlobalControlSettings, MirrorPresetId, ReprocessOptions, ShootCategory } from "./types.js";

const PRESET_IDS: MirrorPresetId[] = ["balanced", "bright-clean", "moody-cinematic", "skin-first"];
const CATEGORIES: ShootCategory[] = ["portrait", "wedding", "fashion", "product", "event"];

export interface PresetDefinition {
  id: MirrorPresetId;
  label: string;
  description: string;
}

const PRESETS: PresetDefinition[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Natural contrast and color, tuned for universal delivery.",
  },
  {
    id: "bright-clean",
    label: "Bright Clean",
    description: "Airy highlights with smooth contrast and polished skin tones.",
  },
  {
    id: "moody-cinematic",
    label: "Moody Cinematic",
    description: "Deeper contrast with cinematic shadows and richer depth.",
  },
  {
    id: "skin-first",
    label: "Skin First",
    description: "Skin-tone priority with subtle retouch and gentle roll-off.",
  },
];

export class PresetService {
  private controls: GlobalControlSettings;

  constructor(defaultPreset: MirrorPresetId, defaultRetouchIntensity: number) {
    this.controls = {
      preset: this.isPreset(defaultPreset) ? defaultPreset : "balanced",
      retouchIntensity: this.clampIntensity(defaultRetouchIntensity),
      category: "portrait",
    };
  }

  public listPresets(): PresetDefinition[] {
    return PRESETS;
  }

  public listCategories(): ShootCategory[] {
    return CATEGORIES;
  }

  public getGlobalControls(): GlobalControlSettings {
    return { ...this.controls };
  }

  public updateGlobalControls(update: ReprocessOptions): GlobalControlSettings {
    this.controls = {
      preset: this.isPreset(update.preset) ? update.preset : this.controls.preset,
      retouchIntensity:
        typeof update.retouchIntensity === "number"
          ? this.clampIntensity(update.retouchIntensity)
          : this.controls.retouchIntensity,
      category: this.isCategory(update.category) ? update.category : this.controls.category,
    };
    return { ...this.controls };
  }

  public sanitizePreset(value: string | undefined): MirrorPresetId {
    if (!value) {
      return this.controls.preset;
    }
    return this.isPreset(value) ? value : this.controls.preset;
  }

  public sanitizeCategory(value: string | undefined): ShootCategory {
    if (!value) {
      return this.controls.category;
    }
    return this.isCategory(value) ? value : this.controls.category;
  }

  public sanitizeRetouchIntensity(value: number | undefined): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return this.controls.retouchIntensity;
    }
    return this.clampIntensity(value);
  }

  private isPreset(value: unknown): value is MirrorPresetId {
    return typeof value === "string" && PRESET_IDS.includes(value as MirrorPresetId);
  }

  private isCategory(value: unknown): value is ShootCategory {
    return typeof value === "string" && CATEGORIES.includes(value as ShootCategory);
  }

  private clampIntensity(value: number): number {
    return Math.min(1, Math.max(0, Number(value.toFixed(2))));
  }
}
