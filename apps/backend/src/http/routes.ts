import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { z } from "zod";
import { imageRepository } from "../lib/repository.js";
import { buildPublicImageUrl } from "../lib/public-url.js";
import { eventBus } from "../lib/event-bus.js";
import { listPresets, type PresetId } from "../lib/presets.js";
import type { ProcessingQueue } from "../lib/queue.js";
import type { ImageRecord, ProcessingStatus, ShootCategory } from "../types.js";
import type { StorageDirs } from "../lib/storage.js";

const controlUpdateSchema = z.object({
  presetId: z.enum(["clean", "editorial", "warm-film", "night-luxury"]).optional(),
  retouchIntensity: z.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "fashion", "wedding", "product", "street"]).optional(),
});

const batchSchema = z.object({
  ids: z.array(z.string()).min(1),
  presetId: z.enum(["clean", "editorial", "warm-film", "night-luxury"]).optional(),
  retouchIntensity: z.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "fashion", "wedding", "product", "street"]).optional(),
});

const imageListQuery = z.object({
  limit: z.coerce.number().int().positive().max(200).default(80),
});

function withUrls(item: ImageRecord) {
  return {
    ...item,
    originalUrl: buildPublicImageUrl(item.originalPath),
    previewUrl: item.previewPath ? buildPublicImageUrl(item.previewPath) : null,
    processedUrl: item.processedPath ? buildPublicImageUrl(item.processedPath) : null,
  };
}

async function enqueueReprocess(queue: ProcessingQueue, dirs: StorageDirs, id: string): Promise<void> {
  const image = imageRepository.findById(id);
  if (!image) return;
  const canonicalOriginal = path.resolve(dirs.originals, image.originalStoredFilename);
  if (image.originalPath !== canonicalOriginal) {
    await fs.copyFile(image.originalPath, canonicalOriginal);
    imageRepository.update(id, { originalPath: canonicalOriginal });
  }
  await queue.enqueue(id);
}

export function createMirrorRouter(queue: ProcessingQueue, dirs: StorageDirs) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      now: Date.now(),
      version: "1.0.0",
    });
  });

  router.get("/presets", (_req, res) => {
    res.json({ presets: listPresets() });
  });

  router.get("/images", (req, res) => {
    const parsed = imageListQuery.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query" });
    }
    const images = imageRepository.list(parsed.data.limit).map(withUrls);
    return res.json({ images });
  });

  router.get("/images/:id", (req, res) => {
    const item = imageRepository.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Image not found" });
    }
    return res.json({ image: withUrls(item) });
  });

  router.patch("/images/:id/control", async (req, res) => {
    const payload = controlUpdateSchema.safeParse(req.body);
    if (!payload.success) {
      return res.status(400).json({ error: "Invalid control payload" });
    }
    const image = imageRepository.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const patch: Partial<ImageRecord["controls"]> = {};
    if (payload.data.presetId) patch.presetId = payload.data.presetId as PresetId;
    if (typeof payload.data.retouchIntensity === "number") patch.retouchIntensity = payload.data.retouchIntensity;
    if (payload.data.category) patch.category = payload.data.category as ShootCategory;

    const updated = imageRepository.update(req.params.id, {
      controls: {
        ...image.controls,
        ...patch,
      },
      status: "queued",
      error: null,
    });
    eventBus.emitImageStatus(updated);
    await enqueueReprocess(queue, dirs, req.params.id);

    return res.json({ image: withUrls(imageRepository.findByIdOrThrow(req.params.id)) });
  });

  router.post("/batch/apply", async (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid batch payload" });
    }
    const { ids, ...controls } = parsed.data;
    const touched: string[] = [];

    for (const id of ids) {
      const found = imageRepository.findById(id);
      if (!found) continue;
      imageRepository.update(id, {
        controls: {
          ...found.controls,
          ...(controls.presetId ? { presetId: controls.presetId as PresetId } : {}),
          ...(typeof controls.retouchIntensity === "number" ? { retouchIntensity: controls.retouchIntensity } : {}),
          ...(controls.category ? { category: controls.category as ShootCategory } : {}),
        },
        status: "queued" satisfies ProcessingStatus,
        error: null,
      });
      touched.push(id);
      eventBus.emitImageStatus(imageRepository.findByIdOrThrow(id));
    }

    await Promise.all(touched.map((id) => enqueueReprocess(queue, dirs, id)));

    return res.json({
      updated: touched.length,
      images: touched.map((id) => withUrls(imageRepository.findByIdOrThrow(id))),
    });
  });

  const controlSchema = z.object({
    presetId: z.enum(["clean", "editorial", "warm-film", "night-luxury"]).optional(),
    retouchIntensity: z.number().min(0).max(1).optional(),
    category: z.enum(["portrait", "fashion", "wedding", "product", "street"]).optional(),
  });

  router.get("/controls", (_req, res) => {
    return res.json({ controls: imageRepository.getControls() });
  });

  router.patch("/controls", (req, res) => {
    const parsed = controlSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid controls payload" });
    }
    const controls = imageRepository.setControls(parsed.data);
    eventBus.emitControlState(controls);
    return res.json({ controls });
  });

  router.get("/stats", (_req, res) => {
    const all = imageRepository.list(2000);
    const stats = all.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.status] += 1;
        return acc;
      },
      {
        total: 0,
        queued: 0,
        processing: 0,
        done: 0,
        error: 0,
      } as Record<ProcessingStatus | "total", number>,
    );
    return res.json({ stats });
  });

  return router;
}
