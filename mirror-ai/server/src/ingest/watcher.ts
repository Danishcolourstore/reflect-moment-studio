import fs from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import { dirs } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { MirrorService } from "../services/mirror-service.js";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic"]);

const isImagePath = (filePath: string): boolean => {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
};

const waitUntilStable = async (filePath: string): Promise<void> => {
  let previousSize = -1;
  let stablePasses = 0;

  for (let i = 0; i < 20; i += 1) {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size === previousSize) {
        stablePasses += 1;
      } else {
        stablePasses = 0;
      }
      previousSize = stats.size;
      if (stablePasses >= 2) {
        return;
      }
    } catch {
      // File can disappear if upload fails; handled by caller.
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
};

export const startIncomingWatcher = (service: MirrorService) => {
  const watcher = chokidar.watch(dirs.incoming, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on("add", async (filePath) => {
    if (!isImagePath(filePath)) {
      return;
    }
    await waitUntilStable(filePath);
    if (!fs.existsSync(filePath)) {
      return;
    }
    try {
      await service.ingestImageFromPath(filePath, path.basename(filePath));
      logger.info({ filePath }, "Ingested image from incoming directory");
    } catch (error) {
      logger.error({ filePath, error }, "Failed to ingest incoming image");
    }
  });

  watcher.on("error", (error) => {
    logger.error({ error }, "Incoming file watcher error");
  });

  return watcher;
};

export const ingestExistingIncoming = async (service: MirrorService): Promise<number> => {
  const files = await fs.promises.readdir(dirs.incoming).catch(() => []);
  let ingested = 0;
  for (const fileName of files) {
    const filePath = path.join(dirs.incoming, fileName);
    if (!isImagePath(filePath)) {
      continue;
    }
    try {
      await service.ingestImageFromPath(filePath, fileName);
      ingested += 1;
    } catch (error) {
      logger.error({ filePath, error }, "Failed to ingest existing file");
    }
  }
  return ingested;
};
