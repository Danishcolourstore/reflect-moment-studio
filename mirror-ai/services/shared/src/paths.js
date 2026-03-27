import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "../../../");
export const STORAGE_DIR = path.join(ROOT_DIR, "storage");
export const INCOMING_DIR = path.join(STORAGE_DIR, "incoming");
export const ORIGINALS_DIR = path.join(STORAGE_DIR, "originals");
export const PROCESSED_FULL_DIR = path.join(STORAGE_DIR, "processed/full");
export const PROCESSED_PREVIEW_DIR = path.join(STORAGE_DIR, "processed/preview");
export const METADATA_DIR = path.join(STORAGE_DIR, "metadata");
export const CONTROL_DIR = path.join(STORAGE_DIR, "control");
export const CONTROL_SETTINGS_PATH = path.join(CONTROL_DIR, "settings.json");

export function metadataPath(imageId) {
  return path.join(METADATA_DIR, `${imageId}.json`);
}
