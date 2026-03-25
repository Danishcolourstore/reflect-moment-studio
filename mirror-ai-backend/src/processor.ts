import path from "node:path";
import sharp from "sharp";
import { logger } from "./logger.js";
import { MetadataService } from "./metadata.js";
import type { StoragePaths } from "./storage.js";
import type { ImageAnalysis, ImageRecord, PublicImageRecord } from "./types.js";
import type { EventBus } from "./eventBus.js";
import type { ProcessingQueue } from "./queue.js";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function presetAdjustments(preset: ImageRecord["preset"]) {
  switch (preset) {
    case "bright-clean":
      return { brightness: 1.08, saturation: 1.04, contrast: 1.03, warmth: 6 };
    case "moody-cinematic":
      return { brightness: 0.94, saturation: 0.95, contrast: 1.09, warmth: -8 };
    case "skin-first":
      return { brightness: 1.02, saturation: 0.98, contrast: 1.02, warmth: 4 };
    case "balanced":
    default:
      return { brightness: 1.0, saturation: 1.0, contrast: 1.03, warmth: 0 };
  }
}

function analyze(stats: sharp.Stats, width: number, height: number): ImageAnalysis {
  const [r, g, b] = stats.channels;
  const luminance = (r.mean * 0.2126 + g.mean * 0.7152 + b.mean * 0.0722) / 255;
  const exposureScore = clamp(luminance, 0, 1);
  const spread =
    (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3 / 128;
  const lightingScore = clamp(spread, 0, 1);
  const rgGap = Math.abs(r.mean - g.mean) / 255;
  const rbGap = Math.abs(r.mean - b.mean) / 255;
  const skinToneScore = clamp(1 - rgGap * 0.5 - rbGap * 0.5, 0, 1);

  return {
    exposureScore: Number(exposureScore.toFixed(3)),
    lightingScore: Number(lightingScore.toFixed(3)),
    skinToneScore: Number(skinToneScore.toFixed(3)),
    width,
    height,
  };
}

export class ProcessorService {
  private queue?: ProcessingQueue;

  constructor(
    private readonly storage: StoragePaths,
    private readonly metadata: MetadataService,
    private readonly bus: EventBus,
    private readonly toPublic: (row: ImageRecord) => PublicImageRecord,
  ) {}

  public setQueue(queue: ProcessingQueue): void {
    this.queue = queue;
  }

  public async processImage(imageId: string): Promise<void> {
    const record = this.metadata.get(imageId);
    if (!record) {
      return;
    }

    this.metadata.updateStatus(imageId, "processing");
    this.emitImage(imageId);
    this.emitQueue();

    try {
      const inputPath = path.join(this.storage.root, record.originalRelPath);
      const ext = path.extname(record.sourceFilename).toLowerCase() || ".jpg";
      const outputBase = `${record.id}${ext === ".png" ? ".png" : ".jpg"}`;
      const previewRelPath = path.join("processed", "preview", `${record.id}.webp`);
      const fullRelPath = path.join("processed", "full", outputBase);
      const previewPath = path.join(this.storage.root, previewRelPath);
      const fullPath = path.join(this.storage.root, fullRelPath);

      const adjustments = presetAdjustments(record.preset);
      const raw = sharp(inputPath, { failOn: "none" });
      const [stats, info] = await Promise.all([raw.stats(), raw.metadata()]);
      const width = info.width ?? 0;
      const height = info.height ?? 0;
      const metrics = analyze(stats, width, height);

      const retouch = clamp(record.retouchIntensity, 0, 1);
      const smoothingSigma = clamp(retouch * 0.75, 0, 0.9);
      const brightness = clamp(
        adjustments.brightness + (0.55 - metrics.exposureScore) * 0.12,
        0.86,
        1.2,
      );
      const saturation = clamp(
        adjustments.saturation + (metrics.skinToneScore - 0.5) * 0.04,
        0.85,
        1.18,
      );

      let pipeline = sharp(inputPath, { failOn: "none" }).modulate({
        brightness,
        saturation,
      });

      if (adjustments.warmth !== 0) {
        pipeline = pipeline.tint({
          r: clamp(128 + adjustments.warmth, 0, 255),
          g: 128,
          b: clamp(128 - adjustments.warmth, 0, 255),
        });
      }

      if (smoothingSigma > 0.01) {
        // Gentle blur emulates natural skin retouch without plastic effect.
        pipeline = pipeline.blur(smoothingSigma);
      }

      const contrastOffset = -(255 / 2) * (adjustments.contrast - 1);
      const outputFormat = ext === ".png" ? "png" : "jpeg";

      if (outputFormat === "png") {
        await pipeline
          .linear(adjustments.contrast, contrastOffset)
          .sharpen(clamp(0.35 + metrics.lightingScore * 0.5, 0.2, 1.0))
          .png({ quality: 95, compressionLevel: 8 })
          .toFile(fullPath);
      } else {
        await pipeline
          .linear(adjustments.contrast, contrastOffset)
          .sharpen(clamp(0.35 + metrics.lightingScore * 0.5, 0.2, 1.0))
          .jpeg({ quality: 93, chromaSubsampling: "4:4:4" })
          .toFile(fullPath);
      }

      await sharp(fullPath)
        .resize({ width: 1680, height: 1680, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(previewPath);

      this.metadata.markDone(imageId, { previewRelPath, processedRelPath: fullRelPath }, metrics);
      this.emitImage(imageId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown processing error";
      logger.error("Processing failed", { imageId, message });
      this.metadata.updateStatus(imageId, "error", message);
      this.emitImage(imageId);
    } finally {
      this.emitQueue();
    }
  }

  public async reprocess(id: string): Promise<void> {
    if (!this.queue) {
      return;
    }
    const row = this.metadata.updateStatus(id, "queued");
    if (!row) {
      return;
    }
    this.emitImage(id);
    this.queue.enqueue(id);
  }

  private emitImage(id: string): void {
    const row = this.metadata.get(id);
    if (!row) {
      return;
    }
    this.bus.publish({ type: "image.updated", image: this.toPublic(row) });
  }

  private emitQueue(): void {
    if (!this.queue) {
      return;
    }
    this.bus.publish({ type: "queue.stats", queue: this.queue.snapshot() });
  }
}
