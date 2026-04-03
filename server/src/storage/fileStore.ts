import path from "node:path";
import { promises as fs } from "node:fs";
import { env } from "../config/env";

export const storageRoot = env.storageRoot;

export async function ensureStorageDirs(): Promise<void> {
  await Promise.all(Object.values(env.storagePaths).map((dir) => fs.mkdir(dir, { recursive: true })));
}

export function toStorageUrl(absolutePath: string): string {
  const rel = path.relative(storageRoot, absolutePath).replaceAll("\\", "/");
  return `/storage/${rel}`;
}

export const toPublicUrl = toStorageUrl;
