import fs from 'node:fs/promises';
import { ImageRecord } from '../types/models.js';
import { FileStorage } from './fileStorage.js';

export type ImageRecordPatch = Omit<Partial<ImageRecord>, 'files'> & {
  files?: Partial<ImageRecord['files']>;
};

export class ImageStore {
  private byId = new Map<string, ImageRecord>();

  constructor(private readonly storage: FileStorage) {}

  async initialize(): Promise<void> {
    const raw = await fs.readFile(this.storage.metadataFile, 'utf-8');
    const records: ImageRecord[] = JSON.parse(raw);
    for (const record of records) {
      this.byId.set(record.id, record);
    }
  }

  list(): ImageRecord[] {
    return Array.from(this.byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string): ImageRecord | undefined {
    return this.byId.get(id);
  }

  async create(record: ImageRecord): Promise<ImageRecord> {
    this.byId.set(record.id, record);
    await this.persist();
    return record;
  }

  async update(id: string, patch: ImageRecordPatch): Promise<ImageRecord | undefined> {
    const current = this.byId.get(id);
    if (!current) return undefined;

    const next: ImageRecord = {
      ...current,
      ...patch,
      files: {
        ...current.files,
        ...(patch.files ?? {}),
      },
      updatedAt: new Date().toISOString(),
    };

    this.byId.set(id, next);
    await this.persist();
    return next;
  }

  private async persist(): Promise<void> {
    const tempPath = `${this.storage.metadataFile}.tmp`;
    const all = this.list();
    await fs.writeFile(tempPath, JSON.stringify(all, null, 2), 'utf-8');
    await fs.rename(tempPath, this.storage.metadataFile);
  }
}
