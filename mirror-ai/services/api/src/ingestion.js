import { promises as fs } from "node:fs";
import path from "node:path";
import chokidar from "chokidar";
import {
  INCOMING_DIR,
  ORIGINALS_DIR,
  buildFileNames,
  buildImageId,
  ensureStorage,
  newImageRecord,
  saveImageMetadata,
  readControlSettings,
} from "@mirror-ai/shared";
import { enqueueImageJob } from "./queue.js";
import { broadcast } from "./broadcast.js";
import { config } from "./config.js";

const PROCESSABLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const seenFiles = new Set();

function ext(filePath) {
  return path.extname(filePath).toLowerCase();
}

function shouldProcess(filePath) {
  return PROCESSABLE_EXTENSIONS.has(ext(filePath));
}

async function safeMove(src, dest) {
  try {
    await fs.rename(src, dest);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EXDEV") {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
      return;
    }
    throw error;
  }
}

async function handleIncomingFile(filePath) {
  if (!shouldProcess(filePath)) {
    return;
  }
  if (seenFiles.has(filePath)) {
    return;
  }
  seenFiles.add(filePath);
  try {
    try {
      await fs.stat(filePath);
    } catch {
      return;
    }

    const originalName = path.basename(filePath);
    const imageId = buildImageId();
    const names = buildFileNames(imageId, ext(filePath));
    const originalPath = path.join(ORIGINALS_DIR, names.original);
    await safeMove(filePath, originalPath);

    const controls = await readControlSettings();
    const record = newImageRecord({
      id: imageId,
      originalName,
      category: controls.category,
      presetId: controls.presetId,
      retouchIntensity: controls.retouchIntensity,
      originalPath: names.original,
    });
    await saveImageMetadata(record);
    const payload = {
      ...record,
      urls: {
        original: `${config.api.publicBaseUrl}/images/originals/${record.originalPath}`,
        processedFull: null,
        preview: null,
      },
    };
    broadcast("image:ingested", payload);

    await enqueueImageJob({
      imageId,
      presetId: record.presetId,
      retouchIntensity: record.retouchIntensity,
      category: record.category,
    });
  } catch (error) {
    console.error("[ingestion] failed processing incoming file", filePath, error);
  } finally {
    setTimeout(() => seenFiles.delete(filePath), 15_000);
  }
}

export async function startIngestionWatcher() {
  await ensureStorage();
  const watcher = chokidar.watch(INCOMING_DIR, {
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher.on("add", (filePath) => {
    handleIncomingFile(filePath).catch((error) => {
      console.error("[ingestion] add handler failed", error);
    });
  });

  watcher.on("error", (error) => {
    console.error("[ingestion] watcher error", error);
  });

  console.log(`[ingestion] watching ${INCOMING_DIR}`);
  return watcher;
}
