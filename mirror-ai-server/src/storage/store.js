import path from "node:path";
import fs from "node:fs/promises";
import { ensureDir, writeJsonFile } from "./filesystem.js";

const runRootName = () => {
  const iso = new Date().toISOString().replaceAll(":", "-");
  return `run-${iso}`;
};

export class StorageManager {
  constructor(storageRoot) {
    this.storageRoot = storageRoot;
    this.runId = runRootName();
    this.runDir = path.join(storageRoot, this.runId);
    this.originalsDir = path.join(this.runDir, "originals");
    this.previewsDir = path.join(this.runDir, "previews");
    this.processedDir = path.join(this.runDir, "processed");
    this.metadataDir = path.join(this.runDir, "metadata");
  }

  async init() {
    await Promise.all([
      ensureDir(this.storageRoot),
      ensureDir(this.runDir),
      ensureDir(this.originalsDir),
      ensureDir(this.previewsDir),
      ensureDir(this.processedDir),
      ensureDir(this.metadataDir),
    ]);
    return this;
  }

  get ftpInboxDir() {
    return path.join(this.runDir, "ftp-inbox");
  }

  get incomingDir() {
    return path.join(this.runDir, "incoming");
  }

  toPublicUrl(relativePath) {
    return `/assets/${relativePath}`;
  }

  buildPaths(filename) {
    return {
      relativeOriginalPath: path.posix.join("originals", filename),
      relativePreviewPath: path.posix.join("previews", filename),
      relativeProcessedPath: path.posix.join("processed", filename),
      relativeMetadataPath: path.posix.join("metadata", `${filename}.json`),
      originalPath: path.join(this.originalsDir, filename),
      previewPath: path.join(this.previewsDir, filename),
      processedPath: path.join(this.processedDir, filename),
      metadataPath: path.join(this.metadataDir, `${filename}.json`),
    };
  }

  async writeMetadata(filename, metadata) {
    const { metadataPath } = this.buildPaths(filename);
    await writeJsonFile(metadataPath, metadata);
    return metadataPath;
  }

  async copyFile(sourcePath, destinationPath) {
    await fs.copyFile(sourcePath, destinationPath);
  }
}
