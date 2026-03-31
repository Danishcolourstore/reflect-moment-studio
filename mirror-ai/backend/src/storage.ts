import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

export async function ensureStorageDirs() {
  await Promise.all(
    Object.values(config.paths).map(async (dir) => {
      await fs.mkdir(dir, { recursive: true });
    }),
  );
}

export function resolveStoragePath(...parts: string[]) {
  return path.join(config.paths.storageRoot, ...parts);
}

export async function safeMove(srcPath: string, dstPath: string) {
  await fs.mkdir(path.dirname(dstPath), { recursive: true });
  await fs.rename(srcPath, dstPath);
}
