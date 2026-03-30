import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import { z } from "zod";
import { mirrorDb } from "./db.js";
import { PRESETS, hasPreset } from "./presets.js";
import { registerIncomingImage } from "./ingest/register-image.js";
import { config } from "./config.js";
import type { ImageRecord } from "./types/models.js";
import { enqueueImageProcessing } from "./queueing.js";
import { logger } from "./logger.js";

const upload = multer({
  dest: config.tmpUploadDir,
  limits: {
    fileSize: 60 * 1024 * 1024,
  },
});

const controlSchema = z.object({
  activePresetId: z.string().optional(),
  retouchIntensity: z.number().min(0).max(1).optional(),
  shootCategory: z.string().min(1).max(60).optional(),
});

const batchSchema = z.object({
  ids: z.array(z.string()).min(1),
  presetId: z.string().optional(),
  retouchIntensity: z.number().min(0).max(1).optional(),
  shootCategory: z.string().min(1).max(60).optional(),
  reprocess: z.boolean().optional().default(true),
});

function parseLimit(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseImageRecordForUi(image: ImageRecord): ImageRecord {
  return {
    ...image,
    originalPath: path.basename(image.originalPath),
    previewPath: image.previewPath ? path.basename(image.previewPath) : undefined,
    fullPath: image.fullPath ? path.basename(image.fullPath) : undefined,
  };
}

export function createMirrorApi(): express.Express {
  const app = express();
  app.use(
    cors({
      origin: config.MIRROR_CORS_ORIGIN === "*" ? true : config.MIRROR_CORS_ORIGIN,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.use("/files", express.static(config.storageRoot, { maxAge: "1d", immutable: false }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "mirror-ai-api",
      time: new Date().toISOString(),
    });
  });

  app.get("/api/presets", (_req, res) => {
    res.json({ presets: PRESETS });
  });

  app.get("/api/control", (_req, res) => {
    res.json({ control: mirrorDb.getControl() });
  });

  app.patch("/api/control", (req, res) => {
    const parsed = controlSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid control payload", details: parsed.error.flatten() });
    }
    const payload = parsed.data;
    if (payload.activePresetId && !hasPreset(payload.activePresetId)) {
      return res.status(400).json({ error: "Preset does not exist" });
    }
    const control = mirrorDb.setControl(payload);
    return res.json({ control });
  });

  app.get("/api/images", (req, res) => {
    const limit = parseLimit(req.query.limit as string | undefined);
    const status = req.query.status as ImageRecord["status"] | undefined;
    const category = req.query.category as string | undefined;
    const images = mirrorDb
      .getAllImages({ limit, status, category })
      .map(parseImageRecordForUi);
    res.json({ images });
  });

  app.get("/api/images/:id", (req, res) => {
    const image = mirrorDb.getImageById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    return res.json({ image: parseImageRecordForUi(image) });
  });

  app.post("/api/images/upload", upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Missing image file" });
    }
    try {
      const image = await registerIncomingImage({
        sourcePath: req.file.path,
        fileName: req.file.originalname || req.file.filename,
        source: "api",
      });
      return res.status(201).json({ image: parseImageRecordForUi(image) });
    } finally {
      fs.promises.unlink(req.file.path).catch(() => undefined);
    }
  });

  app.post("/api/images/batch", async (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid batch payload", details: parsed.error.flatten() });
    }

    const { ids, presetId, retouchIntensity, shootCategory, reprocess } = parsed.data;
    if (presetId && !hasPreset(presetId)) {
      return res.status(400).json({ error: "Preset does not exist" });
    }
    const updated: ImageRecord[] = [];
    for (const id of ids) {
      const image = mirrorDb.getImageById(id);
      if (!image) continue;
      const next = mirrorDb.patchImage(id, {
        presetId: presetId ?? image.presetId,
        retouchIntensity: retouchIntensity ?? image.retouchIntensity,
        shootCategory: shootCategory ?? image.shootCategory,
        status: "queued",
      });
      if (next) {
        updated.push(next);
        if (reprocess) {
          await enqueueImageProcessing(next.id).catch((error) => {
            logger.error({ err: error, imageId: next.id }, "Failed to enqueue batch reprocess");
          });
        }
      }
    }

    return res.json({
      updated: updated.map(parseImageRecordForUi),
      updatedCount: updated.length,
    });
  });

  app.post("/api/images/:id/reprocess", async (req, res) => {
    const image = mirrorDb.getImageById(req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const next = mirrorDb.patchImage(image.id, {
      status: "queued",
      errorMessage: undefined,
    });
    if (!next) {
      return res.status(500).json({ error: "Failed to update image state" });
    }

    await enqueueImageProcessing(next.id);
    return res.json({ image: parseImageRecordForUi(next) });
  });

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({ error: message });
  });

  return app;
}
