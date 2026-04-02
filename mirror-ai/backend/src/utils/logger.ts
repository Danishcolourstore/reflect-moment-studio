/* eslint-disable no-console */
const stamp = () => new Date().toISOString();

export const logger = {
  info(message: string, meta?: unknown) {
    if (meta !== undefined) {
      console.log(`[${stamp()}] INFO  ${message}`, meta);
      return;
    }
    console.log(`[${stamp()}] INFO  ${message}`);
  },
  warn(message: string, meta?: unknown) {
    if (meta !== undefined) {
      console.warn(`[${stamp()}] WARN  ${message}`, meta);
      return;
    }
    console.warn(`[${stamp()}] WARN  ${message}`);
  },
  error(message: string, meta?: unknown) {
    if (meta !== undefined) {
      console.error(`[${stamp()}] ERROR ${message}`, meta);
      return;
    }
    console.error(`[${stamp()}] ERROR ${message}`);
  },
};
