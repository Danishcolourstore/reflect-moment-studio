import path from "node:path";
import { config } from "../config.js";

const root = config.storage.root;

export const storagePaths = {
  root,
  incoming: path.join(root, "incoming"),
  originals: path.join(root, "originals"),
  processedPreview: path.join(root, "processed", "preview"),
  processedFull: path.join(root, "processed", "full"),
  metadata: path.join(root, "metadata"),
  dbFile: path.join(root, "metadata", "images.json"),
};

export const withStoragePath = (...segments) => path.join(root, ...segments);
