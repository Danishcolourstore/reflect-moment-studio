/**
 * Centralized z-index scale for Mirror AI
 * Use these constants instead of hardcoded values
 */
export const Z_INDEX = {
  base: 1,
  dropdown: 50,
  sticky: 100,
  modal: 200,
  overlay: 190,
  toast: 300,
  floatingButton: 400,
  daan: 200,
  daanPanel: 200,
} as const;

/**
 * Storage bucket constants
 */
export const STORAGE_BUCKETS = {
  GALLERY_PHOTOS: 'gallery-photos',
  BUG_SCREENSHOTS: 'bug-screenshots',
  AVATARS: 'avatars',
  LOGOS: 'logos',
  WATERMARKS: 'watermarks',
  ALBUMS: 'albums',
} as const;

/**
 * Dev-only logger — logs only in development, no-ops in production
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => { if (isDev) console.log(...args); },
  warn: (...args: any[]) => { if (isDev) console.warn(...args); },
  error: (...args: any[]) => { if (isDev) console.error(...args); },
  info: (...args: any[]) => { if (isDev) console.info(...args); },
} as const;
