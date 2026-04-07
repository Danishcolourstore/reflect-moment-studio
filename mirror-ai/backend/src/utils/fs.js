import fs from "node:fs/promises";
import path from "node:path";

export const ensureDir = async (directory) => {
  await fs.mkdir(directory, { recursive: true });
};

export const writeJsonAtomic = async (filePath, payload) => {
  const directory = path.dirname(filePath);
  await ensureDir(directory);

  const temporaryPath = `${filePath}.tmp`;
  const body = JSON.stringify(payload, null, 2);
  await fs.writeFile(temporaryPath, body, "utf8");
  await fs.rename(temporaryPath, filePath);
};

export const moveFileSafe = async (sourcePath, targetPath) => {
  await ensureDir(path.dirname(targetPath));
  try {
    await fs.rename(sourcePath, targetPath);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }
    await fs.copyFile(sourcePath, targetPath);
    await fs.unlink(sourcePath);
  }
};
