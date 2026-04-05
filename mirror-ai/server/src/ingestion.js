import fs from "node:fs/promises";
import chokidar from "chokidar";
import { copyIncomingToOriginal } from "./storage.js";
import { isSupportedImage } from "./utils.js";

export async function startIngestionWatcher({
  incomingDir,
  originalsDir,
  metadataStore,
  queue,
  wsHub,
  logger,
}) {
  const seen = new Set();

  async function ingestFile(filePath) {
    if (!isSupportedImage(filePath)) return;
    if (seen.has(filePath)) return;

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile() || stat.size < 8 * 1024) return;

    seen.add(filePath);
    const copied = await copyIncomingToOriginal(filePath, originalsDir);

    const now = new Date().toISOString();
    const created = metadataStore.insert({
      originalFileName: copied.originalFileName,
      originalFilePath: copied.originalFilePath,
      sourcePath: filePath,
      status: "queued",
      presetId: metadataStore.getGlobalDefaults().presetId,
      category: metadataStore.getGlobalDefaults().category,
      retouchIntensity: metadataStore.getGlobalDefaults().retouchIntensity,
      previewFilePath: null,
      processedFilePath: null,
      previewUrl: null,
      processedUrl: null,
      analysis: null,
      processingMs: null,
      createdAt: now,
      updatedAt: now,
    });

    await queue.addJob({
      imageId: created.id,
      presetId: created.presetId,
      category: created.category,
      retouchIntensity: created.retouchIntensity,
    });

    wsHub.broadcast("image:queued", created);
    logger.info("Queued new incoming image", { id: created.id, filePath });
  }

  const watcher = chokidar.watch(incomingDir, {
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 700,
      pollInterval: 120,
    },
  });

  watcher.on("add", (filePath) => {
    ingestFile(filePath).catch((error) => {
      logger.error("Failed to ingest file", { filePath, error: String(error) });
    });
  });
  watcher.on("error", (error) => logger.error("Ingestion watcher error", { error: String(error) }));

  return {
    stop: async () => {
      await watcher.close();
    },
  };
}
