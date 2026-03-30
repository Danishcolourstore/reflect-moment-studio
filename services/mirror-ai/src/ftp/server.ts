import path from "node:path";
import fs from "node:fs";
import FtpSrv from "ftp-srv";
import chokidar from "chokidar";
import { config } from "../config.js";
import { registerIncomingImage } from "../ingest/register-image.js";
import { logger } from "../logger.js";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function startFtpIngestionServer(): Promise<FtpSrv> {
  const ftpServer = new FtpSrv({
    url: `ftp://${config.MIRROR_FTP_HOST}:${config.MIRROR_FTP_PORT}`,
    anonymous: false,
    greeting: ["Mirror AI FTP ingestion ready"],
  });

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username === config.MIRROR_FTP_USER && password === config.MIRROR_FTP_PASS) {
      resolve({ root: config.ftpHomeDir, cwd: "/" });
      return;
    }
    reject(new Error("Invalid FTP credentials"));
  });

  ftpServer.on("client-error", ({ context, error }) => {
    logger.error({ context, err: error }, "FTP client error");
  });

  ftpServer.on("server-error", ({ error }) => {
    logger.error({ err: error }, "FTP server error");
  });

  const inFlight = new Set<string>();
  const processedSignature = new Map<string, string>();
  const watcher = chokidar.watch(config.ftpHomeDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 650,
      pollInterval: 100,
    },
  });

  const onIncomingFile = async (filePath: string): Promise<void> => {
    const normalized = path.resolve(filePath);
    if (!isImageFile(normalized)) {
      return;
    }
    const stat = await fs.promises.stat(normalized).catch(() => null);
    if (!stat || !stat.isFile()) {
      return;
    }
    const signature = `${stat.size}:${Math.floor(stat.mtimeMs)}`;
    const lastSignature = processedSignature.get(normalized);
    if (lastSignature === signature) {
      return;
    }
    if (inFlight.has(normalized)) {
      return;
    }
    inFlight.add(normalized);
    try {
      await registerIncomingImage({
        sourcePath: normalized,
        fileName: path.basename(normalized),
        source: "ftp",
      });
    } catch (error) {
      logger.error({ err: error, filePath: normalized }, "Failed to register FTP upload");
    } finally {
      processedSignature.set(normalized, signature);
      inFlight.delete(normalized);
    }
  };

  watcher.on("add", (filePath) => void onIncomingFile(filePath));
  watcher.on("change", (filePath) => void onIncomingFile(filePath));
  watcher.on("error", (error) => logger.error({ err: error }, "FTP watcher error"));

  await ftpServer.listen();
  logger.info({ host: config.MIRROR_FTP_HOST, port: config.MIRROR_FTP_PORT }, "FTP ingestion server listening");
  return ftpServer;
}
