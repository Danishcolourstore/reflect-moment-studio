import express from "express";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createApiRouter = ({ state, queue, wsHub }) => {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      queue: queue.getStats(),
    });
  });

  router.get("/images", (_req, res) => {
    res.json({
      images: state.listImages(),
      queue: queue.getStats(),
      settings: state.getSettings(),
    });
  });

  router.get("/settings", (_req, res) => {
    res.json({
      presets: state.getPresets(),
      settings: state.getSettings(),
    });
  });

  router.patch("/settings", (req, res) => {
    const body = req.body ?? {};
    const next = {};

    if (typeof body.activePresetId === "string") {
      const preset = state.getPresetById(body.activePresetId);
      if (!preset) {
        return res.status(400).json({
          error: "Invalid activePresetId",
          availablePresetIds: state.getPresets().map((presetItem) => presetItem.id),
        });
      }
      next.activePresetId = preset.id;
    }

    if (body.retouchIntensity !== undefined) {
      const parsed = Number(body.retouchIntensity);
      if (!Number.isFinite(parsed)) {
        return res.status(400).json({ error: "retouchIntensity must be a number between 0 and 1" });
      }
      next.retouchIntensity = clamp(parsed, 0, 1);
    }

    if (typeof body.category === "string" && body.category.trim()) {
      next.category = body.category.trim();
    }

    const settings = state.setSettings(next);
    wsHub.notifySettingsUpdated(settings);

    return res.json({ settings });
  });

  router.get("/categories", (_req, res) => {
    res.json({
      categories: state.getCategories(),
      active: state.getSettings().category,
    });
  });

  router.post("/images/:imageId/reprocess", async (req, res) => {
    const imageId = req.params.imageId;
    const image = state.getImage(imageId);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    try {
      const updated = state.upsertImage({
        ...image,
        status: "queued",
        error: null,
      });
      wsHub.notifyImageUpdated(updated);

      await queue.enqueueImage(image.id);

      return res.json({
        ok: true,
        image: updated,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || "Unable to reprocess image" });
    }
  });

  router.post("/batch/reprocess", async (_req, res) => {
    const images = state.listImages();

    const jobs = images
      .filter((image) => image.originalPath)
      .map(async (image) => {
        const queuedImage = state.upsertImage({
          ...image,
          status: "queued",
          error: null,
        });
        wsHub.notifyImageUpdated(queuedImage);

        return queue.enqueueImage(image.id);
      });

    await Promise.all(jobs);

    return res.json({
      ok: true,
      queued: jobs.length,
    });
  });

  return router;
};
