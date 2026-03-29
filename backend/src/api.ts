import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { env, storagePaths } from "./config.js";
import { db } from "./database.js";
import type { TypedEventBus } from "./events.js";
import type { QueueTask } from "./queue/types.js";
import type { BatchOperation, RuntimeSettings, ShootCategory } from "./types.js";

const parseRetouch = (value: unknown): number => {
  const n = Number(value ?? 0.25);
  if (Number.isNaN(n)) return 0.25;
  return Math.max(0, Math.min(1, n));
};

const parseCategory = (value: unknown): ShootCategory => {
  const valid: ShootCategory[] = ["wedding", "portrait", "fashion", "commercial", "event"];
  const asString = String(value ?? "portrait");
  return valid.includes(asString as ShootCategory) ? (asString as ShootCategory) : "portrait";
};

export const createApiServer = (
  eventBus: TypedEventBus,
  enqueue: (job: QueueTask) => Promise<void>,
) => {
  const app = express();
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json({ limit: "2mb" }));
  app.use("/storage", express.static(storagePaths.root));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/snapshot", async (_req, res, next) => {
    try {
      res.json(await db.getSnapshot());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/settings", async (req, res, next) => {
    try {
      const patch: Partial<RuntimeSettings> = {};
      if (req.body.activePresetId) patch.activePresetId = String(req.body.activePresetId);
      if (req.body.retouchIntensity !== undefined) patch.retouchIntensity = parseRetouch(req.body.retouchIntensity);
      if (req.body.activeCategory !== undefined) patch.activeCategory = parseCategory(req.body.activeCategory);

      const settings = await db.patchSettings(patch);
      eventBus.emit("settingsUpdated", settings);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/images/:id/reprocess", async (req, res, next) => {
    try {
      const image = await db.getImageById(req.params.id);
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      const settings = await db.getSettings();
      const presetId = String(req.body.presetId ?? settings.activePresetId);
      const retouchIntensity = parseRetouch(req.body.retouchIntensity ?? settings.retouchIntensity);

      const updated = await db.patchImage(image.id, {
        status: "queued",
        error: undefined,
      });
      if (!updated) {
        res.status(404).json({ error: "Image not found" });
        return;
      }
      eventBus.emit("imageUpdated", updated);

      await enqueue({
        imageId: image.id,
        presetId,
        retouchIntensity,
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/batches/reprocess", async (req, res, next) => {
    try {
      const imageIds = Array.isArray(req.body.imageIds)
        ? req.body.imageIds.map((id: unknown) => String(id))
        : [];
      if (imageIds.length === 0) {
        res.status(400).json({ error: "imageIds is required" });
        return;
      }

      const settings = await db.getSettings();
      const presetId = String(req.body.presetId ?? settings.activePresetId);
      const retouchIntensity = parseRetouch(req.body.retouchIntensity ?? settings.retouchIntensity);
      const now = new Date().toISOString();
      const batch: BatchOperation = {
        id: randomUUID(),
        imageIds,
        presetId,
        retouchIntensity,
        status: "running",
        total: imageIds.length,
        completed: 0,
        createdAt: now,
        updatedAt: now,
      };
      await db.upsertBatch(batch);
      eventBus.emit("batchUpdated", batch);

      for (const imageId of imageIds) {
        const record = await db.patchImage(imageId, { status: "queued", error: undefined });
        if (record) {
          eventBus.emit("imageUpdated", record);
          await enqueue({
            imageId,
            presetId,
            retouchIntensity,
            batchId: batch.id,
          });
        }
      }

      res.json(batch);
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const err = error as Error;
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  });

  const server = app.listen(env.API_PORT, () => {
    console.log(`Mirror AI API listening on http://localhost:${env.API_PORT}`);
  });

  return {
    app,
    server,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
};
