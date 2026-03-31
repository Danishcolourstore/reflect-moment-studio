import path from "node:path";
import { config } from "./config.js";

export function toUnixPath(input: string) {
  return input.split(path.sep).join("/");
}

export function toMediaUrl(filePath: string | null) {
  if (!filePath) {
    return null;
  }
  const rel = path.relative(config.paths.storageRoot, filePath);
  return `/media/${toUnixPath(rel)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
