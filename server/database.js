import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "./config.js";
import { BUILTIN_PRESETS, DEFAULT_PRESET_ID, SHOOT_CATEGORIES } from "./presets.js";

const dbDir = path.dirname(config.dbPath);
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  source_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  retouch_intensity REAL NOT NULL DEFAULT 0.2,
  exposure_score REAL DEFAULT 0,
  skin_tone_score REAL DEFAULT 0,
  lighting_score REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  preview_path TEXT,
  processed_path TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  processed_at TEXT
);

CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  config_json TEXT NOT NULL,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

const insertPresetStmt = db.prepare(`
INSERT OR IGNORE INTO presets (id, name, description, config_json, is_builtin, created_at, updated_at)
VALUES (@id, @name, @description, @config_json, @is_builtin, @created_at, @updated_at)
`);

const insertImageStmt = db.prepare(`
INSERT INTO images (
  id,
  original_filename,
  source_path,
  category,
  status,
  preset_id,
  retouch_intensity,
  created_at,
  updated_at
)
VALUES (
  @id,
  @original_filename,
  @source_path,
  @category,
  @status,
  @preset_id,
  @retouch_intensity,
  @created_at,
  @updated_at
)
`);

const updateImageStatusStmt = db.prepare(`
UPDATE images
SET
  status = @status,
  updated_at = @updated_at
WHERE id = @id
`);

const updateImageFailureStmt = db.prepare(`
UPDATE images
SET
  status = 'failed',
  notes = @notes,
  updated_at = @updated_at
WHERE id = @id
`);

const updateImageResultStmt = db.prepare(`
UPDATE images
SET
  status = 'done',
  preview_path = @preview_path,
  processed_path = @processed_path,
  exposure_score = @exposure_score,
  skin_tone_score = @skin_tone_score,
  lighting_score = @lighting_score,
  notes = @notes,
  width = @width,
  height = @height,
  metadata_json = @metadata_json,
  processed_at = @processed_at,
  updated_at = @updated_at
WHERE id = @id
`);

const updateImageControlStmt = db.prepare(`
UPDATE images
SET
  preset_id = @preset_id,
  retouch_intensity = @retouch_intensity,
  updated_at = @updated_at
WHERE id = @id
`);

const updateImageCategoryStmt = db.prepare(`
UPDATE images
SET
  category = @category,
  updated_at = @updated_at
WHERE id = @id
`);

const listImagesStmt = db.prepare(`
SELECT *
FROM images
ORDER BY created_at DESC
LIMIT @limit OFFSET @offset
`);

const getImageStmt = db.prepare(`
SELECT *
FROM images
WHERE id = @id
`);

const getPresetsStmt = db.prepare(`
SELECT id, name, description, config_json, is_builtin, created_at, updated_at
FROM presets
ORDER BY is_builtin DESC, name ASC
`);

const getPresetStmt = db.prepare(`
SELECT id, name, description, config_json, is_builtin, created_at, updated_at
FROM presets
WHERE id = @id
`);

const upsertSettingStmt = db.prepare(`
INSERT INTO app_settings (key, value_json, updated_at)
VALUES (@key, @value_json, @updated_at)
ON CONFLICT(key) DO UPDATE SET
  value_json = excluded.value_json,
  updated_at = excluded.updated_at
`);

const getSettingStmt = db.prepare(`
SELECT key, value_json, updated_at
FROM app_settings
WHERE key = @key
`);

function seedData() {
  const now = new Date().toISOString();
  for (const preset of BUILTIN_PRESETS) {
    insertPresetStmt.run({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      config_json: JSON.stringify(preset.config),
      is_builtin: 1,
      created_at: now,
      updated_at: now,
    });
  }

  if (!getSetting("live_control")) {
    setSetting("live_control", {
      activePresetId: DEFAULT_PRESET_ID,
      retouchIntensity: config.defaultRetouchIntensity,
      activeCategory: "general",
    });
  }
}

seedData();

function parsePreset(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    config: JSON.parse(row.config_json),
    isBuiltin: Boolean(row.is_builtin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseImage(row) {
  if (!row) return null;
  return {
    id: row.id,
    originalFilename: row.original_filename,
    sourcePath: row.source_path,
    category: row.category,
    status: row.status,
    presetId: row.preset_id,
    retouchIntensity: Number(row.retouch_intensity ?? 0),
    exposureScore: Number(row.exposure_score ?? 0),
    skinToneScore: Number(row.skin_tone_score ?? 0),
    lightingScore: Number(row.lighting_score ?? 0),
    notes: row.notes ?? "",
    width: Number(row.width ?? 0),
    height: Number(row.height ?? 0),
    previewPath: row.preview_path,
    processedPath: row.processed_path,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    processedAt: row.processed_at,
  };
}

export function createImageRecord({
  id,
  originalFilename,
  sourcePath,
  category = "general",
  presetId,
  retouchIntensity,
}) {
  const sanitizedCategory = SHOOT_CATEGORIES.includes(category) ? category : "general";
  const control = getLiveControl();
  const chosenPresetId = presetId ?? control.activePresetId ?? DEFAULT_PRESET_ID;
  const chosenRetouch =
    typeof retouchIntensity === "number"
      ? Math.min(Math.max(retouchIntensity, 0), 1)
      : control.retouchIntensity;
  const now = new Date().toISOString();

  insertImageStmt.run({
    id,
    original_filename: originalFilename,
    source_path: sourcePath,
    category: sanitizedCategory,
    status: "queued",
    preset_id: chosenPresetId,
    retouch_intensity: chosenRetouch,
    created_at: now,
    updated_at: now,
  });

  return getImage(id);
}

export function updateImageStatus(id, status) {
  updateImageStatusStmt.run({
    id,
    status,
    updated_at: new Date().toISOString(),
  });
}

export function updateImageFailed(id, message) {
  updateImageFailureStmt.run({
    id,
    notes: message,
    updated_at: new Date().toISOString(),
  });
}

export function updateImageProcessingResult(id, result) {
  const now = new Date().toISOString();
  updateImageResultStmt.run({
    id,
    preview_path: result.previewPath,
    processed_path: result.processedPath,
    exposure_score: result.analysis.exposureScore,
    skin_tone_score: result.analysis.skinToneScore,
    lighting_score: result.analysis.lightingScore,
    notes: result.analysis.notes,
    width: result.metadata.width,
    height: result.metadata.height,
    metadata_json: JSON.stringify(result.metadata),
    processed_at: now,
    updated_at: now,
  });
}

export function updateImageControl({ id, presetId, retouchIntensity }) {
  updateImageControlStmt.run({
    id,
    preset_id: presetId,
    retouch_intensity: Math.min(Math.max(retouchIntensity, 0), 1),
    updated_at: new Date().toISOString(),
  });
}

export function updateImageCategory({ id, category }) {
  const safeCategory = SHOOT_CATEGORIES.includes(category) ? category : "general";
  updateImageCategoryStmt.run({
    id,
    category: safeCategory,
    updated_at: new Date().toISOString(),
  });
}

export function batchUpdateCategory({ ids, category }) {
  const safeCategory = SHOOT_CATEGORIES.includes(category) ? category : "general";
  const tx = db.transaction((imageIds) => {
    for (const imageId of imageIds) {
      updateImageCategoryStmt.run({
        id: imageId,
        category: safeCategory,
        updated_at: new Date().toISOString(),
      });
    }
  });
  tx(ids);
  return ids.map((id) => getImage(id)).filter(Boolean);
}

export function listImages({ limit = 100, offset = 0 } = {}) {
  return listImagesStmt.all({ limit, offset }).map(parseImage);
}

export function getImage(id) {
  return parseImage(getImageStmt.get({ id }));
}

export function getPresets() {
  return getPresetsStmt.all().map(parsePreset);
}

export function getPreset(id) {
  return parsePreset(getPresetStmt.get({ id }));
}

export function setSetting(key, value) {
  upsertSettingStmt.run({
    key,
    value_json: JSON.stringify(value),
    updated_at: new Date().toISOString(),
  });
}

export function getSetting(key) {
  const row = getSettingStmt.get({ key });
  if (!row) return null;
  return {
    key: row.key,
    value: JSON.parse(row.value_json),
    updatedAt: row.updated_at,
  };
}

export function getLiveControl() {
  const setting = getSetting("live_control");
  const fallback = {
    activePresetId: DEFAULT_PRESET_ID,
    retouchIntensity: config.defaultRetouchIntensity,
    activeCategory: "general",
  };
  if (!setting) return fallback;
  return {
    activePresetId: setting.value.activePresetId ?? fallback.activePresetId,
    retouchIntensity: Number(setting.value.retouchIntensity ?? fallback.retouchIntensity),
    activeCategory: setting.value.activeCategory ?? fallback.activeCategory,
  };
}

export function setLiveControl({ activePresetId, retouchIntensity, activeCategory }) {
  const current = getLiveControl();
  const next = {
    activePresetId: activePresetId ?? current.activePresetId,
    retouchIntensity:
      typeof retouchIntensity === "number"
        ? Math.min(Math.max(retouchIntensity, 0), 1)
        : current.retouchIntensity,
    activeCategory:
      activeCategory && SHOOT_CATEGORIES.includes(activeCategory)
        ? activeCategory
        : current.activeCategory,
  };
  setSetting("live_control", next);
  return next;
}
