import express from "express";
import {
  getControls,
  getImageById,
  getPresets,
  listCategories,
  listImages,
  updateControls,
  updatePreset,
} from "../storage/store.js";
import { toPublicImage } from "./serializers.js";
import { batchApplySchema, controlsUpdateSchema, presetUpdateSchema } from "./schemas.js";
import { publishEvent, realtimeEvents } from "../realtime/hub.js";
import { enqueueImageProcessing } from "../queue/manager.js";

const mapImages = (images) => images.map((image) => toPublicImage(image));

export const createApiRouter = () => {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mirror-ai-backend" });
  });

  router.get("/images", (req, res) => {
    const categoryId = req.query.category?.toString();
    const status = req.query.status?.toString();

    const images = listImages().filter((image) => {
      if (categoryId && categoryId !== "all" && image.categoryId !== categoryId) {
        return false;
      }
      if (status && status !== "all" && image.status !== status) {
        return false;
      }
      return true;
    });
    res.json({ images: mapImages(images) });
  });

  router.get("/images/:id", (req, res) => {
    const image = getImageById(req.params.id);
    if (!image) {
      res.status(404).json({ error: "Image not found" });
      return;
    }
    res.json({ image: toPublicImage(image) });
  });

  router.get("/presets", (_req, res) => {
    res.json({ presets: getPresets() });
  });

  router.patch("/presets/:presetId", async (req, res) => {
    const parsed = presetUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const preset = await updatePreset(req.params.presetId, parsed.data);
    if (!preset) {
      res.status(404).json({ error: "Preset not found" });
      return;
    }

    publishEvent(realtimeEvents.presetUpdated, { preset });
    res.json({ preset });
  });

  router.get("/controls", (_req, res) => {
    res.json({ controls: getControls(), categories: listCategories() });
  });

  router.patch("/controls", async (req, res) => {
    const parsed = controlsUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const controls = await updateControls(parsed.data);
    publishEvent(realtimeEvents.controlsUpdated, { controls });
    res.json({ controls });
  });

  router.post("/batch/apply", async (req, res) => {
    const parsed = batchApplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues });
      return;
    }

    const { imageIds, presetId, retouchIntensity } = parsed.data;
    const presets = getPresets();
    const overridePreset = presetId ? presets.find((preset) => preset.id === presetId) : undefined;
    if (presetId && !overridePreset) {
      res.status(404).json({ error: "Preset not found" });
      return;
    }

    await Promise.all(
      imageIds.map(async (imageId) => {
        const image = getImageById(imageId);
        if (!image) {
          return;
        }
        await enqueueImageProcessing({ imageId, overridePreset, overrideRetouchIntensity: retouchIntensity });
      }),
    );

    publishEvent(realtimeEvents.batchQueued, { imageIds, presetId: presetId ?? null, retouchIntensity });
    res.status(202).json({ queued: imageIds.length });
  });

  return router;
};
