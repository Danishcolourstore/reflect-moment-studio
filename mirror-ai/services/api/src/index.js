import http from "node:http";
import express from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { QueueEvents } from "bullmq";
import {
  ImageStatus,
  PRESETS,
  ShootCategories,
  PROCESSED_FULL_DIR,
  PROCESSED_PREVIEW_DIR,
  ORIGINALS_DIR,
  ensureStorage,
  listImageMetadata,
  readImageMetadata,
  readControlSettings,
  updateControlSettings,
  updateImageMetadata,
} from "@mirror-ai/shared";
import { config } from "./config.js";
import { buildRedisConnection, closeQueue, enqueueImageJob, mirrorQueue } from "./queue.js";
import { startFtpServer } from "./ftp.js";
import { startIngestionWatcher } from "./ingestion.js";
import { attachSocket, broadcast } from "./broadcast.js";

const PRESET_IDS = new Set(PRESETS.map((preset) => preset.id));
const CATEGORY_SET = new Set(ShootCategories);

function parseQueueReturnValue(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function sanitizePresetId(value, fallback) {
  if (typeof value === "string" && PRESET_IDS.has(value)) {
    return value;
  }
  return fallback;
}

function sanitizeCategory(value, fallback) {
  if (typeof value === "string" && CATEGORY_SET.has(value)) {
    return value;
  }
  return fallback;
}

function toPublicImage(record) {
  return {
    ...record,
    urls: {
      original: record.originalPath ? `${config.api.publicBaseUrl}/images/originals/${record.originalPath}` : null,
      processedFull: record.fullPath ? `${config.api.publicBaseUrl}/images/processed/full/${record.fullPath}` : null,
      preview: record.previewPath ? `${config.api.publicBaseUrl}/images/processed/preview/${record.previewPath}` : null,
    },
  };
}

async function buildServer() {
  await ensureStorage();

  const app = express();
  app.use(cors({ origin: config.api.origin }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/images/originals", express.static(ORIGINALS_DIR));
  app.use("/images/processed/full", express.static(PROCESSED_FULL_DIR));
  app.use("/images/processed/preview", express.static(PROCESSED_PREVIEW_DIR));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "mirror-ai-api",
      now: new Date().toISOString(),
    });
  });

  app.get("/api/presets", (_req, res) => {
    res.json({ presets: PRESETS });
  });

  app.get("/api/control", async (_req, res, next) => {
    try {
      const control = await readControlSettings();
      res.json({ control });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/control", async (req, res, next) => {
    try {
      const updates = req.body ?? {};
      const current = await readControlSettings();
      const sanitized = {};
      if (updates.presetId !== undefined) {
        const nextPresetId = sanitizePresetId(updates.presetId, null);
        if (!nextPresetId) {
          res.status(400).json({ error: "presetId is invalid" });
          return;
        }
        sanitized.presetId = nextPresetId;
      }
      if (updates.category !== undefined) {
        const nextCategory = sanitizeCategory(updates.category, null);
        if (!nextCategory) {
          res.status(400).json({ error: "category is invalid" });
          return;
        }
        sanitized.category = nextCategory;
      }
      if (updates.retouchIntensity !== undefined) {
        const parsed = Number(updates.retouchIntensity);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
          res.status(400).json({ error: "retouchIntensity must be a number between 0 and 1" });
          return;
        }
        sanitized.retouchIntensity = parsed;
      }

      const nextControl = await updateControlSettings({
        presetId: sanitized.presetId ?? current.presetId,
        retouchIntensity: sanitized.retouchIntensity ?? current.retouchIntensity,
        category: sanitized.category ?? current.category,
      });
      broadcast("control:updated", { control: nextControl });
      res.json({ control: nextControl });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/images", async (_req, res, next) => {
    try {
      const images = await listImageMetadata();
      res.json({ images: images.map(toPublicImage) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/images/:id", async (req, res, next) => {
    try {
      const image = await readImageMetadata(req.params.id);
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }
      res.json({ image: toPublicImage(image) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/images/:id/reprocess", async (req, res, next) => {
    try {
      const image = await readImageMetadata(req.params.id);
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }
      const controls = await readControlSettings();
      const nextPresetId = sanitizePresetId(req.body?.presetId, controls.presetId);
      const nextRetouch = Number(req.body?.retouchIntensity ?? controls.retouchIntensity ?? 0.3);
      if (!Number.isFinite(nextRetouch) || nextRetouch < 0 || nextRetouch > 1) {
        res.status(400).json({ error: "retouchIntensity must be a number between 0 and 1" });
        return;
      }
      const nextCategory = sanitizeCategory(req.body?.category, image.category ?? controls.category);

      const updated = await updateImageMetadata(image.id, () => ({
        presetId: nextPresetId,
        retouchIntensity: nextRetouch,
        category: nextCategory,
        status: ImageStatus.PROCESSING,
        error: null,
      }));

      await enqueueImageJob({
        imageId: updated.id,
        presetId: updated.presetId,
        retouchIntensity: updated.retouchIntensity,
        category: updated.category,
      });

      const payload = toPublicImage(updated);
      broadcast("image:updated", payload);
      res.json({ image: payload });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/batch/apply", async (req, res, next) => {
    try {
      const imageIds = Array.isArray(req.body?.imageIds) ? req.body.imageIds : [];
      if (imageIds.length === 0) {
        res.status(400).json({ error: "imageIds is required" });
        return;
      }
      const controls = await readControlSettings();
      const presetId = sanitizePresetId(req.body?.presetId, controls.presetId);
      const retouchIntensity = Number(req.body?.retouchIntensity ?? controls.retouchIntensity ?? 0.3);
      if (!Number.isFinite(retouchIntensity) || retouchIntensity < 0 || retouchIntensity > 1) {
        res.status(400).json({ error: "retouchIntensity must be a number between 0 and 1" });
        return;
      }
      const category = sanitizeCategory(req.body?.category, controls.category);

      const updated = [];
      for (const imageId of imageIds) {
        const image = await readImageMetadata(imageId);
        if (!image) {
          continue;
        }
        const row = await updateImageMetadata(imageId, () => ({
          presetId,
          retouchIntensity,
          category: category ?? image.category,
          status: ImageStatus.PROCESSING,
          error: null,
        }));
        await enqueueImageJob({
          imageId,
          presetId: row.presetId,
          retouchIntensity: row.retouchIntensity,
          category: row.category,
        });
        const payload = toPublicImage(row);
        updated.push(payload);
        broadcast("image:updated", payload);
      }

      res.json({ updatedCount: updated.length, images: updated });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error("[api] unhandled error", error);
    res.status(500).json({
      error: "Internal server error",
      message: error?.message ?? "Unknown error",
    });
  });

  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: config.api.origin,
      methods: ["GET", "POST", "PATCH"],
    },
  });
  attachSocket(io);

  io.on("connection", async (socket) => {
    socket.emit("welcome", { connectedAt: new Date().toISOString() });
    try {
      const images = await listImageMetadata();
      socket.emit("images:snapshot", images.map(toPublicImage));
      const control = await readControlSettings();
      socket.emit("control:updated", { control });
    } catch (error) {
      console.error("[api] failed to emit initial snapshot", error);
    }
  });

  const queueEvents = new QueueEvents("mirror-ai-images", { connection: buildRedisConnection() });

  queueEvents.on("completed", async ({ returnvalue }) => {
    const record = parseQueueReturnValue(returnvalue);
    if (record?.id) {
      broadcast("image:updated", toPublicImage(record));
    }
  });

  queueEvents.on("failed", async ({ jobId, failedReason }) => {
    try {
      const job = await mirrorQueue.getJob(jobId);
      const imageId = job?.data?.imageId;
      if (imageId) {
        const image = await readImageMetadata(imageId);
        if (image) {
          broadcast("image:updated", toPublicImage(image));
        }
      }
      broadcast("image:failed", { jobId, reason: failedReason });
    } catch (error) {
      console.error("[api] failed handler error", error);
    }
  });

  const ftpServer = await startFtpServer();
  const watcher = await startIngestionWatcher();

  await new Promise((resolve) => {
    server.listen(config.api.port, config.api.host, resolve);
  });
  console.log(`[api] http://${config.api.host}:${config.api.port}`);

  const shutdown = async () => {
    console.log("[api] shutting down");
    await Promise.allSettled([
      queueEvents.close(),
      ftpServer.close(),
      watcher.close(),
      closeQueue(),
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve(undefined)));
      }),
    ]);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

buildServer().catch((error) => {
  console.error("[api] failed to start", error);
  process.exit(1);
});
