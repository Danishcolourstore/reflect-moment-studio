import path from "node:path";
import fs from "node:fs/promises";
import type {
  ImageAnalysis,
  ImageRecord,
  MirrorPresetId,
  ProcessingStatus,
  ReprocessOptions,
  ShootCategory,
} from "./types.js";
import { PresetService } from "./presets.js";

export class MetadataService {
  private readonly records = new Map<string, ImageRecord>();

  constructor(
    private readonly metadataFilePath: string,
    private readonly presets: PresetService,
  ) {}

  public async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.metadataFilePath, "utf8");
      const parsed = JSON.parse(raw) as ImageRecord[];
      for (const item of parsed) {
        this.records.set(item.id, item);
      }
    } catch {
      await fs.mkdir(path.dirname(this.metadataFilePath), { recursive: true });
      await this.persist();
    }
  }

  public list(): ImageRecord[] {
    return [...this.records.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  public get(id: string): ImageRecord | undefined {
    return this.records.get(id);
  }

  public createIncoming(payload: {
    id: string;
    sourceFilename: string;
    originalRelPath: string;
  }): ImageRecord {
    const controls = this.presets.getGlobalControls();
    const now = new Date().toISOString();
    const record: ImageRecord = {
      id: payload.id,
      sourceFilename: payload.sourceFilename,
      originalRelPath: payload.originalRelPath,
      createdAt: now,
      updatedAt: now,
      status: "queued",
      preset: controls.preset,
      retouchIntensity: controls.retouchIntensity,
      category: controls.category,
    };
    this.records.set(record.id, record);
    void this.persist();
    return record;
  }

  public update(
    id: string,
    patch: Partial<Omit<ImageRecord, "id" | "createdAt">>,
  ): ImageRecord | undefined {
    const existing = this.records.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: ImageRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(id, updated);
    void this.persist();
    return updated;
  }

  public updateStatus(
    id: string,
    status: ProcessingStatus,
    errorMessage?: string,
  ): ImageRecord | undefined {
    return this.update(id, { status, errorMessage });
  }

  public markDone(
    id: string,
    assets: { previewRelPath: string; processedRelPath: string },
    analysis: ImageAnalysis,
  ): ImageRecord | undefined {
    return this.update(id, {
      status: "done",
      errorMessage: undefined,
      previewRelPath: assets.previewRelPath,
      processedRelPath: assets.processedRelPath,
      analysis,
    });
  }

  public applyImageOptions(id: string, options: ReprocessOptions): ImageRecord | undefined {
    const existing = this.get(id);
    if (!existing) {
      return undefined;
    }
    return this.update(id, {
      preset: options.preset ?? existing.preset,
      retouchIntensity:
        typeof options.retouchIntensity === "number"
          ? Math.min(1, Math.max(0, Number(options.retouchIntensity.toFixed(2))))
          : existing.retouchIntensity,
      category: options.category ?? existing.category,
      status: "queued",
      errorMessage: undefined,
    });
  }

  public applyBatchOptions(imageIds: string[], options: ReprocessOptions): ImageRecord[] {
    const updated: ImageRecord[] = [];
    for (const id of imageIds) {
      const row = this.applyImageOptions(id, options);
      if (row) {
        updated.push(row);
      }
    }
    return updated;
  }

  public setAllGlobal(
    preset: MirrorPresetId,
    retouchIntensity: number,
    category: ShootCategory,
  ): ImageRecord[] {
    const updated: ImageRecord[] = [];
    for (const [id, row] of this.records) {
      const next: ImageRecord = {
        ...row,
        preset,
        retouchIntensity,
        category,
        updatedAt: new Date().toISOString(),
      };
      this.records.set(id, next);
      updated.push(next);
    }
    void this.persist();
    return updated;
  }

  private async persist(): Promise<void> {
    const content = JSON.stringify(this.list(), null, 2);
    await fs.writeFile(this.metadataFilePath, content, "utf8");
  }
}
