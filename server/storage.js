import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

export async function ensureDirectories() {
  await fs.mkdir(config.storageRoot, { recursive: true });
  await fs.mkdir(config.ftpIncomingDir, { recursive: true });
  await fs.mkdir(config.ftpArchiveDir, { recursive: true });
  await fs.mkdir(config.originalsDir, { recursive: true });
  await fs.mkdir(config.previewsDir, { recursive: true });
  await fs.mkdir(config.processedDir, { recursive: true });
  await fs.mkdir(config.metadataDir, { recursive: true });
}

export function publicStorageUrl(absolutePath) {
  const relative = path.relative(config.storageRoot, absolutePath);
  return `/storage/${relative.replaceAll(path.sep, "/")}`;
}
