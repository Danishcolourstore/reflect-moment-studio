import fs from "node:fs/promises";
import path from "node:path";
import { storagePaths } from "./paths.js";
import { ensureDir, writeJsonAtomic } from "../utils/fs.js";
import { logger } from "../logger.js";

const createDefaultState = () => ({
  images: [],
  presets: [
    {
      id: "editorial-clean",
      label: "Editorial Clean",
      exposure: 0.35,
      warmth: 0.2,
      saturation: 1.05,
      contrast: 1.12,
      skinSoftening: 0.16,
      shadowsLift: 0.12,
      grain: 0,
    },
    {
      id: "midnight-luxe",
      label: "Midnight Luxe",
      exposure: 0.1,
      warmth: -0.1,
      saturation: 1.0,
      contrast: 1.22,
      skinSoftening: 0.2,
      shadowsLift: 0.05,
      grain: 0.04,
    },
    {
      id: "sunset-skin",
      label: "Sunset Skin",
      exposure: 0.45,
      warmth: 0.35,
      saturation: 1.09,
      contrast: 1.06,
      skinSoftening: 0.26,
      shadowsLift: 0.18,
      grain: 0.01,
    },
  ],
  controls: {
    activePresetId: "editorial-clean",
    retouchIntensity: 0.2,
  },
  categories: [
    { id: "wedding", label: "Wedding" },
    { id: "fashion", label: "Fashion" },
    { id: "portrait", label: "Portrait" },
    { id: "event", label: "Event" },
  ],
  updatedAt: new Date().toISOString(),
});

const dbPath = storagePaths.dbFile;
let state = createDefaultState();

const touch = () => {
  state.updatedAt = new Date().toISOString();
};

export const initStore = async () => {
  await ensureDir(path.dirname(dbPath));

  try {
    const content = await fs.readFile(dbPath, "utf8");
    const parsed = JSON.parse(content);
    state = {
      ...createDefaultState(),
      ...parsed,
    };
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.warn({ err: error }, "Unable to load metadata db, creating fresh");
    }
    await persistStore();
  }
};

export const persistStore = async () => {
  touch();
  await writeJsonAtomic(dbPath, state);
};

export const getState = () => state;

export const listImages = () => [...state.images].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

export const getImageById = (id) => state.images.find((image) => image.id === id);

export const upsertImage = async (image) => {
  const currentIndex = state.images.findIndex((candidate) => candidate.id === image.id);
  if (currentIndex >= 0) {
    state.images[currentIndex] = {
      ...state.images[currentIndex],
      ...image,
      updatedAt: new Date().toISOString(),
    };
  } else {
    state.images.push({
      ...image,
      createdAt: image.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await persistStore();
  return getImageById(image.id);
};

export const updateImage = async (id, patch) => {
  const existing = getImageById(id);
  if (!existing) {
    return null;
  }

  Object.assign(existing, patch, { updatedAt: new Date().toISOString() });
  await persistStore();
  return existing;
};

export const getPresets = () => state.presets;

export const updatePreset = async (presetId, patch) => {
  const preset = state.presets.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return null;
  }
  Object.assign(preset, patch);
  await persistStore();
  return preset;
};

export const getControls = () => state.controls;

export const updateControls = async (patch) => {
  state.controls = { ...state.controls, ...patch };
  await persistStore();
  return state.controls;
};

export const listCategories = () => state.categories;

export const getActivePreset = () =>
  state.presets.find((preset) => preset.id === state.controls.activePresetId) ?? state.presets[0];
