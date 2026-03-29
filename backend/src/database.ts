import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import { storagePaths } from "./config.js";
import { defaultPresets } from "./presets.js";
import type { BatchOperation, ImageRecord, MirrorSnapshot, Preset, RuntimeSettings } from "./types.js";

interface DatabaseSchema {
  images: ImageRecord[];
  presets: Preset[];
  batches: BatchOperation[];
  settings: RuntimeSettings;
}

const DEFAULT_DB: DatabaseSchema = {
  images: [],
  presets: defaultPresets,
  batches: [],
  settings: {
    activePresetId: defaultPresets[0]?.id ?? "clean-natural",
    retouchIntensity: 0.25,
    activeCategory: "portrait",
  },
};

export class Database {
  private data: DatabaseSchema = { ...DEFAULT_DB };
  private readonly readyPromise: Promise<void>;
  private writeChain: Promise<void> = Promise.resolve();

  constructor() {
    this.readyPromise = this.load();
  }

  async ready(): Promise<void> {
    await this.readyPromise;
  }

  private async load(): Promise<void> {
    await fs.mkdir(dirname(storagePaths.metadataFile), { recursive: true });
    try {
      const raw = await fs.readFile(storagePaths.metadataFile, "utf8");
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      this.data = {
        images: parsed.images ?? [],
        presets: parsed.presets ?? defaultPresets,
        batches: parsed.batches ?? [],
        settings: {
          ...DEFAULT_DB.settings,
          ...(parsed.settings ?? {}),
        },
      };
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        throw error;
      }
      this.data = { ...DEFAULT_DB };
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    await fs.writeFile(storagePaths.metadataFile, JSON.stringify(this.data, null, 2), "utf8");
  }

  private queueWrite(mutator: () => void): Promise<void> {
    this.writeChain = this.writeChain.then(async () => {
      await this.readyPromise;
      mutator();
      await this.flush();
    });
    return this.writeChain;
  }

  async getImages(): Promise<ImageRecord[]> {
    await this.readyPromise;
    return [...this.data.images].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getImageById(id: string): Promise<ImageRecord | undefined> {
    await this.readyPromise;
    return this.data.images.find((image) => image.id === id);
  }

  async upsertImage(record: ImageRecord): Promise<void> {
    await this.queueWrite(() => {
      const idx = this.data.images.findIndex((item) => item.id === record.id);
      if (idx >= 0) {
        this.data.images[idx] = record;
      } else {
        this.data.images.push(record);
      }
    });
  }

  async patchImage(id: string, patch: Partial<ImageRecord>): Promise<ImageRecord | undefined> {
    await this.readyPromise;
    const current = this.data.images.find((item) => item.id === id);
    if (!current) return undefined;

    const merged: ImageRecord = {
      ...current,
      ...patch,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertImage(merged);
    return merged;
  }

  async upsertBatch(batch: BatchOperation): Promise<void> {
    await this.queueWrite(() => {
      const idx = this.data.batches.findIndex((item) => item.id === batch.id);
      if (idx >= 0) {
        this.data.batches[idx] = batch;
      } else {
        this.data.batches.push(batch);
      }
    });
  }

  async patchBatch(id: string, patch: Partial<BatchOperation>): Promise<BatchOperation | undefined> {
    await this.readyPromise;
    const current = this.data.batches.find((item) => item.id === id);
    if (!current) return undefined;

    const merged: BatchOperation = {
      ...current,
      ...patch,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };
    await this.upsertBatch(merged);
    return merged;
  }

  async getBatchById(id: string): Promise<BatchOperation | undefined> {
    await this.readyPromise;
    return this.data.batches.find((batch) => batch.id === id);
  }

  async getBatches(): Promise<BatchOperation[]> {
    await this.readyPromise;
    return [...this.data.batches].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getPresets(): Promise<Preset[]> {
    await this.readyPromise;
    return [...this.data.presets];
  }

  async getPresetById(id: string): Promise<Preset | undefined> {
    await this.readyPromise;
    return this.data.presets.find((preset) => preset.id === id);
  }

  async getSettings(): Promise<RuntimeSettings> {
    await this.readyPromise;
    return { ...this.data.settings };
  }

  async patchSettings(patch: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
    await this.readyPromise;
    const merged = { ...this.data.settings, ...patch };
    await this.queueWrite(() => {
      this.data.settings = merged;
    });
    return merged;
  }

  async getSnapshot(): Promise<MirrorSnapshot> {
    const [images, presets, settings, batches] = await Promise.all([
      this.getImages(),
      this.getPresets(),
      this.getSettings(),
      this.getBatches(),
    ]);
    return { images, presets, settings, batches };
  }
}

export const db = new Database();
