import path from "node:path";
import fs from "node:fs/promises";
import chokidar from "chokidar";
import FtpSrv from "ftp-srv";
import { config } from "./config";
import { createImageRecord, moveToOriginals } from "./storage";
import { eventBus } from "./events";
import type { QueueController } from "./queue";

const supportedExt = [".jpg", ".jpeg", ".png", ".webp"];
const seenIncoming = new Set<string>();

function isImagePath(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return supportedExt.includes(ext);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStableFile(filePath: string): Promise<void> {
  let previousSize = -1;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > 0 && stat.size === previousSize) {
        return;
      }
      previousSize = stat.size;
    } catch {
      // Upload may still be in progress.
    }
    await delay(180);
  }
}

async function handleIncomingFile(filePath: string, queue: QueueController) {
  if (!isImagePath(filePath) || seenIncoming.has(filePath)) {
    return;
  }
  seenIncoming.add(filePath);

  try {
    await waitForStableFile(filePath);
    const filename = path.basename(filePath);
    const originalPath = await moveToOriginals(filePath, filename);
    const image = await createImageRecord({ filename, originalPath });
    eventBus.emit("imageQueued", image);
    await queue.enqueue(image.id);
  } catch (error) {
    console.error("Failed to ingest uploaded image:", filePath, error);
  } finally {
    seenIncoming.delete(filePath);
  }
}

export async function startFtpIngestion(queue: QueueController) {
  const watcher = chokidar.watch(config.storage.incoming, {
    ignoreInitial: false,
    awaitWriteFinish: {
      stabilityThreshold: 350,
      pollInterval: 100,
    },
  });

  watcher.on("add", (filePath) => {
    handleIncomingFile(filePath, queue).catch((error) => {
      console.error("Incoming watcher error for file:", filePath, error);
    });
  });

  watcher.on("error", (error) => {
    console.error("Incoming watcher failure:", error);
  });

  const ftpServer = new FtpSrv({
    url: `ftp://${config.ftp.host}:${config.ftp.port}`,
    anonymous: false,
    pasv_min: 1024,
    pasv_max: 2048,
  });

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username !== config.ftp.user || password !== config.ftp.pass) {
      return reject(new Error("Invalid FTP credentials."));
    }
    resolve({ root: config.storage.incoming });
  });

  ftpServer.on("client-error", ({ context, error }) => {
    console.error("FTP client error:", context, error);
  });

  await ftpServer.listen();
  console.log(`Mirror FTP server listening on ${config.ftp.host}:${config.ftp.port}`);

  return {
    stop: async () => {
      await watcher.close();
      await ftpServer.close();
    },
  };
}
