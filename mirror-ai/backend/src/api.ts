import fs from "node:fs/promises";
import path from "node:path";
import express from "express";
import type { Express } from "express";
import mime from "mime-types";
import { z } from "zod";
import { config } from "./config.js";
import { logger } from "./logger.js";
import {
  getImageById,
  getSettings,
  listImages,
  updateImageRecord,
  updateSettings,
} from "./metadataStore.js";
import { listPresets } from "./presets.js";
import { processingQueue } from "./queue.js";
import { serializeImage } from "./serializers.js";
import type { ImageRecord, PipelineOptions } from "./types.js";
import { nowIso } from "./utils.js";
import type { RealtimeHub } from "./realtime.js";

const settingsSchema = z.object({
  preset: z
    .enum(["mirror-clean", "golden-hour", "cinematic", "editorial", "natural-pop"])
    .optional(),
  retouchIntensity: z.coerce.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "wedding", "studio", "fashion", "event", "product"]).optional(),
});

const applySchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
  preset: z.enum(["mirror-clean", "golden-hour", "cinematic", "editorial", "natural-pop"]),
  retouchIntensity: z.coerce.number().min(0).max(1),
  category: z.enum(["portrait", "wedding", "studio", "fashion", "event", "product"]).optional(),
});

export function registerApi(app: Express, realtime: RealtimeHub) {
  app.get("/health", (_req, res) => {
    res.json({ ok: true, ts: nowIso() });
  });

  app.get("/api/presets", (_req, res) => {
    res.json({ items: listPresets() });
  });

  app.get("/api/settings", async (_req, res) => {
    const settings = await getSettings();
    res.json(settings);
  });

  app.patch("/api/settings", async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid settings payload" });
    }
    const next = await updateSettings(parsed.data);
    realtime.broadcast({
      type: "settings:updated",
      payload: next,
      timestamp: nowIso(),
    });
    return res.json(next);
  });

  app.get("/api/images", async (req, res) => {
    const limit = Number(req.query.limit ?? 200);
    const images = await listImages(limit);
    res.json({ items: images.map(serializeImage) });
  });

  app.get("/api/images/:id", async (req, res) => {
    const item = await getImageById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Image not found" });
    }
    return res.json(serializeImage(item));
  });

  app.post("/api/images/:id/reprocess", async (req, res) => {
    const image = await getImageById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid reprocess payload" });
    }
    const options: PipelineOptions = {
      preset: parsed.data.preset ?? image.preset,
      retouchIntensity: parsed.data.retouchIntensity ?? image.retouchIntensity,
      category: parsed.data.category ?? image.category,
    };
    const updated = await updateImageRecord(image.id, (record) => ({
      ...record,
      preset: options.preset,
      category: options.category,
      retouchIntensity: options.retouchIntensity,
      status: "processing",
      updatedAt: nowIso(),
      error: undefined,
    }));
    if (!updated) {
      return res.status(404).json({ error: "Image not found" });
    }
    await processingQueue.enqueue({
      imageId: image.id,
      originalPath: image.originalPath,
      filename: image.filename,
      options,
    });
    realtime.broadcast({
      type: "image:processing",
      payload: serializeImage(updated),
      timestamp: nowIso(),
    });
    return res.json({ ok: true, image: serializeImage(updated) });
  });

  app.post("/api/images/apply", async (req, res) => {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid batch payload" });
    }
    const output: ImageRecord[] = [];
    for (const imageId of parsed.data.imageIds) {
      const image = await getImageById(imageId);
      if (!image) {
        continue;
      }
      const options: PipelineOptions = {
        preset: parsed.data.preset,
        retouchIntensity: parsed.data.retouchIntensity,
        category: parsed.data.category ?? image.category,
      };
      const updated = await updateImageRecord(image.id, (record) => ({
        ...record,
        preset: options.preset,
        retouchIntensity: options.retouchIntensity,
        category: options.category,
        status: "processing",
        error: undefined,
        updatedAt: nowIso(),
      }));
      if (!updated) {
        continue;
      }
      output.push(updated);
      await processingQueue.enqueue({
        imageId: image.id,
        originalPath: image.originalPath,
        filename: image.filename,
        options,
      });
      realtime.broadcast({
        type: "image:processing",
        payload: serializeImage(updated),
        timestamp: nowIso(),
      });
    }
    return res.json({ ok: true, queued: output.length, items: output.map(serializeImage) });
  });

  app.get("/media/*path", async (req, res) => {
    const rel = String(req.params.path || "");
    const target = path.resolve(config.paths.storageRoot, rel);
    if (!target.startsWith(config.paths.storageRoot)) {
      return res.status(400).json({ error: "Invalid media path" });
    }
    try {
      const stat = await fs.stat(target);
      if (!stat.isFile()) {
        return res.status(404).json({ error: "File not found" });
      }
      const type = mime.lookup(target) || "application/octet-stream";
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "public, max-age=60");
      const file = await fs.readFile(target);
      return res.send(file);
    } catch (error) {
      logger.warn({ err: error, target }, "failed to read media");
      return res.status(404).json({ error: "File not found" });
    }
  });
}
