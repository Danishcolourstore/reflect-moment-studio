import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "./config";
import { DEFAULT_PRESET } from "./presets";
import type { ImageRecord, MirrorDatabaseSchema, MirrorSettings } from "./types";

const defaultSettings: MirrorSettings = {
  defaultPreset: DEFAULT_PRESET,
  defaultRetouchIntensity: 35,
  defaultCategory: "portrait",
};

function nowIso() {
  return new Date().toISOString();
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureMetadataFile() {
  const db: MirrorDatabaseSchema = {
    images: [],
    settings: defaultSettings,
  };

  try {
    await fs.access(config.storage.metadataFile);
  } catch {
    await fs.writeFile(config.storage.metadataFile, JSON.stringify(db, null, 2), "utf8");
  }
}

export async function ensureStorage() {
  await Promise.all([
    ensureDir(config.storage.root),
    ensureDir(config.storage.incoming),
    ensureDir(config.storage.originals),
    ensureDir(config.storage.previews),
    ensureDir(config.storage.processed),
  ]);
  await ensureMetadataFile();
}

async function readDb(): Promise<MirrorDatabaseSchema> {
  await ensureStorage();
  const content = await fs.readFile(config.storage.metadataFile, "utf8");
  return JSON.parse(content) as MirrorDatabaseSchema;
}

async function writeDb(data: MirrorDatabaseSchema) {
  await fs.writeFile(config.storage.metadataFile, JSON.stringify(data, null, 2), "utf8");
}

export async function createImageRecord(params: {
  filename: string;
  originalPath: string;
  preset?: string;
  retouchIntensity?: number;
  category?: string;
}): Promise<ImageRecord> {
  const db = await readDb();
  const now = nowIso();
  const record: ImageRecord = {
    id: randomUUID(),
    filename: params.filename,
    originalPath: params.originalPath,
    status: "queued",
    preset: params.preset ?? db.settings.defaultPreset,
    retouchIntensity: params.retouchIntensity ?? db.settings.defaultRetouchIntensity,
    category: params.category ?? db.settings.defaultCategory,
    createdAt: now,
    updatedAt: now,
  };
  db.images.unshift(record);
  await writeDb(db);
  return record;
}

export async function updateImageRecord(
  imageId: string,
  patch: Partial<Omit<ImageRecord, "id" | "createdAt">>,
): Promise<ImageRecord | null> {
  const db = await readDb();
  const index = db.images.findIndex((image) => image.id === imageId);
  if (index === -1) {
    return null;
  }
  const next: ImageRecord = {
    ...db.images[index],
    ...patch,
    updatedAt: nowIso(),
  };
  db.images[index] = next;
  await writeDb(db);
  return next;
}

export async function getImageRecord(imageId: string): Promise<ImageRecord | null> {
  const db = await readDb();
  return db.images.find((image) => image.id === imageId) ?? null;
}

export async function listImages(): Promise<ImageRecord[]> {
  const db = await readDb();
  return db.images;
}

export async function getSettings(): Promise<MirrorSettings> {
  const db = await readDb();
  return db.settings;
}

export async function updateSettings(patch: Partial<MirrorSettings>): Promise<MirrorSettings> {
  const db = await readDb();
  db.settings = { ...db.settings, ...patch };
  await writeDb(db);
  return db.settings;
}

export async function batchUpdateImages(
  imageIds: string[],
  patch: Partial<Pick<ImageRecord, "preset" | "retouchIntensity" | "category">>,
): Promise<ImageRecord[]> {
  const db = await readDb();
  const touched: ImageRecord[] = [];
  for (let idx = 0; idx < db.images.length; idx += 1) {
    const image = db.images[idx];
    if (!imageIds.includes(image.id)) {
      continue;
    }
    const next: ImageRecord = {
      ...image,
      ...patch,
      updatedAt: nowIso(),
    };
    db.images[idx] = next;
    touched.push(next);
  }
  await writeDb(db);
  return touched;
}

export async function moveToOriginals(tempPath: string, filename: string) {
  const safeName = `${Date.now()}-${filename.replace(/\s+/g, "-").toLowerCase()}`;
  const destination = path.join(config.storage.originals, safeName);
  await fs.rename(tempPath, destination);
  return destination;
}
