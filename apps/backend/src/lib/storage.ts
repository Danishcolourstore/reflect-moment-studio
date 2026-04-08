import fs from "node:fs/promises";
import path from "node:path";

export interface StorageDirs {
  root: string;
  inbox: string;
  originals: string;
  previews: string;
  processed: string;
  metadata: string;
}

export async function ensureStorageDirs(root: string): Promise<StorageDirs> {
  const dirs: StorageDirs = {
    root,
    inbox: path.resolve(root, "inbox"),
    originals: path.resolve(root, "originals"),
    previews: path.resolve(root, "previews"),
    processed: path.resolve(root, "processed"),
    metadata: path.resolve(root, "metadata"),
  };

  await Promise.all(Object.values(dirs).map((dir) => fs.mkdir(dir, { recursive: true })));
  return dirs;
}

export function ensureImageFilename(filename: string): string {
  const normalized = filename.toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || normalized.endsWith(".png") || normalized.endsWith(".webp")) {
    return filename;
  }
  return `${filename}.jpg`;
}
