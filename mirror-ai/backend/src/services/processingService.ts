import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { v7 as uuidv7 } from 'uuid';
import { presetById } from '../pipeline/presets.js';
import { analyzeImage } from '../pipeline/analyzer.js';
import { processImage } from '../pipeline/processor.js';
import { IJobQueue } from '../queue/jobQueue.js';
import { RealtimeHub } from '../sockets/realtimeHub.js';
import { FileStorage } from '../storage/fileStorage.js';
import { ImageStore } from '../storage/imageStore.js';
import { ControlDefaults, ImageRecord, ShootCategory } from '../types/models.js';
import { logger } from '../utils/logger.js';

const inferCategory = (filePath: string): ShootCategory => {
  const normalized = filePath.toLowerCase();
  if (normalized.includes('wedding')) return 'wedding';
  if (normalized.includes('portrait')) return 'portrait';
  if (normalized.includes('fashion')) return 'fashion';
  if (normalized.includes('event')) return 'event';
  if (normalized.includes('commercial')) return 'commercial';
  return 'other';
};

export class ProcessingService {
  private defaults: ControlDefaults;

  constructor(
    private readonly storage: FileStorage,
    private readonly imageStore: ImageStore,
    private readonly queue: IJobQueue,
    private readonly realtime: RealtimeHub,
    defaults: ControlDefaults,
  ) {
    this.defaults = defaults;
  }

  getDefaults(): ControlDefaults {
    return this.defaults;
  }

  async updateDefaults(patch: Partial<ControlDefaults>): Promise<ControlDefaults> {
    this.defaults = {
      presetId: patch.presetId ?? this.defaults.presetId,
      retouchIntensity: patch.retouchIntensity ?? this.defaults.retouchIntensity,
    };

    this.realtime.broadcast('control:updated', this.defaults);
    return this.defaults;
  }

  async ingestFromPath(sourcePath: string): Promise<ImageRecord> {
    const id = uuidv7();
    const extension = path.extname(sourcePath).toLowerCase() || '.jpg';
    const destName = `${id}${extension}`;
    const destination = path.join(this.storage.originalsDir, destName);

    await fs.copyFile(sourcePath, destination);

    const info = await sharp(destination).metadata();
    const now = new Date().toISOString();

    const record: ImageRecord = {
      id,
      filename: path.basename(sourcePath),
      category: inferCategory(sourcePath),
      status: 'queued',
      presetId: this.defaults.presetId,
      retouchIntensity: this.defaults.retouchIntensity,
      createdAt: now,
      updatedAt: now,
      width: info.width,
      height: info.height,
      files: {
        original: destination,
      },
    };

    const created = await this.imageStore.create(record);
    this.realtime.broadcast('image:new', created);
    await this.queue.enqueue({ imageId: id });
    return created;
  }

  async processImage(imageId: string): Promise<void> {
    const image = this.imageStore.get(imageId);
    if (!image) {
      logger.warn({ imageId }, 'Image not found for processing');
      return;
    }

    await this.imageStore.update(image.id, { status: 'processing', errorMessage: undefined });
    const processingSnapshot = this.imageStore.get(image.id);
    if (processingSnapshot) {
      this.realtime.broadcast('image:processing', processingSnapshot);
    }

    try {
      const analysis = await analyzeImage(image.files.original);
      const preset = presetById(image.presetId) ?? presetById(this.defaults.presetId);

      if (!preset) {
        throw new Error(`Preset not found: ${image.presetId}`);
      }

      const output = await processImage({
        sourcePath: image.files.original,
        imageId: image.id,
        preset,
        retouchIntensity: image.retouchIntensity,
        processedDir: this.storage.processedDir,
        previewsDir: this.storage.previewsDir,
        analysis,
      });

      const completed = await this.imageStore.update(image.id, {
        status: 'done',
        analysis,
        files: {
          original: image.files.original,
          processed: output.processedPath,
          preview: output.previewPath,
        },
      });

      if (completed) {
        this.realtime.broadcast('image:done', completed);
      }
    } catch (error) {
      const failed = await this.imageStore.update(image.id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown processing error',
      });

      if (failed) {
        this.realtime.broadcast('image:error', failed);
      }

      logger.error({ imageId, error }, 'Image processing failed');
    }
  }

  async reprocessImage(
    imageId: string,
    patch: { presetId?: string; retouchIntensity?: number },
  ): Promise<ImageRecord | undefined> {
    const image = this.imageStore.get(imageId);
    if (!image) return undefined;

    const next = await this.imageStore.update(imageId, {
      presetId: patch.presetId ?? image.presetId,
      retouchIntensity: patch.retouchIntensity ?? image.retouchIntensity,
      status: 'queued',
      errorMessage: undefined,
    });

    if (next) {
      this.realtime.broadcast('control:updated', next);
      await this.queue.enqueue({ imageId });
    }

    return next;
  }

  async batchReprocess(
    imageIds: string[],
    patch: { presetId?: string; retouchIntensity?: number },
  ): Promise<ImageRecord[]> {
    const updated: ImageRecord[] = [];

    for (const id of imageIds) {
      const image = await this.reprocessImage(id, patch);
      if (image) updated.push(image);
    }

    return updated;
  }
}
