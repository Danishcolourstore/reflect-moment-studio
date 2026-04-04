import fs from "node:fs";
import path from "node:path";
import lockfile from "proper-lockfile";
import { env } from "../config/env.js";
import { presets } from "../processing/presets.js";
import type { ControlState, ImageRecord, MirrorState, PresetId } from "../types.js";

const nowIso = (): string => new Date().toISOString();

const defaultControls = (): ControlState => ({
  defaultPreset: env.MIRROR_AI_DEFAULT_PRESET as PresetId,
  defaultRetouchIntensity: env.MIRROR_AI_DEFAULT_RETOUCH,
  defaultCategory: env.MIRROR_AI_DEFAULT_CATEGORY,
  updatedAt: nowIso(),
});

const defaultState = (): MirrorState => ({
  images: {},
  imageOrder: [],
  controls: defaultControls(),
  presets,
});

const writeState = (state: MirrorState): void => {
  fs.mkdirSync(path.dirname(env.MIRROR_AI_DATA_FILE), { recursive: true });
  fs.writeFileSync(env.MIRROR_AI_DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
};

const readState = (): MirrorState => {
  if (!fs.existsSync(env.MIRROR_AI_DATA_FILE)) {
    const state = defaultState();
    writeState(state);
    return state;
  }
  const raw = fs.readFileSync(env.MIRROR_AI_DATA_FILE, "utf-8");
  if (!raw.trim()) {
    const state = defaultState();
    writeState(state);
    return state;
  }
  const parsed = JSON.parse(raw) as Partial<MirrorState>;
  const controls: ControlState = {
    ...defaultControls(),
    ...(parsed.controls ?? {}),
    defaultPreset: (parsed.controls?.defaultPreset ?? env.MIRROR_AI_DEFAULT_PRESET) as PresetId,
    defaultRetouchIntensity:
      parsed.controls?.defaultRetouchIntensity ?? env.MIRROR_AI_DEFAULT_RETOUCH,
    defaultCategory: parsed.controls?.defaultCategory ?? env.MIRROR_AI_DEFAULT_CATEGORY,
    updatedAt: parsed.controls?.updatedAt ?? nowIso(),
  };

  return {
    images: parsed.images ?? {},
    imageOrder: parsed.imageOrder ?? [],
    controls,
    presets,
  };
};

export class StateStore {
  async withState<T>(fn: (state: MirrorState) => T | Promise<T>): Promise<T> {
    fs.mkdirSync(path.dirname(env.MIRROR_AI_DATA_FILE), { recursive: true });
    if (!fs.existsSync(env.MIRROR_AI_DATA_FILE)) {
      writeState(defaultState());
    }

    const release = await lockfile.lock(env.MIRROR_AI_DATA_FILE, {
      retries: {
        retries: 10,
        factor: 1.2,
        minTimeout: 10,
        maxTimeout: 120,
      },
      realpath: false,
    });

    try {
      const state = readState();
      const result = await fn(state);
      writeState(state);
      return result;
    } finally {
      await release();
    }
  }

  async getState(): Promise<MirrorState> {
    return this.withState((state) => structuredClone(state));
  }

  async getImage(imageId: string): Promise<ImageRecord | undefined> {
    return this.withState((state) => state.images[imageId]);
  }
}
