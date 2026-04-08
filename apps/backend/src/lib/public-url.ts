import path from "node:path";
import { env } from "../config/env.js";

function normalize(value: string): string {
  return value.replaceAll(path.sep, "/");
}

export function buildPublicImageUrl(filePath: string): string {
  const relative = normalize(path.relative(env.STORAGE_ROOT, filePath));
  if (relative.startsWith("inbox/")) return `/assets/${relative}`;
  if (relative.startsWith("originals/")) return `/assets/${relative}`;
  if (relative.startsWith("previews/")) return `/assets/${relative}`;
  if (relative.startsWith("processed/")) return `/assets/${relative}`;
  return `/assets/originals/${path.basename(filePath)}`;
}
