import express from "express";
import cors from "cors";
import path from "node:path";
import { config } from "./config";
import { PRESETS } from "./presets";
import { eventBus } from "./events";
import {
  batchUpdateImages,
  createImageRecord,
  getImageRecord,
  getSettings,
  listImages,
  moveToOriginals,
  updateImageRecord,
  updateSettings,
} from "./storage";
import type { QueueController } from "./queue";

function toAssetUrl(type: "originals" | "previews" | "processed", filePath?: string): string | null {
  if (!filePath) {
    return null;
  }
  return `/assets/${type}/${path.basename(filePath)}`;
}

function withUrls(image: Awaited<ReturnType<typeof getImageRecord>>) {
  if (!image) {
    return null;
  }
  return {
    ...image,
    originalUrl: toAssetUrl("originals", image.originalPath),
    previewUrl: toAssetUrl("previews", image.previewPath),
    processedUrl: toAssetUrl("processed", image.processedPath),
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function createHttpApp(queue: QueueController) {
  const app = express();

  app.use(cors({ origin: config.api.corsOrigin === "*" ? true : config.api.corsOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mirror-ai", time: new Date().toISOString() });
  });

  app.use("/assets/originals", express.static(config.storage.originals));
  app.use("/assets/previews", express.static(config.storage.previews));
  app.use("/assets/processed", express.static(config.storage.processed));

  app.get("/api/presets", (_req, res) => {
    res.json({ presets: PRESETS });
  });

  app.get("/api/images", async (_req, res) => {
    try {
      const images = await listImages();
      res.json({
        images: images.map((image) => ({
          ...image,
          originalUrl: toAssetUrl("originals", image.originalPath),
          previewUrl: toAssetUrl("previews", image.previewPath),
          processedUrl: toAssetUrl("processed", image.processedPath),
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to list images", details: toErrorMessage(error) });
    }
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await getSettings();
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ error: "Failed to load settings", details: toErrorMessage(error) });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const patch = req.body ?? {};
      const settings = await updateSettings({
        defaultPreset: patch.defaultPreset,
        defaultRetouchIntensity: patch.defaultRetouchIntensity,
        defaultCategory: patch.defaultCategory,
      });
      eventBus.emit("settingsUpdated", settings);
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings", details: toErrorMessage(error) });
    }
  });

  app.patch("/api/images/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const patch = req.body ?? {};
      const image = await updateImageRecord(id, {
        preset: patch.preset,
        retouchIntensity: patch.retouchIntensity,
        category: patch.category,
      });
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      if (patch.reprocess === true) {
        const queued = await updateImageRecord(id, { status: "queued", error: undefined });
        if (queued) {
          eventBus.emit("imageUpdated", queued);
        }
        await queue.enqueue(id);
      } else {
        eventBus.emit("imageUpdated", image);
      }

      const latest = await getImageRecord(id);
      res.json({ image: withUrls(latest) });
    } catch (error) {
      res.status(500).json({ error: "Failed to update image", details: toErrorMessage(error) });
    }
  });

  app.post("/api/images/:id/reprocess", async (req, res) => {
    try {
      const image = await getImageRecord(req.params.id);
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }
      const queued = await updateImageRecord(image.id, { status: "queued", error: undefined });
      if (queued) {
        eventBus.emit("imageUpdated", queued);
      }
      await queue.enqueue(image.id);
      res.status(202).json({ queued: true, id: image.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to queue image", details: toErrorMessage(error) });
    }
  });

  app.post("/api/images/batch-apply", async (req, res) => {
    try {
      const imageIds = Array.isArray(req.body?.imageIds) ? req.body.imageIds : [];
      if (imageIds.length === 0) {
        res.status(400).json({ error: "imageIds is required" });
        return;
      }

      const patch = {
        preset: req.body?.preset,
        retouchIntensity: req.body?.retouchIntensity,
        category: req.body?.category,
      };

      const changed = await batchUpdateImages(imageIds, patch);
      const queued = await Promise.all(
        changed.map(async (image) => {
          const queuedImage = await updateImageRecord(image.id, { status: "queued", error: undefined });
          if (queuedImage) {
            eventBus.emit("imageUpdated", queuedImage);
          }
          await queue.enqueue(image.id);
          return queuedImage ?? image;
        }),
      );

      res.json({ updatedCount: queued.length, images: queued.map((image) => withUrls(image) ?? image) });
    } catch (error) {
      res.status(500).json({ error: "Batch apply failed", details: toErrorMessage(error) });
    }
  });

  app.post("/api/simulate-upload", async (req, res) => {
    try {
      const sourcePath = String(req.body?.sourcePath ?? "");
      const filename = String(req.body?.filename ?? path.basename(sourcePath));
      if (!sourcePath || !filename) {
        res.status(400).json({ error: "sourcePath and filename are required" });
        return;
      }
      const originalPath = await moveToOriginals(sourcePath, filename);
      const record = await createImageRecord({ filename, originalPath });
      eventBus.emit("imageQueued", record);
      await queue.enqueue(record.id);
      const latest = await getImageRecord(record.id);
      res.status(201).json({ image: withUrls(latest) });
    } catch (error) {
      res.status(500).json({ error: "simulate-upload failed", details: toErrorMessage(error) });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
