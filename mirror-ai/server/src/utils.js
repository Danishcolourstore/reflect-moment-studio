import path from "node:path";
import { randomUUID } from "node:crypto";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

export function isSupportedImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

export function safeBaseName(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function generateImageId() {
  return randomUUID().replace(/-/g, "");
}

export function nowIso() {
  return new Date().toISOString();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureUniqueFilePath(candidatePath) {
  const fs = await import("node:fs/promises");
  const ext = path.extname(candidatePath);
  const base = ext ? candidatePath.slice(0, -ext.length) : candidatePath;
  let output = candidatePath;
  let suffix = 1;

  while (true) {
    try {
      await fs.access(output);
      output = `${base}-${suffix}${ext}`;
      suffix += 1;
    } catch {
      return output;
    }
  }
}
