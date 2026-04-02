import path from "node:path";
import { env } from "./env.js";

const storageRoot = path.resolve(env.STORAGE_ROOT);
const metadataDir = path.join(storageRoot, "metadata");

export const paths = {
  storageRoot,
  ftpInbox: path.join(storageRoot, "ftp-inbox"),
  originals: path.join(storageRoot, "originals"),
  previews: path.join(storageRoot, "previews"),
  processed: path.join(storageRoot, "processed"),
  metadataDir,
  metadataFile: path.join(metadataDir, "images.json"),
};

export function toRelativeStoragePath(absolutePath: string): string {
  return path.relative(paths.storageRoot, absolutePath).replaceAll(path.sep, "/");
}

export function toAbsoluteStoragePath(relativePath: string): string {
  return path.join(paths.storageRoot, relativePath);
}
