import { Router, type RequestHandler } from "express";
import { listImages, uploadImage, uploadMiddleware } from "../controllers/imagesController.js";
import {
  getControlState,
  patchControlState,
  reprocessImage,
  batchApply,
} from "../controllers/controlController.js";
import { getPresetList } from "../controllers/presetsController.js";

function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function registerRoutes(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mirror-ai-backend" });
  });

  router.get("/images", listImages);
  router.post("/images/upload", uploadMiddleware, asyncHandler(uploadImage));

  router.get("/presets", getPresetList);

  router.get("/control", getControlState);
  router.patch("/control", asyncHandler(patchControlState));
  router.post("/control/reprocess/:id", asyncHandler(reprocessImage));
  router.post("/control/batch-apply", asyncHandler(batchApply));

  return router;
}
