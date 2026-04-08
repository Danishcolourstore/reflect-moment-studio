import path from "node:path";
import chokidar, { type FSWatcher } from "chokidar";
import { imageRepository } from "../lib/repository.js";
import { eventBus } from "../lib/event-bus.js";
import type { ProcessingQueue } from "../lib/queue.js";

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
const seenRecently = new Map<string, number>();
const RECENT_WINDOW_MS = 10_000;

function shouldProcess(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!allowedExtensions.has(ext)) return false;

  const now = Date.now();
  const previous = seenRecently.get(filePath);
  if (previous && now - previous < RECENT_WINDOW_MS) return false;
  seenRecently.set(filePath, now);
  return true;
}

export async function createInboxWatcher(inboxPath: string, queue: ProcessingQueue): Promise<FSWatcher> {
  const watcher = chokidar.watch(inboxPath, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 800,
      pollInterval: 100,
    },
  });

  watcher.on("add", async (filePath) => {
    if (!shouldProcess(filePath)) return;

    try {
      const image = imageRepository.createFromOriginalPath(filePath);
      eventBus.emitImageReceived(image);
      await queue.enqueue(image.id);
    } catch (error) {
      console.error("[ingest] failed to process new file", filePath, error);
    }
  });

  watcher.on("error", (error) => {
    console.error("[ingest] watcher error", error);
  });

  return watcher;
}
