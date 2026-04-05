import express from "express";
import path from "node:path";
import { PRESETS, CATEGORY_OPTIONS } from "./presets.js";
import { clamp } from "./utils.js";

function enrich(image) {
  return {
    ...image,
    originalUrl: image.originalFilePath
      ? `/assets/originals/${encodeURIComponent(image.originalFileName)}`
      : null,
    previewUrl: image.previewFilePath
      ? `/assets/previews/${encodeURIComponent(path.basename(image.previewFilePath))}`
      : null,
    processedUrl: image.processedFilePath
      ? `/assets/processed/${encodeURIComponent(path.basename(image.processedFilePath))}`
      : null,
  };
}

function parseBatchPayload(payload) {
  const ids = Array.isArray(payload?.imageIds)
    ? payload.imageIds.filter((value) => typeof value === "string" && value.length > 0)
    : [];
  const presetId = typeof payload?.presetId === "string" ? payload.presetId : undefined;
  const category = typeof payload?.category === "string" ? payload.category : undefined;
  const retouchIntensity =
    typeof payload?.retouchIntensity === "number"
      ? clamp(payload.retouchIntensity, 0, 1)
      : undefined;
  return { ids, presetId, category, retouchIntensity };
}

export function createApiRouter({ metadataStore, queue, wsHub, logger }) {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      queueMode: queue.mode,
      imageCount: metadataStore.getImages().length,
      controls: metadataStore.getGlobalDefaults(),
    });
  });

  router.get("/images", (_req, res) => {
    const images = metadataStore
      .getImages()
      .map(enrich)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json({ images });
  });

  router.get("/images/:id", (req, res) => {
    const image = metadataStore.getById(req.params.id);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json({ image: enrich(image) });
  });

  router.get("/presets", (_req, res) => {
    res.json({ presets: PRESETS, categories: CATEGORY_OPTIONS });
  });

  router.post("/controls/reprocess", async (req, res) => {
    try {
      const imageId = req.body?.imageId;
      if (!imageId || typeof imageId !== "string") {
        res.status(400).json({ error: "imageId is required" });
        return;
      }

      const image = metadataStore.getById(imageId);
      if (!image) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      const patch = {
        status: "queued",
        presetId:
          typeof req.body?.presetId === "string" ? req.body.presetId : image.presetId || "editorial-balanced",
        category: typeof req.body?.category === "string" ? req.body.category : image.category || "portrait",
        retouchIntensity:
          typeof req.body?.retouchIntensity === "number"
            ? clamp(req.body.retouchIntensity, 0, 1)
            : typeof image.retouchIntensity === "number"
              ? image.retouchIntensity
              : 0.45,
        error: null,
        updatedAt: new Date().toISOString(),
      };
      const updated = metadataStore.updateImage(imageId, patch);

      wsHub.broadcast("image:status", {
        id: imageId,
        status: "queued",
      });

      await queue.add({
        imageId,
        presetId: updated.presetId,
        category: updated.category,
        retouchIntensity: updated.retouchIntensity,
      });

      res.json({ ok: true, image: enrich(updated) });
    } catch (error) {
      logger.error("Failed to reprocess image", { error: String(error) });
      res.status(500).json({ error: "Failed to reprocess image" });
    }
  });

  router.post("/controls/global", (req, res) => {
    try {
      const patch = {};
      if (typeof req.body?.presetId === "string") {
        patch.presetId = req.body.presetId;
      }
      if (typeof req.body?.category === "string") {
        patch.category = req.body.category;
      }
      if (typeof req.body?.retouchIntensity === "number") {
        patch.retouchIntensity = clamp(req.body.retouchIntensity, 0, 1);
      }
      const applied = metadataStore.setGlobalDefaults(patch);
      wsHub.broadcast("controls:updated", applied);
      res.json({ ok: true, controls: applied });
    } catch (error) {
      logger.error("Failed to update controls", { error: String(error) });
      res.status(500).json({ error: "Failed to update controls" });
    }
  });

  router.post("/controls/batch-apply", async (req, res) => {
    try {
      const { ids, presetId, category, retouchIntensity } = parseBatchPayload(req.body);
      if (!ids.length) {
        res.status(400).json({ error: "imageIds must be a non-empty array" });
        return;
      }

      const queuedIds = [];
      for (const imageId of ids) {
        const image = metadataStore.getById(imageId);
        if (!image) continue;
        const updated = metadataStore.updateImage(imageId, {
          status: "queued",
          presetId: presetId || image.presetId || "editorial-balanced",
          category: category || image.category || "portrait",
          retouchIntensity:
            typeof retouchIntensity === "number"
              ? retouchIntensity
              : typeof image.retouchIntensity === "number"
                ? image.retouchIntensity
                : 0.45,
          error: null,
          updatedAt: new Date().toISOString(),
        });
        wsHub.broadcast("image:status", { id: imageId, status: "queued" });

        await queue.add({
          imageId,
          presetId: updated.presetId,
          category: updated.category,
          retouchIntensity: updated.retouchIntensity,
        });
        queuedIds.push(imageId);
      }

      res.json({ ok: true, queued: queuedIds.length, imageIds: queuedIds });
    } catch (error) {
      logger.error("Failed to batch apply", { error: String(error) });
      res.status(500).json({ error: "Failed to batch apply controls" });
    }
  });

  router.get("/metadata", (_req, res) => {
    res.json({
      controls: metadataStore.getGlobalDefaults(),
      queueMode: queue.mode,
      imageCount: metadataStore.getImages().length,
    });
  });

  return router;
}
