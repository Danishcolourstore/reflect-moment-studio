import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { PRESETS } from '../pipeline/presets.js';
import { ImageStore } from '../storage/imageStore.js';
import { ProcessingService } from '../services/processingService.js';
import { logger } from '../utils/logger.js';

export const buildRouter = (imageStore: ImageStore, processingService: ProcessingService): express.Router => {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mirror-ai-backend', timestamp: new Date().toISOString() });
  });

  router.get('/api/presets', (_req, res) => {
    res.json({ data: PRESETS });
  });

  router.get('/api/control/defaults', (_req, res) => {
    res.json({ data: processingService.getDefaults() });
  });

  router.patch('/api/control/defaults', async (req, res) => {
    const schema = z.object({
      presetId: z.string().optional(),
      retouchIntensity: z.number().min(0).max(100).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const data = await processingService.updateDefaults(parsed.data);
    return res.json({ data });
  });

  router.get('/api/categories', (_req, res) => {
    const categories = Array.from(new Set(imageStore.list().map((item) => item.category)));
    res.json({ data: categories });
  });

  router.get('/api/images', (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    const images = imageStore.list().filter((item) => {
      if (status && item.status !== status) return false;
      if (category && item.category !== category) return false;
      return true;
    });

    res.json({ data: images });
  });

  router.get('/api/images/:id', (req, res) => {
    const image = imageStore.get(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    return res.json({ data: image });
  });

  router.post('/api/images/batch', async (req, res) => {
    const schema = z.object({
      ids: z.array(z.string()).min(1),
      presetId: z.string().optional(),
      retouchIntensity: z.number().min(0).max(100).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const data = await processingService.batchReprocess(parsed.data.ids, {
      presetId: parsed.data.presetId,
      retouchIntensity: parsed.data.retouchIntensity,
    });

    return res.json({ data });
  });

  router.patch('/api/images/:id/control', async (req, res) => {
    const schema = z.object({
      presetId: z.string().optional(),
      retouchIntensity: z.number().min(0).max(100).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const updated = await processingService.reprocessImage(req.params.id, parsed.data);
    if (!updated) {
      return res.status(404).json({ error: 'Image not found' });
    }

    return res.json({ data: updated });
  });

  router.get('/api/images/:id/file', async (req, res) => {
    const schema = z.object({
      type: z.enum(['original', 'preview', 'processed']).default('preview'),
    });

    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const image = imageStore.get(req.params.id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const type = parsed.data.type;
    const filePath = image.files[type as keyof typeof image.files];

    if (!filePath) {
      return res.status(404).json({ error: `No ${type} file available` });
    }

    try {
      await fs.access(filePath);
      return res.sendFile(path.resolve(filePath));
    } catch (error) {
      logger.warn({ imageId: image.id, filePath, error }, 'Requested image file missing');
      return res.status(404).json({ error: 'File not found on disk' });
    }
  });

  return router;
};
