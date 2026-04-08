import path from "node:path";
import { FtpSrv } from "ftp-srv";
import { env } from "../config/env.js";

interface LoginData {
  username: string;
  password: string;
}

export interface FtpService {
  close(): Promise<void>;
}

export async function createFtpServer(inboxPath: string) {
  const ftpUrl = `ftp://${env.FTP_HOST}:${env.FTP_PORT}`;
  const server = new FtpSrv({
    url: ftpUrl,
    anonymous: false,
    greeting: ["Mirror AI FTP ingest ready"],
  });

  server.on(
    "login",
    (data: LoginData, resolve: (value: { root: string }) => void, reject: (reason?: Error) => void) => {
      if (data.username === env.FTP_USER && data.password === env.FTP_PASSWORD) {
        resolve({ root: path.resolve(inboxPath) });
        return;
      }
      reject(new Error("Invalid FTP credentials"));
    },
  );

  await server.listen();
  return {
    async close() {
      await server.close();
    },
  } satisfies FtpService;
}
