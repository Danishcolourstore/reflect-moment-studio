import { ensureDir } from "../utils/fs.js";
import { storagePaths } from "./paths.js";

export const initStorage = async () => {
  await Promise.all([
    ensureDir(storagePaths.root),
    ensureDir(storagePaths.incoming),
    ensureDir(storagePaths.originals),
    ensureDir(storagePaths.processedPreview),
    ensureDir(storagePaths.processedFull),
    ensureDir(storagePaths.metadata),
  ]);
};
