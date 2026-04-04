import type { Server } from "node:http";
import http from "node:http";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { dirs, env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import type { AppContext } from "../app-context.js";
import type { PresetId } from "../types.js";

const controlsSchema = z.object({
  defaultPreset: z.string().optional(),
  defaultRetouchIntensity: z.number().min(0).max(100).optional(),
  defaultCategory: z.string().min(1).max(64).optional(),
});

const batchSchema = z.object({
  imageIds: z.array(z.string()).max(500).optional(),
  preset: z.string().optional(),
  retouchIntensity: z.number().min(0).max(100).optional(),
  category: z.string().min(1).max(64).optional(),
});

const splitOrigins = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const createHttpServer = (context: AppContext): { app: express.Express; server: Server } => {
  const app = express();

  app.use(
    cors({
      origin: splitOrigins(env.MIRROR_AI_ALLOWED_ORIGINS),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "mirror-ai-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/media", express.static(dirs.root, { maxAge: "30d", immutable: false }));

  app.get("/api/mirror-ai/snapshot", async (_req, res, next) => {
    try {
      const snapshot = await context.mirrorService.getSnapshot();
      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/mirror-ai/controls", async (req, res, next) => {
    try {
      const parsed = controlsSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid controls payload", details: parsed.error.flatten() });
        return;
      }
      const payload = parsed.data;
      const updated = await context.mirrorService.updateControls({
        defaultPreset: payload.defaultPreset as PresetId | undefined,
        defaultRetouchIntensity: payload.defaultRetouchIntensity,
        defaultCategory: payload.defaultCategory,
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/mirror-ai/batch-apply", async (req, res, next) => {
    try {
      const parsed = batchSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid batch payload", details: parsed.error.flatten() });
        return;
      }
      const payload = parsed.data;
      const imageIds = await context.mirrorService.applyBatch({
        imageIds: payload.imageIds,
        preset: payload.preset as PresetId | undefined,
        retouchIntensity: payload.retouchIntensity,
        category: payload.category,
      });
      res.json({ updated: imageIds.length, imageIds });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ error }, "HTTP request failed");
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  });

  const server = http.createServer(app);
  return { app, server };
};
