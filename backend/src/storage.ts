import { promises as fs } from "node:fs";
import path from "node:path";
import { storagePaths } from "./config.js";

const DIRECTORIES = [
  storagePaths.root,
  storagePaths.originals,
  storagePaths.processed,
  storagePaths.previews,
  storagePaths.uploads,
  storagePaths.metadata,
];

export const ensureStorageLayout = async (): Promise<void> => {
  await Promise.all(DIRECTORIES.map((dir) => fs.mkdir(dir, { recursive: true })));
};

export const moveToOriginals = async (sourcePath: string, imageId: string, originalFileName: string): Promise<string> => {
  await fs.mkdir(storagePaths.originals, { recursive: true });
  const ext = path.extname(originalFileName) || ".jpg";
  const targetPath = path.join(storagePaths.originals, `${imageId}${ext.toLowerCase()}`);
  await fs.rename(sourcePath, targetPath);
  return targetPath;
};
