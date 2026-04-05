import fs from "node:fs/promises";
import path from "node:path";
import { ensureUniqueFilePath } from "./utils.js";

export async function ensureStorageReady(paths) {
  await Promise.all([
    fs.mkdir(paths.incoming, { recursive: true }),
    fs.mkdir(paths.originals, { recursive: true }),
    fs.mkdir(paths.previews, { recursive: true }),
    fs.mkdir(paths.processed, { recursive: true }),
    fs.mkdir(paths.metadata, { recursive: true }),
  ]);
}

export async function copyIncomingToOriginal(filePath, originalsDir) {
  const ext = path.extname(filePath).toLowerCase() || ".jpg";
  const base = path.basename(filePath, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
  const candidate = path.join(originalsDir, `${base}-${Date.now()}${ext}`);
  const targetPath = await ensureUniqueFilePath(candidate);
  await fs.copyFile(filePath, targetPath);
  return {
    originalFilePath: targetPath,
    originalFileName: path.basename(targetPath),
  };
}
