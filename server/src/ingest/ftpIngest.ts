import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import FtpSrv from "ftp-srv";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { imageRepository } from "../storage/imageRepository";
import { toStorageUrl } from "../storage/fileStore";
import { settingsService } from "../services/settingsService";
import { queueClient } from "../queue/queueClient";
import { realtimeHub } from "../realtime/realtimeHub";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"];
const isImage = (filePath: string): boolean => IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());

let ftpServer: FtpSrv | null = null;

async function ingestFile(uploadedPath: string): Promise<void> {
  const absoluteIncoming = path.isAbsolute(uploadedPath) ? uploadedPath : path.join(env.storagePaths.incoming, uploadedPath);
  if (!isImage(absoluteIncoming)) {
    return;
  }

  const stat = await fs.stat(absoluteIncoming);
  if (!stat.isFile()) {
    return;
  }

  const sourceName = path.basename(absoluteIncoming);
  const ext = path.extname(sourceName).toLowerCase() || ".jpg";
  const id = randomUUID();
  const storedName = `${id}${ext}`;
  const originalPath = path.join(env.storagePaths.originals, storedName);
  await fs.copyFile(absoluteIncoming, originalPath);

  const control = settingsService.get();
  const now = new Date().toISOString();
  const image = imageRepository.createImage({
    id,
    fileName: sourceName,
    sourcePath: absoluteIncoming,
    originalPath,
    originalUrl: toStorageUrl(originalPath),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    presetId: control.activePresetId,
    retouchIntensity: control.retouchIntensity,
    shootCategory: control.category,
    metadata: {
      from: "ftp",
      originalName: sourceName,
      fileSize: stat.size,
    },
  });

  await queueClient.add({
    imageId: image.id,
    originalPath: image.originalPath,
  });

  realtimeHub.publishImageCreated(image);
  realtimeHub.publishQueueStats(await queueClient.stats());
  logger.info({ imageId: image.id, sourceName }, "FTP image ingested");
}

export async function startFtpIngest(): Promise<void> {
  if (ftpServer) {
    return;
  }
  const ftpUrl = `ftp://${env.FTP_HOST}:${env.FTP_PORT}`;
  ftpServer = new FtpSrv({
    url: ftpUrl,
    anonymous: false,
    greeting: ["Mirror AI FTP ingest online"],
  });

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username !== env.FTP_USER || password !== env.FTP_PASSWORD) {
      logger.warn({ username }, "Rejected FTP login");
      reject(new Error("Invalid FTP credentials"));
      return;
    }
    resolve({ root: env.storagePaths.incoming });
  });

  ftpServer.on("STOR", async (error, filePath) => {
    if (error || !filePath) {
      return;
    }
    try {
      await ingestFile(filePath);
    } catch (err) {
      logger.error({ err, filePath }, "Failed handling FTP upload");
    }
  });

  await ftpServer.listen();
  logger.info({ ftpUrl }, "FTP server started");
}

export async function stopFtpIngest(): Promise<void> {
  if (!ftpServer) {
    return;
  }
  await ftpServer.close();
  ftpServer = null;
}
