import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { ControlState, ImageRecord, ShootCategory } from "../types.js";
import { defaultPreset } from "./presets.js";

function inferCategory(filename: string): ShootCategory {
  const value = filename.toLowerCase();
  if (value.includes("fashion")) return "fashion";
  if (value.includes("wedding")) return "wedding";
  if (value.includes("product")) return "product";
  if (value.includes("street")) return "street";
  return "portrait";
}

export class ImageRepository {
  private readonly records = new Map<string, ImageRecord>();
  private controls: ControlState = {
    presetId: defaultPreset.id,
    retouchIntensity: 0.35,
    category: "portrait",
  };

  createFromOriginalPath(originalPath: string): ImageRecord {
    const originalFilename = path.basename(originalPath);
    const originalBasename = path.parse(originalFilename).name;
    const now = Date.now();

    const image: ImageRecord = {
      id: uuidv4(),
      originalFilename,
      originalBasename,
      originalStoredFilename: `${uuidv4()}-${originalFilename}`,
      originalPath,
      previewPath: null,
      processedPath: null,
      status: "queued",
      controls: {
        presetId: this.controls.presetId,
        retouchIntensity: this.controls.retouchIntensity,
        category: this.controls.category ?? inferCategory(originalFilename),
      },
      metadata: null,
      error: null,
      createdAt: now,
      processingStartedAt: null,
      processingFinishedAt: null,
      processedAt: null,
    };
    this.records.set(image.id, image);
    return image;
  }

  findById(id: string): ImageRecord | null {
    return this.records.get(id) ?? null;
  }

  findByIdOrThrow(id: string): ImageRecord {
    const record = this.findById(id);
    if (!record) throw new Error(`Image ${id} not found`);
    return record;
  }

  getAll(): ImageRecord[] {
    return [...this.records.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  list(limit: number): ImageRecord[] {
    return this.getAll().slice(0, limit);
  }

  update(id: string, patch: Partial<ImageRecord>): ImageRecord {
    const current = this.findByIdOrThrow(id);
    const updated: ImageRecord = {
      ...current,
      ...patch,
      controls: patch.controls ? { ...current.controls, ...patch.controls } : current.controls,
      metadata: patch.metadata ?? current.metadata,
    };
    this.records.set(id, updated);
    return updated;
  }

  setControls(patch: Partial<ControlState>): ControlState {
    this.controls = { ...this.controls, ...patch };
    return this.controls;
  }

  getControls(): ControlState {
    return this.controls;
  }
}

export const imageRepository = new ImageRepository();
