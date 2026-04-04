import path from "node:path";
import { createRequire } from "node:module";
import { dirs, env } from "../config/env.js";
import { logger } from "../lib/logger.js";

type LoginData = { username: string; password: string };
type LoginResolve = (auth: { root: string }) => void;
type LoginReject = (error: Error) => void;
type FtpClientError = { context?: string; error: unknown };
type FtpStoreError = unknown;
type FtpServerInstance = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  listen: () => Promise<void>;
  close: () => Promise<void>;
};

const require = createRequire(import.meta.url);
const FtpSrv = require("ftp-srv") as new (...args: unknown[]) => FtpServerInstance;

export const createFtpServer = (): FtpServerInstance => {
  const ftpUrl = `ftp://${env.MIRROR_AI_HOST}:${env.MIRROR_AI_FTP_PORT}`;
  const ftpServer = new FtpSrv({
    url: ftpUrl,
    anonymous: false,
    greeting: ["Mirror AI FTP ready"],
    pasv_url: env.MIRROR_AI_FTP_PASV_URL,
  });

  ftpServer.on("login", (credentials: unknown, resolve: unknown, reject: unknown) => {
    const { username, password } = credentials as LoginData;
    const done = resolve as LoginResolve;
    const fail = reject as LoginReject;
    if (username === env.MIRROR_AI_FTP_USER && password === env.MIRROR_AI_FTP_PASSWORD) {
      done({ root: dirs.incoming });
      return;
    }
    fail(new Error("Invalid FTP credentials"));
  });

  ftpServer.on("client-error", (payload: unknown) => {
    const { context, error } = payload as FtpClientError;
    logger.warn({ context, error }, "FTP client error");
  });

  ftpServer.on("STOR", (error: unknown, filePath: unknown) => {
    const storeError = error as FtpStoreError;
    const storedPath = filePath as string;
    if (storeError) {
      logger.error({ error: storeError, filePath: storedPath }, "FTP storage error");
      return;
    }
    logger.info({ filePath: path.join(dirs.incoming, storedPath) }, "FTP file stored");
  });

  return ftpServer;
};
