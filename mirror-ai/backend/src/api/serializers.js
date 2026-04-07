import path from "node:path";

export const toPublicImage = (image) => ({
  ...image,
  originalUrl: image.originalPath ? `/files/originals/${path.basename(image.originalPath)}` : null,
  previewUrl: image.previewPath
    ? `/files/processed/preview/${path.basename(image.previewPath)}`
    : null,
  fullUrl: image.fullPath ? `/files/processed/full/${path.basename(image.fullPath)}` : null,
});
