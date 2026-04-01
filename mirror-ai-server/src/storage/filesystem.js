import fs from "node:fs/promises";

export const ensureDir = async (directoryPath) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

export const fileExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

export const writeJsonFile = async (targetPath, data) => {
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(targetPath, payload, "utf8");
};
