import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  CONTROL_DIR,
  CONTROL_SETTINGS_PATH,
  INCOMING_DIR,
  METADATA_DIR,
  ORIGINALS_DIR,
  PROCESSED_FULL_DIR,
  PROCESSED_PREVIEW_DIR,
  metadataPath,
} from "./paths.js";
import { ImageStatus, nowIso } from "./contracts.js";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function ensureStorage() {
  await Promise.all([
    ensureDir(CONTROL_DIR),
    ensureDir(INCOMING_DIR),
    ensureDir(ORIGINALS_DIR),
    ensureDir(PROCESSED_FULL_DIR),
    ensureDir(PROCESSED_PREVIEW_DIR),
    ensureDir(METADATA_DIR),
  ]);
}

const DEFAULT_CONTROL_SETTINGS = Object.freeze({
  presetId: "clean-natural",
  retouchIntensity: 0.3,
  category: "portrait",
  updatedAt: nowIso(),
});

function compactDefinedValues(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

export async function readControlSettings() {
  await ensureStorage();
  try {
    const raw = await fs.readFile(CONTROL_SETTINGS_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      await fs.writeFile(CONTROL_SETTINGS_PATH, JSON.stringify(DEFAULT_CONTROL_SETTINGS, null, 2), "utf8");
      return { ...DEFAULT_CONTROL_SETTINGS };
    }
    throw error;
  }
}

export async function updateControlSettings(updates) {
  const current = await readControlSettings();
  const patch = compactDefinedValues(updates ?? {});
  const next = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  await fs.writeFile(CONTROL_SETTINGS_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function buildImageId() {
  return randomUUID();
}

export function buildFileNames(imageId, ext) {
  const safeExt = ext || ".jpg";
  return {
    incoming: `${imageId}${safeExt}`,
    original: `${imageId}${safeExt}`,
    full: `${imageId}${safeExt}`,
    preview: `${imageId}.jpg`,
  };
}

export async function saveImageMetadata(image) {
  await ensureStorage();
  const content = JSON.stringify(image, null, 2);
  await fs.writeFile(metadataPath(image.id), content, "utf8");
  return image;
}

export async function updateImageMetadata(imageId, updater) {
  const current = await readImageMetadata(imageId);
  if (!current) {
    throw new Error(`Image metadata not found for id ${imageId}`);
  }
  const next = {
    ...current,
    ...updater(current),
    updatedAt: nowIso(),
  };
  await saveImageMetadata(next);
  return next;
}

export async function readImageMetadata(imageId) {
  const filePath = metadataPath(imageId);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function listImageMetadata() {
  await ensureStorage();
  const files = await fs.readdir(METADATA_DIR);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));
  const rows = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(METADATA_DIR, file), "utf8");
      return JSON.parse(raw);
    }),
  );
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function newImageRecord({
  id,
  originalName,
  category,
  presetId,
  retouchIntensity,
  originalPath,
  fullPath = null,
  previewPath = null,
}) {
  const now = nowIso();
  return {
    id,
    originalName,
    category,
    presetId,
    retouchIntensity,
    status: ImageStatus.INGESTED,
    error: null,
    analysis: null,
    originalPath,
    fullPath,
    previewPath,
    createdAt: now,
    updatedAt: now,
  };
}
