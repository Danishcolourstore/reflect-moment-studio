import FtpSrv from "ftp-srv";
import { INCOMING_DIR, ensureStorage } from "@mirror-ai/shared";
import { config } from "./config.js";

export async function startFtpServer() {
  await ensureStorage();

  const ftpUrl = `ftp://${config.ftp.host}:${config.ftp.port}`;
  const server = new FtpSrv({
    url: ftpUrl,
    anonymous: false,
    pasv_min: 40000,
    pasv_max: 40100,
  });

  server.on("login", ({ username, password }, resolve, reject) => {
    if (username !== config.ftp.user || password !== config.ftp.password) {
      reject(new Error("Invalid FTP credentials"));
      return;
    }
    resolve({ root: INCOMING_DIR });
  });

  await server.listen();
  console.log(`[ftp] listening on ${ftpUrl} user=${config.ftp.user}`);
  return server;
}
