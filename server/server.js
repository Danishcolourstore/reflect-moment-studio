import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import multer from "multer";
import FtpSrv from "ftp-srv";
import pino from "pino";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import {
  batchUpdateCategory,
  getImage,
  getLiveControl,
  getPreset,
  getPresets,
  listImages,
  setLiveControl,
  updateImageControl,
  updateImageFailed,
  updateImageProcessingResult,
  updateImageStatus,
} from "./database.js";
import { createRealtimeHub } from "./realtime.js";
import { closeQueue, enqueueJob, getQueueStats } from "./queue.js";
import { SHOOT_CATEGORIES } from "./presets.js";
import { startIncomingWatcher } from "./ingest.js";
import { ensureDirectories, publicStorageUrl } from "./storage.js";
import { processImage } from "./processor.js";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

function toClientImage(image) {
  if (!image) return null;
  return {
    ...image,
    previewUrl: image.previewPath ? publicStorageUrl(image.previewPath) : null,
    processedUrl: image.processedPath ? publicStorageUrl(image.processedPath) : null,
    sourceUrl: publicStorageUrl(image.sourcePath),
  };
}

async function handleProcessImage(imageId, jobId, realtime) {
  const image = getImage(imageId);
  if (!image) throw new Error(`Image not found: ${imageId}`);

  updateImageStatus(imageId, "processing");
  realtime.broadcast("image:status", { id: imageId, status: "processing", jobId });

  const preset = getPreset(image.presetId);
  if (!preset) throw new Error(`Preset not found: ${image.presetId}`);

  const previewPath = path.join(config.previewsDir, `${image.id}.jpg`);
  const processedPath = path.join(config.processedDir, `${image.id}.jpg`);
  const metadataPath = path.join(config.metadataDir, `${image.id}.json`);

  const result = await processImage({
    imageId: image.id,
    sourcePath: image.sourcePath,
    previewPath,
    processedPath,
    metadataPath,
    preset,
    retouchIntensity: image.retouchIntensity,
    category: image.category,
  });

  updateImageProcessingResult(image.id, result);
  const updated = getImage(image.id);
  realtime.broadcast("image:done", toClientImage(updated));
}

function parseLimit(input, fallback = 100) {
  const parsed = Number.parseInt(String(input ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 500);
}

function parseOffset(input, fallback = 0) {
  const parsed = Number.parseInt(String(input ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(parsed, 0);
}

export async function startMirrorAiServer() {
  await ensureDirectories();
  const uploadDir = path.join(config.storageRoot, "tmp-uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "4mb" }));
  app.use(
    pinoHttp({
      logger,
      quietReqLogger: true,
    }),
  );

  app.use("/storage", express.static(config.storageRoot));

  const realtime = createRealtimeHub({
    path: config.wsPath,
    onClientInit: () => ({
      images: listImages({ limit: 120, offset: 0 }).map(toClientImage),
      control: getLiveControl(),
      presets: getPresets(),
      queue: getQueueStats(),
    }),
  });

  const enqueueForProcessing = async (image) => {
    const { jobId, task } = await enqueueJob(
      async ({ imageId }, createdJobId) => {
        await handleProcessImage(imageId, createdJobId, realtime);
      },
      { imageId: image.id },
    );
    task.catch((error) => {
      updateImageFailed(image.id, error.message);
      realtime.broadcast("image:status", { id: image.id, status: "failed", error: error.message });
      logger.error({ err: error, imageId: image.id, jobId }, "processing failed");
    });
    realtime.broadcast("image:queued", {
      id: image.id,
      jobId,
      status: "queued",
      queue: getQueueStats(),
    });
  };

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "mirror-ai",
      queue: getQueueStats(),
      now: new Date().toISOString(),
    });
  });

  app.get("/api/images", (req, res) => {
    const limit = parseLimit(req.query.limit, 120);
    const offset = parseOffset(req.query.offset, 0);
    const images = listImages({ limit, offset }).map(toClientImage);
    res.json({ items: images, queue: getQueueStats() });
  });

  app.get("/api/images/:id", (req, res) => {
    const image = getImage(req.params.id);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json(toClientImage(image));
  });

  app.get("/api/presets", (_req, res) => {
    res.json({ items: getPresets() });
  });

  app.get("/api/control", (_req, res) => {
    res.json({ ...getLiveControl(), categories: SHOOT_CATEGORIES });
  });

  app.patch("/api/control", (req, res) => {
    const body = req.body ?? {};
    const next = setLiveControl({
      activePresetId: typeof body.activePresetId === "string" ? body.activePresetId : undefined,
      retouchIntensity:
        typeof body.retouchIntensity === "number" ? body.retouchIntensity : undefined,
      activeCategory: typeof body.activeCategory === "string" ? body.activeCategory : undefined,
    });
    realtime.broadcast("control:updated", next);
    res.json(next);
  });

  app.post("/api/images/:id/requeue", async (req, res) => {
    const image = getImage(req.params.id);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    const presetId = typeof req.body?.presetId === "string" ? req.body.presetId : image.presetId;
    const retouchIntensity =
      typeof req.body?.retouchIntensity === "number"
        ? req.body.retouchIntensity
        : image.retouchIntensity;

    updateImageControl({ id: image.id, presetId, retouchIntensity });
    updateImageStatus(image.id, "queued");

    const updated = getImage(image.id);
    realtime.broadcast("image:updated", toClientImage(updated));
    await enqueueForProcessing(updated);
    res.json({ ok: true, item: toClientImage(updated) });
  });

  app.post("/api/images/batch/apply", async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
    if (ids.length === 0) {
      res.status(400).json({ error: "ids is required" });
      return;
    }

    const presetId = typeof req.body?.presetId === "string" ? req.body.presetId : null;
    const retouchIntensity =
      typeof req.body?.retouchIntensity === "number" ? req.body.retouchIntensity : null;
    const category = typeof req.body?.category === "string" ? req.body.category : null;

    const touched = [];
    for (const id of ids) {
      const image = getImage(id);
      if (!image) continue;

      if (presetId || typeof retouchIntensity === "number") {
        updateImageControl({
          id,
          presetId: presetId ?? image.presetId,
          retouchIntensity:
            typeof retouchIntensity === "number" ? retouchIntensity : image.retouchIntensity,
        });
      }
      if (category && SHOOT_CATEGORIES.includes(category)) {
        batchUpdateCategory({ ids: [id], category });
      }
      updateImageStatus(id, "queued");
      const updated = getImage(id);
      touched.push(updated);
      realtime.broadcast("image:updated", toClientImage(updated));
      await enqueueForProcessing(updated);
    }

    res.json({ ok: true, updated: touched.map(toClientImage) });
  });

  const upload = multer({ dest: uploadDir });
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    try {
      const originalExt = path.extname(req.file.originalname || "").toLowerCase() || ".jpg";
      const finalName = `${Date.now()}-${randomUUID()}${originalExt}`;
      const incomingPath = path.join(config.ftpIncomingDir, finalName);
      await fs.copyFile(req.file.path, incomingPath);
      await fs.unlink(req.file.path).catch(() => {});
      res.json({ accepted: true, queuedPath: incomingPath });
    } catch (error) {
      logger.error({ err: error }, "upload-enqueue-failed");
      res.status(500).json({ error: "Upload ingest failed" });
    }
  });

  const httpServer = createServer(app);
  realtime.attach(httpServer);

  const watcher = startIncomingWatcher(
    async (image) => {
      realtime.broadcast("image:ingested", toClientImage(image));
      await enqueueForProcessing(image);
    },
    (error, filePath) => {
      logger.error({ err: error, filePath }, "watch-ingest-error");
    },
  );

  const ftpServer = new FtpSrv({
    url: `ftp://${config.ftpHost}:${config.ftpPort}`,
    anonymous: false,
    greeting: ["Mirror AI FTP ingest online"],
  });

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username !== config.ftpUsername || password !== config.ftpPassword) {
      reject(new Error("Invalid FTP credentials"));
      return;
    }
    resolve({ root: config.ftpIncomingDir });
  });

  await ftpServer.listen();

  await new Promise((resolve) => {
    httpServer.listen(config.apiPort, config.apiHost, resolve);
  });

  logger.info(
    {
      api: `http://${config.apiHost}:${config.apiPort}`,
      wsPath: config.wsPath,
      ftp: `ftp://${config.ftpHost}:${config.ftpPort}`,
      ftpRoot: config.ftpIncomingDir,
      storageRoot: config.storageRoot,
    },
    "Mirror AI server started",
  );

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down Mirror AI...");
    try {
      await watcher.close();
    } catch {
      // no-op
    }
    await realtime.close();
    await closeQueue();
    await ftpServer.close();
    await new Promise((resolve) => httpServer.close(resolve));
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return {
    app,
    httpServer,
    ftpServer,
    watcher,
  };
}

export { logger };
