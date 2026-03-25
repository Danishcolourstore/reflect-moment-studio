import type { MetadataService } from "./metadata.js";
import type { PresetService } from "./presets.js";
import type {
  GlobalControlSettings,
  PublicImageRecord,
  ProcessingStatus,
  ShootCategory,
} from "./types.js";
import type { StoragePaths } from "./storage.js";

export interface ImageQuery {
  status?: ProcessingStatus;
  category?: ShootCategory;
  limit?: number;
}

export interface MirrorRepository {
  listImages(query?: ImageQuery): PublicImageRecord[];
  getImage(id: string): PublicImageRecord | undefined;
  listPresets(): ReturnType<PresetService["listPresets"]>;
  listCategories(): ReturnType<PresetService["listCategories"]>;
  getControls(): GlobalControlSettings;
}

export function createRepository(
  _storage: StoragePaths,
  metadata: MetadataService,
  presets: PresetService,
  publicBaseUrl: string,
): MirrorRepository {
  const toPublic = (relPath?: string) =>
    relPath ? `${publicBaseUrl}/files/${relPath.replace(/\\/g, "/")}` : undefined;

  const mapRow = (row: ReturnType<MetadataService["list"]>[number]): PublicImageRecord => ({
    ...row,
    originalUrl: `${publicBaseUrl}/files/${row.originalRelPath.replace(/\\/g, "/")}`,
    previewUrl: toPublic(row.previewRelPath),
    processedUrl: toPublic(row.processedRelPath),
  });

  return {
    listImages(query) {
      const rows = metadata.list().filter((row) => {
        if (query?.status && row.status !== query.status) {
          return false;
        }
        if (query?.category && row.category !== query.category) {
          return false;
        }
        return true;
      });
      const limited = query?.limit ? rows.slice(0, Math.max(1, query.limit)) : rows;
      return limited.map(mapRow);
    },
    getImage(id) {
      const row = metadata.get(id);
      return row ? mapRow(row) : undefined;
    },
    listPresets() {
      return presets.listPresets();
    },
    listCategories() {
      return presets.listCategories();
    },
    getControls() {
      return presets.getGlobalControls();
    },
  };
}
