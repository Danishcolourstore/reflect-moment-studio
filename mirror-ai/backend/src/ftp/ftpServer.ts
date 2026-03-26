import FtpSrv from 'ftp-srv';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const startFtpServer = (root: string): FtpSrv => {
  const ftpServer = new FtpSrv({
    url: `ftp://${env.FTP_HOST}:${env.FTP_PORT}`,
    pasv_url: env.FTP_PASV_URL,
    pasv_min: env.FTP_PASV_MIN,
    pasv_max: env.FTP_PASV_MAX,
    anonymous: false,
  });

  ftpServer.on('login', ({ username, password }, resolve, reject) => {
    if (username === env.FTP_USER && password === env.FTP_PASSWORD) {
      resolve({ root });
      return;
    }

    reject(new Error('Invalid FTP credentials'));
  });

  ftpServer.on('client-error', ({ context, error }) => {
    logger.warn({ context, error }, 'FTP client error');
  });

  ftpServer.listen()
    .then(() => logger.info(`FTP server listening on ${env.FTP_HOST}:${env.FTP_PORT}`))
    .catch((error: unknown) => logger.error({ error }, 'Failed to start FTP server'));

  return ftpServer;
};
