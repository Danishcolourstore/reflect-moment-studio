import type { Request, Response } from "express";
import { z } from "zod";
import { store } from "../services/store.js";
import { enqueueImageJob } from "../queue/imageQueue.js";
import { broadcast } from "../realtime/wsServer.js";
import { toPublicImage } from "../services/serializers.js";

const updateControlSchema = z.object({
  presetId: z.string().optional(),
  retouchIntensity: z.number().min(0).max(100).optional(),
  category: z.string().min(1).max(120).optional(),
});

const batchSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
  presetId: z.string().optional(),
  retouchIntensity: z.number().min(0).max(100).optional(),
  category: z.string().min(1).max(120).optional(),
});

export function getControlState(_req: Request, res: Response): void {
  res.json({ control: store.getControlState() });
}

export async function patchControlState(req: Request, res: Response): Promise<void> {
  const parsed = updateControlSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid control payload", issues: parsed.error.issues });
    return;
  }

  const control = await store.updateControlState(parsed.data);
  broadcast("control.updated", { control });
  res.json({ control });
}

export async function reprocessImage(req: Request, res: Response): Promise<void> {
  const idRaw = req.params.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  if (!id) {
    res.status(400).json({ error: "Image id is required" });
    return;
  }

  const image = store.getImageById(id);
  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  const control = store.getControlState();
  const updated = await store.updateImage(image.id, {
    status: "queued",
    presetId: control.presetId,
    retouchIntensity: control.retouchIntensity,
    category: control.category,
    error: undefined,
  });

  await enqueueImageJob({
    imageId: updated.id,
    presetId: updated.presetId,
    retouchIntensity: updated.retouchIntensity,
    category: updated.category,
  });

  broadcast("image.updated", { image: toPublicImage(updated) });
  res.json({ ok: true, image: toPublicImage(updated) });
}

export async function batchApply(req: Request, res: Response): Promise<void> {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid batch payload", issues: parsed.error.issues });
    return;
  }

  const { imageIds, presetId, retouchIntensity, category } = parsed.data;
  const result = {
    updated: 0,
    ignored: 0,
  };

  for (const imageId of imageIds) {
    const image = store.getImageById(imageId);
    if (!image) {
      result.ignored += 1;
      continue;
    }

    const updated = await store.updateImage(imageId, {
      presetId: presetId ?? image.presetId,
      retouchIntensity: retouchIntensity ?? image.retouchIntensity,
      category: category ?? image.category,
      status: "queued",
      error: undefined,
    });

    await enqueueImageJob({
      imageId,
      presetId: updated.presetId,
      retouchIntensity: updated.retouchIntensity,
      category: updated.category,
    });

    broadcast("image.updated", { image: toPublicImage(updated) });
    result.updated += 1;
  }

  res.json({ ok: true, ...result });
}
