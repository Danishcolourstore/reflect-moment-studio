import express from "express";
import multer from "multer";
import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env";
import { imageRepository } from "../storage/imageRepository";
import { toStorageUrl } from "../storage/fileStore";
import { settingsService } from "../services/settingsService";
import { queueClient } from "../queue/queueClient";
import { realtimeHub } from "../realtime/realtimeHub";
import type { ShootCategory } from "../types";

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.storagePaths.incoming),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${file.originalname}`),
  }),
});

const controlSchema = z.object({
  activePresetId: z.string().optional(),
  retouchIntensity: z.coerce.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "wedding", "fashion", "product", "editorial", "event", "lifestyle"]).optional(),
});

const batchSchema = z.object({
  imageIds: z.array(z.string()).min(1),
  activePresetId: z.string().optional(),
  retouchIntensity: z.coerce.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "wedding", "fashion", "product", "editorial", "event", "lifestyle"]).optional(),
});

export function createApiRouter() {
  const router = express.Router();

  router.get("/health", async (_req, res) => {
    res.json({
      status: "ok",
      redisEnabled: queueClient.isRedisEnabled(),
      queue: await queueClient.stats(),
      settings: settingsService.get(),
    });
  });

  router.get("/dashboard", async (_req, res) => {
    res.json({
      settings: settingsService.get(),
      queue: await queueClient.stats(),
      presets: imageRepository.listPresets(),
      images: imageRepository.listImages(300),
    });
  });

  router.get("/images", async (req, res) => {
    const limit = Number(req.query.limit ?? 200);
    res.json({
      items: imageRepository.listImages(limit),
      queue: await queueClient.stats(),
      settings: settingsService.get(),
    });
  });

  router.get("/images/:id", (req, res) => {
    const image = imageRepository.getImageById(req.params.id);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json(image);
  });

  router.get("/presets", (_req, res) => {
    res.json({ items: imageRepository.listPresets(), settings: settingsService.get() });
  });

  router.patch("/control", async (req, res) => {
    const parsed = controlSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }
    try {
      const settings = settingsService.update({
        activePresetId: parsed.data.activePresetId,
        retouchIntensity: parsed.data.retouchIntensity,
        category: parsed.data.category as ShootCategory | undefined,
      });
      const stats = await queueClient.stats();
      imageRepository.setQueueStats(stats);
      realtimeHub.broadcastControlUpdated(settings, stats);
      res.json({ settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update control";
      res.status(400).json({ error: message });
    }
  });

  router.post("/images/upload", upload.array("images", 64), async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      res.status(400).json({ error: "Missing files" });
      return;
    }

    const settings = settingsService.get();
    const created = [];
    for (const file of files) {
      const ext = path.extname(file.originalname) || ".jpg";
      const imageId = randomUUID();
      const originalFile = `${imageId}${ext.toLowerCase()}`;
      const originalPath = path.join(env.storagePaths.originals, originalFile);
      await fs.rename(file.path, originalPath);

      const now = new Date().toISOString();
      const image = imageRepository.createImage({
        id: imageId,
        fileName: file.originalname,
        sourcePath: originalPath,
        originalPath,
        originalUrl: toStorageUrl(originalPath),
        status: "queued",
        createdAt: now,
        updatedAt: now,
        presetId: settings.activePresetId,
        retouchIntensity: settings.retouchIntensity,
        shootCategory: settings.category,
        metadata: {
          from: "api",
          originalName: file.originalname,
          fileSize: file.size,
        },
      });
      created.push(image);
      realtimeHub.publishImageCreated(image);
      await queueClient.add({
        imageId: image.id,
        originalPath: image.originalPath,
      });
    }
    const stats = await queueClient.stats();
    imageRepository.setQueueStats(stats);
    realtimeHub.publishQueue(stats);
    res.status(201).json({ uploaded: created.length, items: created });
  });

  router.post("/batch/apply", async (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    const { imageIds, activePresetId, retouchIntensity, category } = parsed.data;
    const queued: string[] = [];

    for (const imageId of imageIds) {
      const image = imageRepository.getImageById(imageId);
      if (!image) continue;

      const presetId = activePresetId || image.presetId;
      const preset = imageRepository.getPresetById(presetId);
      if (!preset) continue;

      const next = imageRepository.updateImage(imageId, {
        status: "queued",
        presetId,
        retouchIntensity: typeof retouchIntensity === "number" ? retouchIntensity : image.retouchIntensity,
        shootCategory: (category as ShootCategory) || image.shootCategory,
        statusMessage: "Queued from batch apply",
      });

      if (!next) continue;
      queued.push(next.id);
      realtimeHub.publishImageUpdated(next);
      await queueClient.add({
        imageId: next.id,
        originalPath: next.originalPath,
      });
    }

    const stats = await queueClient.stats();
    imageRepository.setQueueStats(stats);
    realtimeHub.publishBatch(
      {
        imageIds: queued,
        appliedPresetId: activePresetId,
        retouchIntensity,
        category,
      },
      stats,
    );
    realtimeHub.publishQueue(stats);
    res.json({ queued: queued.length, imageIds: queued });
  });

  return router;
}
