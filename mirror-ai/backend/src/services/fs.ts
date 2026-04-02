import { promises as fs } from "node:fs";
import { paths } from "../config/paths.js";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function initializeStorage(): Promise<void> {
  await Promise.all([
    ensureDir(paths.storageRoot),
    ensureDir(paths.ftpInbox),
    ensureDir(paths.originals),
    ensureDir(paths.previews),
    ensureDir(paths.processed),
    ensureDir(paths.metadataDir),
  ]);
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function moveFile(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch {
    await fs.copyFile(sourcePath, destinationPath);
    await fs.unlink(sourcePath);
  }
}
