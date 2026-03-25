import path from "node:path";
import fs from "node:fs/promises";

export interface StoragePaths {
  root: string;
  ftpInbox: string;
  originals: string;
  preview: string;
  processed: string;
  metaDir: string;
}

export async function ensureStorage(rootPath: string): Promise<StoragePaths> {
  const root = path.resolve(rootPath);
  const paths: StoragePaths = {
    root,
    ftpInbox: path.join(root, "ftp-inbox"),
    originals: path.join(root, "originals"),
    preview: path.join(root, "processed", "preview"),
    processed: path.join(root, "processed", "full"),
    metaDir: path.join(root, "meta"),
  };

  await Promise.all([
    fs.mkdir(paths.root, { recursive: true }),
    fs.mkdir(paths.ftpInbox, { recursive: true }),
    fs.mkdir(paths.originals, { recursive: true }),
    fs.mkdir(paths.preview, { recursive: true }),
    fs.mkdir(paths.processed, { recursive: true }),
    fs.mkdir(paths.metaDir, { recursive: true }),
  ]);

  return paths;
}

export function pathToPublicUrl(publicBaseUrl: string, relPath: string): string {
  return `${publicBaseUrl}/files/${relPath.replace(/\\/g, "/")}`;
}
