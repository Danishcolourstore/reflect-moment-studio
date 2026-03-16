/* ─── AI Album Layout Engine ─── 
   Generates spread sequences from analyzed photos using storytelling flow.
   Production-grade: no repetition, moment-aware pacing, quality-sorted.
*/

import type {
  PhotoAnalysis,
  WeddingMoment,
  SpreadLayout,
  SpreadLayoutType,
  GeneratedSpread,
  AIAlbumGenerationResult,
  DesignPreset,
} from "./ai-album-types";
import { MOMENT_ORDER, SPREAD_LAYOUTS } from "./ai-album-types";

/* ─── Group photos by moment ─── */
function groupByMoment(photos: PhotoAnalysis[]): Map<WeddingMoment, PhotoAnalysis[]> {
  const map = new Map<WeddingMoment, PhotoAnalysis[]>();
  for (const moment of MOMENT_ORDER) map.set(moment, []);
  for (const p of photos) {
    const arr = map.get(p.moment) || [];
    arr.push(p);
    map.set(p.moment, arr);
  }
  for (const [, arr] of map) arr.sort((a, b) => b.qualityScore - a.qualityScore);
  return map;
}

/* ─── Layout selection with anti-repetition ─── */

const LAYOUT_KEYS: SpreadLayoutType[] = Object.keys(SPREAD_LAYOUTS) as SpreadLayoutType[];

function pickLayout(
  available: number,
  spreadIndex: number,
  totalSpreads: number,
  preset: DesignPreset,
  recentLayouts: SpreadLayoutType[]
): SpreadLayout {
  const isFirst = spreadIndex === 0;
  const isLast = spreadIndex === totalSpreads - 1;

  if (isFirst || isLast) return SPREAD_LAYOUTS.full_bleed;
  if (available === 1) return SPREAD_LAYOUTS.full_bleed;
  if (available === 2) return SPREAD_LAYOUTS.two_photo;

  const weights: Record<string, number> = {};

  const add = (type: SpreadLayoutType, w: number) => {
    if (SPREAD_LAYOUTS[type].photoCount <= available) weights[type] = (weights[type] || 0) + w;
  };

  switch (preset.photoArrangement) {
    case "hero-heavy":
      add("full_bleed", 3); add("hero_left", 5); add("hero_right", 5);
      add("two_photo", 2); add("portrait_hero", 3); add("three_photo", 2);
      break;
    case "grid-heavy":
      add("four_grid", 5); add("three_photo", 4); add("two_photo", 3);
      add("cinematic_strip", 3); add("collage_5", 2);
      break;
    case "cinematic":
      add("full_bleed", 4); add("hero_left", 3); add("hero_right", 3);
      add("panoramic", 3); add("cinematic_strip", 4); add("two_photo", 2);
      break;
    case "collage":
      add("collage_5", 4); add("four_grid", 3); add("three_photo", 3);
      add("hero_left", 2); add("hero_right", 2); add("two_photo", 2);
      break;
    default:
      add("full_bleed", 2); add("two_photo", 3); add("three_photo", 3);
      add("four_grid", 2); add("hero_left", 2); add("hero_right", 2);
      add("panoramic", 1); add("cinematic_strip", 1); add("collage_5", 1);
  }

  // Penalize recently used layouts heavily
  for (const key of Object.keys(weights)) {
    const idx1 = recentLayouts.indexOf(key as SpreadLayoutType);
    if (idx1 === recentLayouts.length - 1) weights[key] *= 0.05; // just used
    else if (idx1 === recentLayouts.length - 2) weights[key] *= 0.2; // 2 ago
    else if (idx1 >= 0) weights[key] *= 0.5;
  }

  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  if (entries.length === 0) return SPREAD_LAYOUTS.full_bleed;

  const total = entries.reduce((s, [, w]) => s + w, 0);
  let rand = Math.random() * total;
  for (const [key, w] of entries) {
    rand -= w;
    if (rand <= 0) return SPREAD_LAYOUTS[key as SpreadLayoutType];
  }
  return SPREAD_LAYOUTS[entries[0][0] as SpreadLayoutType];
}

/* ─── Target spread count ─── */
function calcTargetSpreads(photoCount: number): number {
  if (photoCount <= 30) return 15;
  if (photoCount <= 50) return 20;
  if (photoCount <= 100) return 25;
  if (photoCount <= 200) return 30;
  if (photoCount <= 400) return 35;
  return 40;
}

/* ─── Main: Generate Album Layout ─── */
export function generateAlbumLayout(
  photos: PhotoAnalysis[],
  preset: DesignPreset
): AIAlbumGenerationResult {
  const startTime = performance.now();

  // Filter: remove duplicates (keep best), remove very low quality
  const filtered = photos
    .filter((p) => !p.isDuplicate || p.isBestInGroup)
    .filter((p) => p.qualityScore >= 25);

  const grouped = groupByMoment(filtered);
  const targetSpreads = calcTargetSpreads(filtered.length);

  // Allocate photos per moment proportionally
  const momentAllocations = new Map<WeddingMoment, number>();
  const total = filtered.length;

  for (const moment of MOMENT_ORDER) {
    const momentPhotos = grouped.get(moment) || [];
    if (momentPhotos.length === 0) continue;
    const proportion = momentPhotos.length / total;
    const allocated = Math.max(1, Math.round(proportion * targetSpreads * 2.8));
    momentAllocations.set(moment, Math.min(allocated, momentPhotos.length));
  }

  // Build spreads
  const spreads: GeneratedSpread[] = [];
  const recentLayouts: SpreadLayoutType[] = [];
  const usedUrls = new Set<string>();

  for (const moment of MOMENT_ORDER) {
    const available = grouped.get(moment) || [];
    const allocated = momentAllocations.get(moment) || 0;
    if (allocated === 0 || available.length === 0) continue;

    const momentPhotos = available.filter((p) => !usedUrls.has(p.url)).slice(0, allocated);
    if (momentPhotos.length === 0) continue;

    let idx = 0;
    while (idx < momentPhotos.length && spreads.length < targetSpreads) {
      const remaining = momentPhotos.length - idx;
      const layout = pickLayout(remaining, spreads.length, targetSpreads, preset, recentLayouts);
      const count = Math.min(layout.photoCount, remaining);
      const spreadPhotos = momentPhotos.slice(idx, idx + count);

      for (const p of spreadPhotos) usedUrls.add(p.url);

      spreads.push({
        spreadIndex: spreads.length,
        layout,
        photos: spreadPhotos,
        moment,
        bgColor: preset.bgColor,
      });

      recentLayouts.push(layout.type);
      if (recentLayouts.length > 4) recentLayouts.shift();
      idx += count;
    }
  }

  // Fill remaining slots with unused photos
  const unused = filtered.filter((p) => !usedUrls.has(p.url));
  let ui = 0;
  while (spreads.length < targetSpreads && ui < unused.length) {
    const remaining = unused.length - ui;
    const layout = pickLayout(remaining, spreads.length, targetSpreads, preset, recentLayouts);
    const count = Math.min(layout.photoCount, remaining);
    const spreadPhotos = unused.slice(ui, ui + count);

    spreads.push({
      spreadIndex: spreads.length,
      layout,
      photos: spreadPhotos,
      moment: "candid",
      bgColor: preset.bgColor,
    });

    recentLayouts.push(layout.type);
    if (recentLayouts.length > 4) recentLayouts.shift();
    ui += count;
  }

  return {
    spreads,
    totalPhotosUsed: usedUrls.size,
    totalPhotosSkipped: photos.length - usedUrls.size,
    generationTimeMs: performance.now() - startTime,
  };
}
