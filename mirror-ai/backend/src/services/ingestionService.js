import fs from "node:fs/promises";
import path from "node:path";
import chokidar from "chokidar";
import FtpSrv from "ftp-srv";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { storagePaths } from "../storage/paths.js";
import { moveFileSafe } from "../utils/fs.js";
import { upsertImage } from "../storage/store.js";
import { enqueueImageProcessing } from "../queue/manager.js";
import { publishEvent, realtimeEvents } from "../realtime/hub.js";
import { toPublicImage } from "../api/serializers.js";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff"]);
const isImageFile = (filePath) => imageExtensions.has(path.extname(filePath).toLowerCase());
const parseCategoryFromName = (name) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("wedding")) return "wedding";
  if (normalized.includes("fashion")) return "fashion";
  if (normalized.includes("event")) return "event";
  return "portrait";
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForStableFile = async (filePath) => {
  let previousSize = -1;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 0 && stats.size === previousSize) {
        return;
      }
      previousSize = stats.size;
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    await wait(120);
  }
};

const createImageRecord = (originalName, originalPath) => {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    originalName,
    originalPath,
    status: "processing",
    categoryId: parseCategoryFromName(originalName),
    ingestSource: "ftp",
    createdAt: now,
    updatedAt: now,
  };
};

export const createIngestionService = () => {
  let watcher = null;
  let ftpServer = null;
  const seen = new Set();

  const ingestFile = async (incomingPath) => {
    if (!isImageFile(incomingPath)) {
      return;
    }
    if (seen.has(incomingPath)) {
      return;
    }
    seen.add(incomingPath);

    try {
      await waitForStableFile(incomingPath);
      const originalName = path.basename(incomingPath);
      const imageId = uuidv4();
      const targetName = `${imageId}-${originalName.replace(/\s+/g, "-")}`;
      const targetPath = path.join(storagePaths.originals, targetName);

      await moveFileSafe(incomingPath, targetPath);

      const image = createImageRecord(originalName, targetPath);
      image.id = imageId;
      await upsertImage(image);
      publishEvent(realtimeEvents.imageIngested, { image: toPublicImage(image) });

      await enqueueImageProcessing({ imageId });
      logger.info({ imageId, originalName }, "Image ingested and queued");
    } catch (error) {
      logger.error({ err: error, incomingPath }, "Failed to ingest incoming image");
    } finally {
      seen.delete(incomingPath);
    }
  };

  const startWatcher = async () => {
    watcher = chokidar.watch(storagePaths.incoming, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 120,
      },
    });

    watcher.on("add", (filePath) => {
      ingestFile(filePath).catch((error) => {
        logger.error({ err: error, filePath }, "Unhandled ingest watcher error");
      });
    });

    watcher.on("error", (error) => {
      logger.error({ err: error }, "Ingest watcher error");
    });
  };

  const startFtpServer = async () => {
    if (!config.ftp.enabled) {
      logger.info("FTP disabled by environment");
      return;
    }

    ftpServer = new FtpSrv({
      url: `ftp://${config.ftp.host}:${config.ftp.port}`,
      pasv_url: config.ftp.passthroughHost,
      pasv_min: config.ftp.passivePortStart,
      pasv_max: config.ftp.passivePortEnd,
      anonymous: false,
      greeting: ["Mirror AI FTP Ingestion Ready"],
    });

    ftpServer.on("login", ({ username, password }, resolve, reject) => {
      if (username !== config.ftp.user || password !== config.ftp.password) {
        reject(new Error("Invalid FTP credentials"));
        return;
      }
      resolve({ root: storagePaths.incoming });
    });

    ftpServer.on("client-error", ({ context, error }) => {
      logger.warn({ err: error, context }, "FTP client error");
    });

    await ftpServer.listen();
    logger.info(
      { host: config.ftp.host, port: config.ftp.port, incomingPath: storagePaths.incoming },
      "FTP ingestion server started",
    );
  };

  return {
    start: async () => {
      await startWatcher();
      await startFtpServer();
    },
    stop: async () => {
      if (watcher) {
        await watcher.close();
        watcher = null;
      }
      if (ftpServer) {
        await ftpServer.close();
        ftpServer = null;
      }
    },
  };
};
