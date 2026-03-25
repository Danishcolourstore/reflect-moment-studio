import path from "node:path";
import fs from "node:fs/promises";
import FtpSrv from "ftp-srv";
import chokidar from "chokidar";
import { randomUUID } from "node:crypto";
import type { AppConfig } from "./config.js";
import { logger } from "./logger.js";
import type { MetadataService } from "./metadata.js";
import type { ProcessingQueue } from "./queue.js";
import type { StoragePaths } from "./storage.js";
import type { EventBus } from "./eventBus.js";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function isImage(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function startFtpIngestion(
  config: AppConfig,
  storage: StoragePaths,
  metadata: MetadataService,
  queue: ProcessingQueue,
  bus: EventBus,
): Promise<void> {
  const ftp = new FtpSrv({
    url: config.ftp.url,
    anonymous: false,
    pasv_url: config.ftp.host,
    greeting: ["Mirror AI FTP Ingestion"],
  });

  ftp.on("login", ({ username, password }, resolve, reject) => {
    if (username === config.ftp.username && password === config.ftp.password) {
      resolve({ root: storage.ftpInbox });
      return;
    }
    reject(new Error("Invalid FTP credentials"));
  });

  ftp.on("client-error", ({ context, error }) => {
    logger.warn("FTP client error", { context, error: error.message });
  });

  await ftp.listen();
  logger.info("FTP server started", { url: config.ftp.url });

  const inFlight = new Set<string>();
  const watcher = chokidar.watch(storage.ftpInbox, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: Math.max(config.watchDebounceMs, 150),
      pollInterval: 100,
    },
  });

  watcher.on("add", (filePath) => {
    if (!isImage(filePath) || inFlight.has(filePath)) {
      return;
    }
    inFlight.add(filePath);
    void ingestOne(filePath);
  });

  watcher.on("error", (error) => {
    logger.error("FTP watcher error", { message: (error as Error).message });
  });

  logger.info("Watching FTP inbox", { path: storage.ftpInbox });

  async function ingestOne(filePath: string): Promise<void> {
    try {
      const fileStat = await fs.stat(filePath);
      if (!fileStat.isFile() || fileStat.size <= 0) {
        return;
      }

      const sourceFilename = path.basename(filePath);
      const ext = path.extname(sourceFilename).toLowerCase() || ".jpg";
      const id = randomUUID();
      const storedName = `${id}${ext}`;
      const relOriginal = path.join("originals", storedName);
      const absOriginal = path.join(storage.root, relOriginal);
      await fs.copyFile(filePath, absOriginal);

      const record = metadata.createIncoming({
        id,
        sourceFilename,
        originalRelPath: relOriginal,
      });

      queue.enqueue(id);
      bus.publish({
        type: "image.created",
        image: {
          ...record,
          originalUrl: `${config.publicBaseUrl}/files/${record.originalRelPath.replace(/\\/g, "/")}`,
        },
      });
      bus.publish({ type: "queue.stats", queue: queue.snapshot() });
      logger.info("FTP image ingested", { imageId: id, sourceFilename });
    } catch (error) {
      logger.error("Failed to ingest FTP file", {
        filePath,
        message: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      inFlight.delete(filePath);
    }
  }
}
