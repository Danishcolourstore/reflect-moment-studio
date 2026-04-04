import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { dirs } from "../config/env.js";
import { toPublicMediaPath } from "../lib/path-utils.js";
import { StateStore } from "../lib/state-store.js";
import { enqueueProcessingJob } from "../queue/processing-queue.js";
import { emitPipelineEvent } from "../realtime/events.js";
import type { ImageRecord, PresetId, PublicImageRecord } from "../types.js";

const nowIso = (): string => new Date().toISOString();

const copySafe = async (src: string, dest: string): Promise<void> => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await fs.promises.copyFile(src, dest);
};

const moveSafe = async (src: string, dest: string): Promise<void> => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    await fs.promises.rename(src, dest);
  } catch {
    await copySafe(src, dest);
    await fs.promises.unlink(src).catch(() => undefined);
  }
};

export class MirrorService {
  constructor(private readonly store: StateStore) {}

  async getSnapshot() {
    const state = await this.store.getState();
    const images = state.imageOrder
      .map((id) => state.images[id])
      .filter(Boolean)
      .map((image) => this.publicRecord(image));

    return {
      controls: state.controls,
      presets: state.presets,
      images,
    };
  }

  async listImages(): Promise<PublicImageRecord[]> {
    const state = await this.store.getState();
    return state.imageOrder
      .map((id) => state.images[id])
      .filter(Boolean)
      .map((image) => this.publicRecord(image));
  }

  async getPublicImage(imageId: string): Promise<PublicImageRecord | undefined> {
    const image = await this.store.getImage(imageId);
    return image ? this.publicRecord(image) : undefined;
  }

  async getMetadata() {
    const state = await this.store.getState();
    const counts = {
      queued: 0,
      processing: 0,
      done: 0,
      failed: 0,
    };
    for (const id of state.imageOrder) {
      const image = state.images[id];
      if (!image) continue;
      counts[image.status] += 1;
    }
    return {
      totals: {
        images: state.imageOrder.length,
        ...counts,
      },
      controls: state.controls,
      updatedAt: new Date().toISOString(),
    };
  }

  async ingestImageFromPath(incomingPath: string, fileName: string): Promise<ImageRecord> {
    const imageId = uuidv4();
    const ext = path.extname(fileName) || ".jpg";
    const originalPath = path.join(dirs.originals, `${imageId}${ext.toLowerCase()}`);

    await moveSafe(incomingPath, originalPath);

    const created = await this.store.withState((state) => {
      const now = nowIso();
      const record: ImageRecord = {
        id: imageId,
        fileName,
        category: state.controls.defaultCategory,
        status: "queued",
        preset: state.controls.defaultPreset,
        retouchIntensity: state.controls.defaultRetouchIntensity,
        originalPath,
        createdAt: now,
        updatedAt: now,
      };

      state.images[imageId] = record;
      state.imageOrder.unshift(imageId);
      return structuredClone(record);
    });

    await enqueueProcessingJob({
      imageId: created.id,
      reason: "ingest",
    });

    emitPipelineEvent({
      type: "image:queued",
      payload: this.publicRecord(created),
      timestamp: nowIso(),
    });

    return created;
  }

  async updateControls(input: {
    defaultPreset?: PresetId;
    defaultRetouchIntensity?: number;
    defaultCategory?: string;
  }) {
    const updated = await this.store.withState((state) => {
      if (input.defaultPreset) state.controls.defaultPreset = input.defaultPreset;
      if (typeof input.defaultRetouchIntensity === "number") {
        state.controls.defaultRetouchIntensity = Math.max(0, Math.min(100, input.defaultRetouchIntensity));
      }
      if (input.defaultCategory) state.controls.defaultCategory = input.defaultCategory;
      state.controls.updatedAt = nowIso();
      return structuredClone(state.controls);
    });

    emitPipelineEvent({
      type: "controls:updated",
      payload: updated,
      timestamp: nowIso(),
    });

    return updated;
  }

  async applyBatch(input: {
    imageIds?: string[];
    preset?: PresetId;
    retouchIntensity?: number;
    category?: string;
  }) {
    const selectedRecords = await this.store.withState((state) => {
      const ids =
        input.imageIds && input.imageIds.length > 0
          ? input.imageIds.filter((id) => Boolean(state.images[id]))
          : state.imageOrder.slice(0, 100);
      const queuedRecords: PublicImageRecord[] = [];

      for (const id of ids) {
        const item = state.images[id];
        if (!item) continue;
        if (input.preset) item.preset = input.preset;
        if (typeof input.retouchIntensity === "number") {
          item.retouchIntensity = Math.max(0, Math.min(100, input.retouchIntensity));
        }
        if (input.category) item.category = input.category;
        item.status = "queued";
        item.updatedAt = nowIso();
        queuedRecords.push(this.publicRecord(item));
      }

      return queuedRecords;
    });

    await Promise.all(
      selectedRecords.map((record) =>
        enqueueProcessingJob({
          imageId: record.id,
          forcePreset: input.preset,
          forceRetouchIntensity: input.retouchIntensity,
          reason: "batch-update",
        }),
      ),
    );

    for (const record of selectedRecords) {
      emitPipelineEvent({
        type: "image:queued",
        payload: record,
        timestamp: nowIso(),
      });
    }

    return selectedRecords.map((record) => record.id);
  }

  async markProcessing(imageId: string): Promise<ImageRecord | undefined> {
    const updated = await this.store.withState((state) => {
      const image = state.images[imageId];
      if (!image) return undefined;
      image.status = "processing";
      image.updatedAt = nowIso();
      return structuredClone(image);
    });

    if (updated) {
      emitPipelineEvent({
        type: "image:processing",
        payload: this.publicRecord(updated),
        timestamp: nowIso(),
      });
    }
    return updated;
  }

  async startProcessing(
    imageId: string,
    input?: { preset?: PresetId; retouchIntensity?: number },
  ): Promise<ImageRecord | undefined> {
    const updated = await this.store.withState((state) => {
      const image = state.images[imageId];
      if (!image) return undefined;
      if (input?.preset) image.preset = input.preset;
      if (typeof input?.retouchIntensity === "number") {
        image.retouchIntensity = Math.max(0, Math.min(100, input.retouchIntensity));
      }
      image.status = "processing";
      image.updatedAt = nowIso();
      return structuredClone(image);
    });

    if (updated) {
      emitPipelineEvent({
        type: "image:processing",
        payload: this.publicRecord(updated),
        timestamp: nowIso(),
      });
    }
    return updated;
  }

  async markDone(imageId: string, data: {
    previewPath: string;
    fullPath: string;
    thumbnailPath: string;
    analysis: ImageRecord["analysis"];
  }): Promise<ImageRecord | undefined> {
    const updated = await this.store.withState((state) => {
      const image = state.images[imageId];
      if (!image) return undefined;
      image.status = "done";
      image.previewPath = data.previewPath;
      image.fullPath = data.fullPath;
      image.thumbnailPath = data.thumbnailPath;
      image.analysis = data.analysis;
      image.error = undefined;
      image.updatedAt = nowIso();
      return structuredClone(image);
    });

    if (updated) {
      emitPipelineEvent({
        type: "image:done",
        payload: this.publicRecord(updated),
        timestamp: nowIso(),
      });
    }
    return updated;
  }

  async markFailed(imageId: string, error: unknown): Promise<ImageRecord | undefined> {
    const errorMessage = error instanceof Error ? error.message : "Unknown processing failure";
    const updated = await this.store.withState((state) => {
      const image = state.images[imageId];
      if (!image) return undefined;
      image.status = "failed";
      image.error = errorMessage;
      image.updatedAt = nowIso();
      return structuredClone(image);
    });

    if (updated) {
      emitPipelineEvent({
        type: "image:failed",
        payload: this.publicRecord(updated),
        timestamp: nowIso(),
      });
    }
    return updated;
  }

  async getImage(imageId: string): Promise<ImageRecord | undefined> {
    return this.store.getImage(imageId);
  }

  publicRecord(image: ImageRecord): PublicImageRecord {
    const {
      originalPath: _originalPath,
      previewPath: _previewPath,
      fullPath: _fullPath,
      thumbnailPath: _thumbnailPath,
      ...safe
    } = image;
    return {
      ...safe,
      originalUrl: toPublicMediaPath(image.originalPath),
      previewUrl: image.previewPath ? toPublicMediaPath(image.previewPath) : undefined,
      fullUrl: image.fullPath ? toPublicMediaPath(image.fullPath) : undefined,
      thumbnailUrl: image.thumbnailPath ? toPublicMediaPath(image.thumbnailPath) : undefined,
    };
  }
}
