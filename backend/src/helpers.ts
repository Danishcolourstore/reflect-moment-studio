import path from "node:path";

export const toPublicPath = (absolutePath: string): string => {
  const normalized = absolutePath.replace(/\\/g, "/");
  const marker = "/storage/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex);
  }
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

export const extFromFileName = (fileName: string): string =>
  path.extname(fileName) || ".jpg";
