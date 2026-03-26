import path from 'node:path';
import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import { logger } from '../utils/logger.js';

export const startIncomingWatcher = (
  uploadDir: string,
  onImage: (filePath: string) => Promise<void>,
): FSWatcher => {
  const watcher = chokidar.watch(uploadDir, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 800,
      pollInterval: 100,
    },
  });

  watcher.on('add', async (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.tiff'].includes(ext)) {
      return;
    }

    try {
      await onImage(filePath);
    } catch (error) {
      logger.error({ filePath, error }, 'Failed to ingest watched image');
    }
  });

  watcher.on('error', (error) => {
    logger.error({ error }, 'File watcher error');
  });

  return watcher;
};
