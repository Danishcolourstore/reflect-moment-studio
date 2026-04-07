import { listCategories, listImages, persistStore } from "../storage/store.js";
import { publishEvent, realtimeEvents } from "../realtime/hub.js";

const titleCase = (value) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => `${chunk[0].toUpperCase()}${chunk.slice(1).toLowerCase()}`)
    .join(" ");

const normalizeCategoryId = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");

export const updateImageCategories = async (imageIds, categoryId) => {
  const normalizedId = normalizeCategoryId(categoryId);
  if (!normalizedId) {
    throw new Error("Invalid category id");
  }

  const categories = listCategories();
  const existingCategory = categories.find((category) => category.id === normalizedId);
  if (!existingCategory) {
    categories.push({
      id: normalizedId,
      label: titleCase(normalizedId),
    });
  }

  const selectedIdSet = new Set(imageIds);
  const images = listImages();
  for (const image of images) {
    if (selectedIdSet.has(image.id)) {
      image.categoryId = normalizedId;
      image.updatedAt = new Date().toISOString();
    }
  }

  await persistStore();
  publishEvent(realtimeEvents.categoriesUpdated, { categories });
  return normalizedId;
};
