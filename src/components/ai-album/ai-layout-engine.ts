/* ─── AI Album Layout Engine ─── 
   Generates spread sequences from analyzed photos using storytelling flow.
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
  for (const moment of MOMENT_ORDER) {
    map.set(moment, []);
  }
  for (const p of photos) {
    const arr = map.get(p.moment) || [];
    arr.push(p);
    map.set(p.moment, arr);
  }
  // Sort each group by quality
  for (const [, arr] of map) {
    arr.sort((a, b) => b.qualityScore - a.qualityScore);
  }
  return map;
}

/* ─── Pick layout based on available photos and position ─── */
function pickLayout(
  available: number,
  spreadIndex: number,
  totalSpreads: number,
  preset: DesignPreset,
  prevLayout?: SpreadLayoutType
): SpreadLayout {
  const isFirst = spreadIndex === 0;
  const isLast = spreadIndex === totalSpreads - 1;

  // Opening and closing are full bleed
  if (isFirst || isLast) return SPREAD_LAYOUTS.full_bleed;
  if (available === 1) return SPREAD_LAYOUTS.full_bleed;
  if (available === 2) return SPREAD_LAYOUTS.two_photo;

  // Build weighted options based on preset
  const options: { layout: SpreadLayoutType; weight: number }[] = [];

  const addOption = (type: SpreadLayoutType, weight: number) => {
    if (SPREAD_LAYOUTS[type].photoCount <= available) {
      // Reduce weight if same as previous to avoid repetition
      const adjustedWeight = type === prevLayout ? weight * 0.2 : weight;
      options.push({ layout: type, weight: adjustedWeight });
    }
  };

  switch (preset.photoArrangement) {
    case "hero-heavy":
      addOption("full_bleed", 3);
      addOption("hero_left", 5);
      addOption("hero_right", 5);
      addOption("two_photo", 2);
      addOption("portrait_hero", 3);
      addOption("three_photo", 2);
      break;
    case "grid-heavy":
      addOption("four_grid", 5);
      addOption("three_photo", 4);
      addOption("two_photo", 3);
      addOption("cinematic_strip", 3);
      addOption("collage_5", 2);
      break;
    case "cinematic":
      addOption("full_bleed", 4);
      addOption("hero_left", 3);
      addOption("hero_right", 3);
      addOption("panoramic", 3);
      addOption("cinematic_strip", 4);
      addOption("two_photo", 2);
      break;
    case "collage":
      addOption("collage_5", 4);
      addOption("four_grid", 3);
      addOption("three_photo", 3);
      addOption("hero_left", 2);
      addOption("hero_right", 2);
      addOption("two_photo", 2);
      break;
    default: // balanced
      addOption("full_bleed", 2);
      addOption("two_photo", 3);
      addOption("three_photo", 3);
      addOption("four_grid", 2);
      addOption("hero_left", 2);
      addOption("hero_right", 2);
      addOption("panoramic", 1);
      addOption("cinematic_strip", 1);
      break;
  }

  if (options.length === 0) return SPREAD_LAYOUTS.full_bleed;

  // Weighted random selection
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const opt of options) {
    rand -= opt.weight;
    if (rand <= 0) return SPREAD_LAYOUTS[opt.layout];
  }
  return SPREAD_LAYOUTS[options[0].layout];
}

/* ─── Calculate target spread count ─── */
function calcTargetSpreads(photoCount: number): number {
  if (photoCount <= 50) return 20;
  if (photoCount <= 150) return 25;
  if (photoCount <= 300) return 30;
  if (photoCount <= 500) return 35;
  return 40;
}

/* ─── Main: Generate Album Layout ─── */
export function generateAlbumLayout(
  photos: PhotoAnalysis[],
  preset: DesignPreset
): AIAlbumGenerationResult {
  const startTime = performance.now();

  // Filter: remove duplicates (keep best in group), remove low quality
  const filtered = photos.filter(
    (p) => !p.isDuplicate || p.isBestInGroup
  ).filter(
    (p) => p.qualityScore >= 30 // remove very low quality
  );

  const grouped = groupByMoment(filtered);
  const targetSpreads = calcTargetSpreads(filtered.length);

  // Allocate photos per moment proportionally
  const momentAllocations = new Map<WeddingMoment, number>();
  const totalFilteredPhotos = filtered.length;
  
  for (const moment of MOMENT_ORDER) {
    const momentPhotos = grouped.get(moment) || [];
    if (momentPhotos.length === 0) continue;
    
    // Proportional allocation with minimum of 1 spread worth
    const proportion = momentPhotos.length / totalFilteredPhotos;
    const allocated = Math.max(
      1,
      Math.round(proportion * targetSpreads * 2.5) // ~2.5 photos per spread avg
    );
    momentAllocations.set(moment, Math.min(allocated, momentPhotos.length));
  }

  // Build spreads
  const spreads: GeneratedSpread[] = [];
  let prevLayoutType: SpreadLayoutType | undefined;
  const usedPhotoUrls = new Set<string>();

  for (const moment of MOMENT_ORDER) {
    const available = grouped.get(moment) || [];
    const allocated = momentAllocations.get(moment) || 0;
    if (allocated === 0 || available.length === 0) continue;

    const momentPhotos = available
      .filter((p) => !usedPhotoUrls.has(p.url))
      .slice(0, allocated);

    if (momentPhotos.length === 0) continue;

    let photoIdx = 0;
    while (photoIdx < momentPhotos.length && spreads.length < targetSpreads) {
      const remaining = momentPhotos.length - photoIdx;
      const layout = pickLayout(
        remaining,
        spreads.length,
        targetSpreads,
        preset,
        prevLayoutType
      );

      const count = Math.min(layout.photoCount, remaining);
      const spreadPhotos = momentPhotos.slice(photoIdx, photoIdx + count);

      for (const p of spreadPhotos) {
        usedPhotoUrls.add(p.url);
      }

      spreads.push({
        spreadIndex: spreads.length,
        layout,
        photos: spreadPhotos,
        moment,
        bgColor: preset.bgColor,
      });

      prevLayoutType = layout.type;
      photoIdx += count;
    }
  }

  // If we have fewer spreads than target and unused photos, fill more
  const unusedPhotos = filtered.filter((p) => !usedPhotoUrls.has(p.url));
  let unusedIdx = 0;
  while (spreads.length < targetSpreads && unusedIdx < unusedPhotos.length) {
    const remaining = unusedPhotos.length - unusedIdx;
    const layout = pickLayout(remaining, spreads.length, targetSpreads, preset, prevLayoutType);
    const count = Math.min(layout.photoCount, remaining);
    const spreadPhotos = unusedPhotos.slice(unusedIdx, unusedIdx + count);

    spreads.push({
      spreadIndex: spreads.length,
      layout,
      photos: spreadPhotos,
      moment: "candid",
      bgColor: preset.bgColor,
    });

    prevLayoutType = layout.type;
    unusedIdx += count;
  }

  return {
    spreads,
    totalPhotosUsed: usedPhotoUrls.size,
    totalPhotosSkipped: photos.length - usedPhotoUrls.size,
    generationTimeMs: performance.now() - startTime,
  };
}
