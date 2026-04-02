import chokidar from "chokidar";
import FtpSrv from "ftp-srv";
import path from "node:path";
import { env } from "../config/env.js";
import { paths } from "../config/paths.js";
import { ingestIncomingFile, isSupportedImage } from "../services/ingest.js";
import { logger } from "../utils/logger.js";

interface FtpLoginCredentials {
  username: string;
  password: string;
}

type FtpLoginResolve = (value: { root: string }) => void;
type FtpLoginReject = (error: Error) => void;

interface FtpClientErrorPayload {
  context: string;
  error: Error;
}

export async function startFtpServer(): Promise<{ close: () => Promise<void> }> {
  const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${env.FTP_PORT}`,
    anonymous: false,
    greeting: "Mirror AI FTP ingestion ready",
    pasv_url: env.FTP_PASV_URL,
    pasv_min: env.FTP_PASV_MIN,
    pasv_max: env.FTP_PASV_MAX
  });

  ftpServer.on("login", ({ username, password }: FtpLoginCredentials, resolve: FtpLoginResolve, reject: FtpLoginReject) => {
    if (username === env.FTP_USER && password === env.FTP_PASS) {
      resolve({ root: paths.ftpInbox });
      return;
    }
    reject(new Error("Invalid FTP credentials"));
  });

  ftpServer.on("client-error", ({ context, error }: FtpClientErrorPayload) => {
    logger.error(`FTP client error (${context})`, error);
  });

  await ftpServer.listen();
  logger.info(`FTP server listening on ${env.FTP_PORT}`);

  const watcher = chokidar.watch(paths.ftpInbox, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: env.WATCH_STABILITY_MS,
      pollInterval: 120
    }
  });

  watcher.on("add", async (absolutePath) => {
    if (!isSupportedImage(absolutePath)) {
      return;
    }

    const filename = path.basename(absolutePath);
    try {
      await ingestIncomingFile(absolutePath, "ftp");
      logger.info(`Ingested FTP image: ${filename}`);
    } catch (error) {
      logger.error(`Failed ingest for ${filename}`, error);
    }
  });

  watcher.on("error", (error) => {
    logger.error("FTP watcher error", error);
  });

  return {
    async close() {
      await watcher.close();
      await ftpServer.close();
    }
  };
}
