import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";

export function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName);
  return base.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
}

export function makeStoredName(originalName: string): string {
  const safe = sanitizeFileName(originalName);
  const ext = path.extname(safe) || ".jpg";
  const stem = safe.replace(ext, "");
  return `${Date.now()}-${randomUUID()}-${stem}${ext}`;
}

export function toPublicUrl(filePath: string): string {
  const relative = path.relative(config.storageRoot, filePath).split(path.sep).join("/");
  return `${config.MIRROR_PUBLIC_URL}/files/${encodeURI(relative)}`;
}
