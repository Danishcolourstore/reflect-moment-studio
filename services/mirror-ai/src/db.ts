import fs from "node:fs";
import { config } from "./config.js";
import { mirrorEvents } from "./events.js";
import type {
  ImageFilter,
  ImageRecord,
  MirrorControlState,
  MirrorDatabase,
  ProcessingStatus,
} from "./types/models.js";

function defaultControl(): MirrorControlState {
  return {
    activePresetId: "editorial-luxe",
    retouchIntensity: 0.35,
    shootCategory: "wedding",
    updatedAt: new Date().toISOString(),
  };
}

function defaultDb(): MirrorDatabase {
  return {
    images: [],
    control: defaultControl(),
  };
}

function readDb(): MirrorDatabase {
  if (!fs.existsSync(config.dbPath)) {
    const fresh = defaultDb();
    fs.writeFileSync(config.dbPath, JSON.stringify(fresh, null, 2), "utf8");
    return fresh;
  }

  const raw = fs.readFileSync(config.dbPath, "utf8");
  if (!raw.trim()) {
    return defaultDb();
  }

  const parsed = JSON.parse(raw) as Partial<MirrorDatabase>;
  return {
    images: parsed.images ?? [],
    control: parsed.control ?? defaultControl(),
  };
}

function writeDb(db: MirrorDatabase): void {
  fs.writeFileSync(config.dbPath, JSON.stringify(db, null, 2), "utf8");
}

export const mirrorDb = {
  getAllImages(filter: ImageFilter = {}): ImageRecord[] {
    const db = readDb();
    let images = [...db.images].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter.status) {
      images = images.filter((image) => image.status === filter.status);
    }
    if (filter.category) {
      images = images.filter((image) => image.shootCategory === filter.category);
    }
    if (filter.limit && filter.limit > 0) {
      images = images.slice(0, filter.limit);
    }
    return images;
  },

  getImageById(id: string): ImageRecord | undefined {
    const db = readDb();
    return db.images.find((image) => image.id === id);
  },

  upsertImage(image: ImageRecord): ImageRecord {
    const db = readDb();
    const idx = db.images.findIndex((item) => item.id === image.id);
    if (idx >= 0) {
      db.images[idx] = image;
    } else {
      db.images.push(image);
    }
    writeDb(db);
    mirrorEvents.emit("image.updated", image);
    return image;
  },

  patchImage(id: string, patch: Partial<ImageRecord>): ImageRecord | undefined {
    const db = readDb();
    const idx = db.images.findIndex((item) => item.id === id);
    if (idx < 0) {
      return undefined;
    }
    const next: ImageRecord = {
      ...db.images[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    db.images[idx] = next;
    writeDb(db);
    mirrorEvents.emit("image.updated", next);
    return next;
  },

  updateImageStatus(id: string, status: ProcessingStatus, errorMessage?: string): ImageRecord | undefined {
    return this.patchImage(id, { status, errorMessage: errorMessage ?? undefined });
  },

  getControl(): MirrorControlState {
    const db = readDb();
    return db.control;
  },

  setControl(patch: Partial<MirrorControlState>): MirrorControlState {
    const db = readDb();
    db.control = {
      ...db.control,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeDb(db);
    mirrorEvents.emit("control.updated", db.control);
    return db.control;
  },
};
