import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import chokidar from "chokidar";
import { config } from "./config.js";
import { createImageRecord } from "./database.js";

const VALID_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
const recentlySeen = new Map();

function shouldIngest(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!VALID_EXTENSIONS.has(ext)) return false;

  const now = Date.now();
  const previous = recentlySeen.get(filePath);
  recentlySeen.set(filePath, now);
  if (previous && now - previous < config.watchDebounceMs) {
    return false;
  }
  return true;
}

function sanitizeFilename(input) {
  const ext = path.extname(input).toLowerCase();
  const name = path.basename(input, ext).replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${randomUUID()}-${name}${ext || ".jpg"}`;
}

async function ensureStableFile(filePath) {
  let previousSize = -1;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const stat = await fs.stat(filePath);
    if (stat.size === previousSize && stat.size > 0) return stat;
    previousSize = stat.size;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return fs.stat(filePath);
}

export async function ingestImageFromPath(filePath, { category } = {}) {
  if (!shouldIngest(filePath)) return null;
  const stat = await ensureStableFile(filePath);
  if (!stat.isFile()) return null;

  const incomingName = path.basename(filePath);
  const storedFilename = sanitizeFilename(incomingName);
  const originalPath = path.join(config.originalsDir, storedFilename);
  const archivedPath = path.join(config.ftpArchiveDir, storedFilename);

  await fs.copyFile(filePath, originalPath);
  await fs.rename(filePath, archivedPath).catch(async () => {
    await fs.copyFile(filePath, archivedPath);
    await fs.unlink(filePath);
  });

  const imageId = randomUUID();
  return createImageRecord({
    id: imageId,
    originalFilename: storedFilename,
    sourcePath: originalPath,
    category,
  });
}

export function startIncomingWatcher(onImageIngested, onIngestError) {
  const watcher = chokidar.watch(config.ftpIncomingDir, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 450,
      pollInterval: 100,
    },
  });

  watcher.on("add", async (filePath) => {
    try {
      const image = await ingestImageFromPath(filePath);
      if (image) onImageIngested(image);
    } catch (error) {
      if (typeof onIngestError === "function") {
        onIngestError(error, filePath);
      }
    }
  });

  return watcher;
}
