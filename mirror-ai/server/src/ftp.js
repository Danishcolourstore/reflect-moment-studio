import FtpSrv from "ftp-srv";

export async function startFtpServer({ ftpConfig, incomingDir, logger }) {
  const ftpServer = new FtpSrv({
    url: `ftp://${ftpConfig.host}:${ftpConfig.port}`,
    anonymous: false,
    pasv_url: ftpConfig.publicIp,
    pasv_min: ftpConfig.passiveMinPort,
    pasv_max: ftpConfig.passiveMaxPort,
    greeting: ["Mirror AI FTP ingestion online"],
  });

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username === ftpConfig.username && password === ftpConfig.password) {
      resolve({ root: incomingDir });
      return;
    }
    reject(new Error("Invalid FTP credentials"));
  });

  ftpServer.on("client-error", ({ context, error }) => {
    logger.warn("FTP client error", {
      context,
      error: error?.message || String(error),
    });
  });

  await ftpServer.listen();
  logger.info("FTP server started", {
    host: ftpConfig.host,
    port: ftpConfig.port,
    username: ftpConfig.username,
    ingestRoot: incomingDir,
  });

  return {
    close: () => ftpServer.close(),
  };
}
