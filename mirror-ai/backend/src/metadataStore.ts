import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import type { ImageRecord } from "./types.js";

const dbFilePath = path.join(config.paths.metadata, "images.json");
const settingsFilePath = path.join(config.paths.metadata, "settings.json");

interface SettingsRecord {
  preset: ImageRecord["preset"];
  retouchIntensity: number;
  category: ImageRecord["category"];
}

const defaultSettings: SettingsRecord = {
  preset: config.DEFAULT_PRESET,
  retouchIntensity: config.DEFAULT_RETOUCH_INTENSITY,
  category: config.DEFAULT_CATEGORY,
};

async function ensureDbFile() {
  try {
    await fs.access(dbFilePath);
  } catch {
    await fs.writeFile(dbFilePath, JSON.stringify([], null, 2), "utf8");
  }
}

async function ensureSettingsFile() {
  try {
    await fs.access(settingsFilePath);
  } catch {
    await fs.writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2), "utf8");
  }
}

export async function initializeMetadataStore() {
  await ensureDbFile();
  await ensureSettingsFile();
}

async function readAll(): Promise<ImageRecord[]> {
  await ensureDbFile();
  const raw = await fs.readFile(dbFilePath, "utf8");
  return JSON.parse(raw) as ImageRecord[];
}

async function writeAll(records: ImageRecord[]) {
  await fs.writeFile(dbFilePath, JSON.stringify(records, null, 2), "utf8");
}

export async function createImageRecord(record: ImageRecord) {
  const records = await readAll();
  records.unshift(record);
  await writeAll(records);
  return record;
}

export async function updateImageRecord(
  id: string,
  updater: (record: ImageRecord) => ImageRecord,
): Promise<ImageRecord | null> {
  const records = await readAll();
  const idx = records.findIndex((r) => r.id === id);
  if (idx < 0) {
    return null;
  }
  records[idx] = updater(records[idx]);
  await writeAll(records);
  return records[idx];
}

export async function getImageById(id: string): Promise<ImageRecord | null> {
  const records = await readAll();
  return records.find((r) => r.id === id) ?? null;
}

export async function listImages(limit = 200): Promise<ImageRecord[]> {
  const records = await readAll();
  return records.slice(0, limit);
}

export async function getSettings(): Promise<SettingsRecord> {
  await ensureSettingsFile();
  const raw = await fs.readFile(settingsFilePath, "utf8");
  return JSON.parse(raw) as SettingsRecord;
}

export async function updateSettings(
  partial: Partial<SettingsRecord>,
): Promise<SettingsRecord> {
  const existing = await getSettings();
  const next: SettingsRecord = { ...existing, ...partial };
  await fs.writeFile(settingsFilePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
