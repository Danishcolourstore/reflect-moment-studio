import fs from "node:fs/promises";
import {
  DEFAULT_CATEGORY,
  DEFAULT_PRESET_ID,
  DEFAULT_RETOUCH_INTENSITY,
} from "./presets.js";
import { generateImageId, nowIso } from "./utils.js";

function normalizeRecord(record) {
  const stableId =
    record.id && record.id !== "undefined" ? String(record.id) : generateImageId();
  return {
    id: stableId,
    originalFileName: record.originalFileName || "",
    originalFilePath: record.originalFilePath || "",
    sourcePath: record.sourcePath || "",
    status: record.status || "queued",
    presetId: record.presetId || DEFAULT_PRESET_ID,
    category: record.category || DEFAULT_CATEGORY,
    retouchIntensity:
      typeof record.retouchIntensity === "number"
        ? record.retouchIntensity
        : DEFAULT_RETOUCH_INTENSITY,
    previewFilePath: record.previewFilePath || null,
    processedFilePath: record.processedFilePath || null,
    previewUrl: record.previewUrl || null,
    processedUrl: record.processedUrl || null,
    analysis: record.analysis || null,
    processingMs: record.processingMs ?? null,
    error: record.error || null,
    createdAt: record.createdAt || nowIso(),
    updatedAt: record.updatedAt || nowIso(),
  };
}

export class MetadataStore {
  constructor(filePath, logger) {
    this.filePath = filePath;
    this.logger = logger;
    this.images = [];
    this.globalDefaults = {
      presetId: DEFAULT_PRESET_ID,
      category: DEFAULT_CATEGORY,
      retouchIntensity: DEFAULT_RETOUCH_INTENSITY,
    };
  }

  createImageId() {
    return generateImageId();
  }

  async load() {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      const images = Array.isArray(parsed.images) ? parsed.images : [];
      this.images = images.map(normalizeRecord);
      if (parsed.globalDefaults) {
        this.globalDefaults = {
          ...this.globalDefaults,
          ...parsed.globalDefaults,
        };
      }
    } catch (_error) {
      this.images = [];
      await this.flush();
    }
  }

  async flush() {
    await fs.writeFile(
      this.filePath,
      JSON.stringify(
        {
          images: this.images,
          globalDefaults: this.globalDefaults,
        },
        null,
        2,
      ),
    );
  }

  getImages() {
    return [...this.images].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  getById(id) {
    return this.images.find((item) => item.id === id) || null;
  }

  insert(image) {
    const created = normalizeRecord({
      id: image.id || this.createImageId(),
      ...image,
    });
    this.images.push(created);
    this.flush().catch((error) => {
      this.logger.error("Failed to persist metadata create", { error: String(error) });
    });
    return created;
  }

  updateImage(id, patch) {
    const idx = this.images.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    const next = normalizeRecord({
      ...this.images[idx],
      ...patch,
      updatedAt: nowIso(),
    });
    this.images[idx] = next;
    this.flush().catch((error) => {
      this.logger.error("Failed to persist metadata update", { error: String(error), id });
    });
    return next;
  }

  setGlobalDefaults(patch) {
    this.globalDefaults = {
      ...this.globalDefaults,
      ...patch,
    };
    this.flush().catch((error) => {
      this.logger.error("Failed to persist global defaults", { error: String(error) });
    });
    return this.globalDefaults;
  }

  getGlobalDefaults() {
    return { ...this.globalDefaults };
  }
}
