import fs from "node:fs/promises";
import { FtpSrv } from "ftp-srv";
import { config } from "./config.js";
import { logger } from "./logger.js";

export async function startFtpServer() {
  await fs.mkdir(config.paths.incoming, { recursive: true });
  const ftpUrl = `ftp://${config.FTP_HOST}:${config.FTP_PORT}`;
  const server = new FtpSrv({
    url: ftpUrl,
    anonymous: false,
    pasv_min: config.FTP_PORT + 1,
    pasv_max: config.FTP_PORT + 50,
  });

  server.on("login", ({ username, password }, resolve, reject) => {
    if (username === config.FTP_USER && password === config.FTP_PASS) {
      return resolve({ root: config.paths.incoming });
    }
    return reject(new Error("Invalid FTP credentials"));
  });

  server.on("client-error", ({ context, error }) => {
    logger.warn({ err: error, context }, "ftp client error");
  });

  await server.listen();
  logger.info({ ftpUrl, incomingDir: config.paths.incoming }, "ftp server started");

  return {
    close: async () => {
      await server.close();
    },
  };
}
