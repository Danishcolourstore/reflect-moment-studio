import { randomUUID } from "node:crypto";
import {
  type ControlState,
  type ImageRecord,
  type PresetDefinition,
  type ProcessingStatus,
  type SourceType,
} from "../types/domain.js";
import { paths } from "../config/paths.js";
import { defaultPresetId, presets as defaultPresets } from "../data/presets.js";
import { ensureDir, readJsonFile, writeJsonFile } from "./fs.js";

interface StoreFile {
  images: ImageRecord[];
  controlState: ControlState;
  presets: PresetDefinition[];
}

const defaultStore: StoreFile = {
  images: [],
  controlState: {
    presetId: defaultPresetId,
    retouchIntensity: 35,
    category: "portrait",
  },
  presets: defaultPresets,
};

class StoreService {
  private store: StoreFile = defaultStore;
  private writeChain: Promise<void> = Promise.resolve();

  async bootstrap(): Promise<void> {
    await ensureDir(paths.metadataDir);
    this.store = await readJsonFile<StoreFile>(paths.metadataFile, defaultStore);

    if (!this.store.presets.length) {
      this.store.presets = defaultPresets;
    }

    if (!this.store.controlState.presetId) {
      this.store.controlState.presetId = defaultPresetId;
    }

    await this.persist();
  }

  private persist(): Promise<void> {
    this.writeChain = this.writeChain.then(() => writeJsonFile(paths.metadataFile, this.store));
    return this.writeChain;
  }

  listImages(): ImageRecord[] {
    return [...this.store.images].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getImageById(imageId: string): ImageRecord | undefined {
    return this.store.images.find((image) => image.id === imageId);
  }

  getPresets(): PresetDefinition[] {
    return this.store.presets;
  }

  getControlState(): ControlState {
    return this.store.controlState;
  }

  async updateControlState(patch: Partial<ControlState>): Promise<ControlState> {
    if (patch.presetId && !this.store.presets.some((preset) => preset.id === patch.presetId)) {
      throw new Error(`Unknown preset id: ${patch.presetId}`);
    }

    const nextIntensity = patch.retouchIntensity ?? this.store.controlState.retouchIntensity;
    if (!Number.isFinite(nextIntensity) || nextIntensity < 0 || nextIntensity > 100) {
      throw new Error("retouchIntensity must be between 0 and 100");
    }

    this.store.controlState = {
      ...this.store.controlState,
      ...patch,
      retouchIntensity: nextIntensity,
    };

    await this.persist();
    return this.store.controlState;
  }

  async createImage(params: {
    filename: string;
    source: SourceType;
    originalPath: string;
    category: string;
    presetId: string;
    retouchIntensity: number;
  }): Promise<ImageRecord> {
    const now = new Date().toISOString();
    const image: ImageRecord = {
      id: randomUUID(),
      filename: params.filename,
      source: params.source,
      createdAt: now,
      updatedAt: now,
      status: "queued",
      category: params.category,
      presetId: params.presetId,
      retouchIntensity: params.retouchIntensity,
      originalPath: params.originalPath,
    };

    this.store.images.unshift(image);
    await this.persist();
    return image;
  }

  async updateImage(imageId: string, patch: Partial<ImageRecord>): Promise<ImageRecord> {
    const image = this.getImageById(imageId);
    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }

    Object.assign(image, patch);
    image.updatedAt = new Date().toISOString();
    await this.persist();
    return image;
  }

  async setImageStatus(imageId: string, status: ProcessingStatus, error?: string): Promise<ImageRecord> {
    return this.updateImage(imageId, {
      status,
      error,
    });
  }

  async batchApply(
    imageIds: string[],
    patch: Partial<Pick<ImageRecord, "presetId" | "retouchIntensity" | "category">>,
  ): Promise<ImageRecord[]> {
    const items = this.store.images.filter((image) => imageIds.includes(image.id));
    for (const image of items) {
      Object.assign(image, patch);
      image.status = "queued";
      image.error = undefined;
      image.updatedAt = new Date().toISOString();
    }

    await this.persist();
    return items;
  }
}

export const store = new StoreService();
