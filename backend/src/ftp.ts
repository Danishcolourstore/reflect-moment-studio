import path from "node:path";
import { randomUUID } from "node:crypto";
import chokidar from "chokidar";
import FtpSrv from "ftp-srv";
import { env, storagePaths } from "./config.js";
import { db } from "./database.js";
import { bus } from "./events.js";
import { moveToOriginals } from "./storage.js";
import type { QueueDriver } from "./queue/types.js";
import type { ImageRecord, ShootCategory } from "./types.js";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

const isImageFile = (filePath: string): boolean => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());

const inferCategory = (fileName: string): ShootCategory => {
  const lower = fileName.toLowerCase();
  if (lower.includes("wedding")) return "wedding";
  if (lower.includes("fashion")) return "fashion";
  if (lower.includes("commercial")) return "commercial";
  if (lower.includes("event")) return "event";
  return "portrait";
};

export class MirrorFtpIngestion {
  private readonly ftpServer: {
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    listen: () => Promise<unknown>;
    close: () => Promise<unknown>;
  };
  private watcher: import("chokidar").FSWatcher | null = null;

  constructor(private readonly queue: QueueDriver) {
    this.ftpServer = new (FtpSrv as unknown as new (options: Record<string, unknown>) => {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      listen: () => Promise<unknown>;
      close: () => Promise<unknown>;
    })({
      url: `ftp://${env.FTP_HOST}:${env.FTP_PORT}`,
      anonymous: false,
      greeting: "Mirror AI FTP Ingestion Ready",
      file_format: "ls",
    });
  }

  async start(): Promise<void> {
    this.ftpServer.on("login", (...args: unknown[]) => {
      const credentials = (args[0] ?? {}) as { username?: string; password?: string };
      const resolve = args[1] as ((value: { root: string }) => void) | undefined;
      const reject = args[2] as ((error: Error) => void) | undefined;

      if (!resolve || !reject) {
        return;
      }

      const { username, password } = credentials;
      if (username === env.FTP_USER && password === env.FTP_PASSWORD) {
        resolve({ root: storagePaths.uploads });
      } else {
        reject(new Error("Invalid FTP credentials"));
      }
    });

    await this.ftpServer.listen();

    this.watcher = chokidar.watch(storagePaths.uploads, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 700, pollInterval: 120 },
      depth: 5,
    });

    this.watcher.on("add", async (filePath: string) => {
      if (!isImageFile(filePath)) return;

      try {
        const fileName = path.basename(filePath);
        const imageId = randomUUID();
        const now = new Date().toISOString();
        const originalPath = await moveToOriginals(filePath, imageId, fileName);
        const settings = await db.getSettings();

        const image: ImageRecord = {
          id: imageId,
          fileName,
          category: inferCategory(fileName),
          status: "queued",
          createdAt: now,
          updatedAt: now,
          originalPath,
        };

        await db.upsertImage(image);
        bus.emit("imageCreated", image);

        await this.queue.enqueue({
          imageId,
          presetId: settings.activePresetId,
          retouchIntensity: settings.retouchIntensity,
          category: image.category,
        });
      } catch {
        // Ignore single-upload failures and keep ingestion running.
      }
    });
  }

  async close(): Promise<void> {
    await this.watcher?.close();
    await this.ftpServer.close();
  }
}
