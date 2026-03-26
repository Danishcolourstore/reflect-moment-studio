import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export class FileStorage {
  readonly root = path.resolve(env.STORAGE_ROOT);
  readonly originalsDir = path.join(this.root, 'originals');
  readonly processedDir = path.join(this.root, 'processed');
  readonly previewsDir = path.join(this.root, 'previews');
  readonly uploadsDir = path.join(this.root, 'uploads', 'incoming');
  readonly metadataDir = path.join(this.root, 'metadata');
  readonly metadataFile = path.join(this.metadataDir, 'images.json');

  async ensureStructure(): Promise<void> {
    await fs.mkdir(this.originalsDir, { recursive: true });
    await fs.mkdir(this.processedDir, { recursive: true });
    await fs.mkdir(this.previewsDir, { recursive: true });
    await fs.mkdir(this.uploadsDir, { recursive: true });
    await fs.mkdir(this.metadataDir, { recursive: true });

    try {
      await fs.access(this.metadataFile);
    } catch {
      await fs.writeFile(this.metadataFile, JSON.stringify([], null, 2), 'utf-8');
    }
  }
}
