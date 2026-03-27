export const ImageStatus = Object.freeze({
  INGESTED: "ingested",
  PROCESSING: "processing",
  DONE: "done",
  FAILED: "failed",
});

export const ShootCategories = Object.freeze([
  "wedding",
  "portrait",
  "fashion",
  "event",
  "editorial",
  "commercial",
]);

export function nowIso() {
  return new Date().toISOString();
}
