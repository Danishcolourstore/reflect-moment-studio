import path from "node:path";
import FtpSrv from "ftp-srv";
import { ensureDir } from "../storage/filesystem.js";

const sanitizeFilename = (name) =>
  name
    .trim()
    .replaceAll("\\", "_")
    .replaceAll("/", "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");

export const createFtpIngestionServer = async ({
  env,
  storage,
  logger,
  onFtpUploadComplete,
}) => {
  const ftpInboxDir = storage.ftpInboxDir;
  await ensureDir(ftpInboxDir);

  const ftpServer = new FtpSrv({
    url: `ftp://${env.ftpHost}:${env.ftpPort}`,
    anonymous: false,
    greeting: ["Mirror AI FTP ready"],
  });

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username === env.ftpUser && password === env.ftpPassword) {
      resolve({ root: ftpInboxDir });
      return;
    }
    logger.warn("FTP login rejected", { username });
    reject(new Error("Invalid FTP credentials"));
  });

  ftpServer.on("client-error", ({ context, error }) => {
    logger.error("FTP client error", {
      context,
      message: error?.message ?? "unknown ftp error",
    });
  });

  ftpServer.on("STOR", async (error, filePath) => {
    if (error) {
      logger.error("FTP upload failed", {
        filePath,
        message: error.message,
      });
      return;
    }

    try {
      const incomingFilename = sanitizeFilename(path.basename(filePath));
      const tempPath = path.join(ftpInboxDir, incomingFilename);
      await onFtpUploadComplete({
        uploadedPath: tempPath,
        originalFilename: incomingFilename,
        source: "ftp",
      });
    } catch (uploadError) {
      logger.error("FTP ingestion error", {
        filePath,
        message: uploadError?.message ?? "unknown FTP ingestion error",
      });
    }
  });

  await ftpServer.listen();
  logger.info("FTP server listening", {
    host: env.ftpHost,
    port: env.ftpPort,
    ftpInboxDir,
  });

  return ftpServer;
};
