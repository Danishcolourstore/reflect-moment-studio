import path from "node:path";
import express from "express";
import cors from "cors";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import type { MetadataService } from "./metadata.js";
import type { PresetService } from "./presets.js";
import type { ProcessingQueue } from "./queue.js";
import type { MirrorRepository } from "./repository.js";
import type { EventBus } from "./eventBus.js";
import type { ReprocessOptions } from "./types.js";
import fs from "node:fs/promises";

const optionsSchema = z.object({
  preset: z.enum(["balanced", "bright-clean", "moody-cinematic", "skin-first"]).optional(),
  retouchIntensity: z.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "wedding", "fashion", "product", "event"]).optional(),
});

const batchSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
  preset: z.enum(["balanced", "bright-clean", "moody-cinematic", "skin-first"]).optional(),
  retouchIntensity: z.number().min(0).max(1).optional(),
  category: z.enum(["portrait", "wedding", "fashion", "product", "event"]).optional(),
});

export function createApi(
  config: AppConfig,
  repository: MirrorRepository,
  metadata: MetadataService,
  presets: PresetService,
  queue: ProcessingQueue,
  bus: EventBus,
): express.Express {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/files", express.static(config.storageRoot, { fallthrough: false, immutable: false }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      queue: queue.snapshot(),
      controls: repository.getControls(),
      now: new Date().toISOString(),
    });
  });

  app.get("/api/bootstrap", (_req, res) => {
    res.json({
      presets: repository.listPresets(),
      categories: repository.listCategories(),
      controls: repository.getControls(),
      queue: queue.snapshot(),
      images: repository.listImages({ limit: 250 }),
    });
  });

  app.get("/api/images", (req, res) => {
    const status = req.query.status;
    const category = req.query.category;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    res.json({
      images: repository.listImages({
        status:
          typeof status === "string" &&
          ["queued", "processing", "done", "error"].includes(status)
            ? (status as "queued" | "processing" | "done" | "error")
            : undefined,
        category:
          typeof category === "string" &&
          ["portrait", "wedding", "fashion", "product", "event"].includes(category)
            ? (category as "portrait" | "wedding" | "fashion" | "product" | "event")
            : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
      }),
    });
  });

  app.get("/api/images/:id", (req, res) => {
    const image = repository.getImage(req.params.id);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json({ image });
  });

  app.get("/api/presets", (_req, res) => {
    res.json({ presets: repository.listPresets() });
  });

  app.get("/api/categories", (_req, res) => {
    res.json({ categories: repository.listCategories() });
  });

  app.get("/api/controls", (_req, res) => {
    res.json({ controls: repository.getControls() });
  });

  app.patch("/api/controls", (req, res) => {
    const parsed = optionsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const controls = presets.updateGlobalControls(parsed.data);
    metadata.setAllGlobal(controls.preset, controls.retouchIntensity, controls.category);

    for (const row of metadata.list()) {
      queue.enqueue(row.id);
    }
    bus.publish({ type: "controls.updated", controls });
    bus.publish({ type: "queue.stats", queue: queue.snapshot() });
    res.json({ controls });
  });

  app.patch("/api/images/:id", (req, res) => {
    const parsed = optionsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const options = parsed.data as ReprocessOptions;
    const row = metadata.applyImageOptions(req.params.id, {
      preset: presets.sanitizePreset(options.preset),
      retouchIntensity: presets.sanitizeRetouchIntensity(options.retouchIntensity),
      category: presets.sanitizeCategory(options.category),
    });
    if (!row) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    queue.enqueue(row.id);
    bus.publish({ type: "queue.stats", queue: queue.snapshot() });
    res.json({ image: repository.getImage(row.id) });
  });

  app.post("/api/images/batch", (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const options: ReprocessOptions = {
      preset: parsed.data.preset ? presets.sanitizePreset(parsed.data.preset) : undefined,
      retouchIntensity:
        typeof parsed.data.retouchIntensity === "number"
          ? presets.sanitizeRetouchIntensity(parsed.data.retouchIntensity)
          : undefined,
      category: parsed.data.category ? presets.sanitizeCategory(parsed.data.category) : undefined,
    };

    const rows = metadata.applyBatchOptions(parsed.data.imageIds, options);
    for (const row of rows) {
      queue.enqueue(row.id);
    }
    bus.publish({ type: "queue.stats", queue: queue.snapshot() });
    res.json({
      updated: rows.length,
      images: rows
        .map((row) => repository.getImage(row.id))
        .filter((row): row is NonNullable<typeof row> => Boolean(row)),
    });
  });

  app.get("/api/metadata/:id", async (req, res) => {
    try {
      const image = repository.getImage(req.params.id);
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }
      const filePath = path.join(config.storageRoot, "meta", "images.json");
      const raw = await fs.readFile(filePath, "utf8");
      const all = JSON.parse(raw) as Array<{ id: string } & Record<string, unknown>>;
      const row = all.find((item) => item.id === req.params.id);
      if (!row) {
        res.status(404).json({ error: "Metadata not found" });
        return;
      }
      res.json({ metadata: row });
    } catch {
      res.status(404).json({ error: "Metadata not available" });
    }
  });

  return app;
}
