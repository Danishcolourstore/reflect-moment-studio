
# Refine the Client Gallery Experience

## Current State
The `ClientGalleryExperience` component at `/gallery/:slug` already implements all 5 screens (Password Gate, Hero Entry, Editorial Grid, Image Viewer, Favorites Drawer) with the correct design system (Cormorant Garamond + DM Sans, #FAFAF8/#1A1917 palette, sharp corners, editorial rhythm layout). All interactions are wired: double-tap favorites, swipe gestures, chapter nav, parallax hero, lazy loading.

## What Needs Refinement
The existing implementation is solid but has visual polish gaps compared to the spec:

### 1. Password Gate
- The shake animation uses inline `transform` instead of the `galleryShake` keyframe properly — fix so it actually oscillates left/right
- Add `galleryLoadBar` keyframe (referenced but never defined)

### 2. Hero Section  
- Hero gradient overlay is too heavy — refine to a subtler vignette
- Event name font-size should scale up to 36px on desktop for more impact
- Missing `will-change: transform` optimization note (already present ✓)

### 3. Gallery Grid
- Full-width single images use `object-fit: contain` — correct per spec, but the container needs a min-height so short images don't look awkward
- Multi-image rows lack aspect-ratio enforcement — images of different ratios cause ragged bottoms. Add `aspect-[3/2]` with `object-fit: cover` on 2-up and 3-up rows
- Image gap could be tighter (6px instead of 8px) for a more editorial magazine feel
- Desktop max-width padding should be 24px (currently 16px mobile via `px-4`, 24px desktop via `md:px-6` — correct ✓)

### 4. Image Viewer
- Missing `galleryLoadBar` keyframe definition in the styles block
- Desktop padding is `p-4 md:p-12` — should be `p-4 md:p-12 lg:p-16` for larger screens
- Swipe-down close should have a visual hint (slight downward drag before releasing)

### 5. Favorites Drawer
- Thumbnail remove button (`X`) has no border-radius specified — inherits 0 which is correct
- The backdrop dismiss should prevent scroll-through

### 6. Missing CSS Keyframe
- `galleryLoadBar` is referenced in loading state but never defined — add shimmer/slide animation

### 7. Responsive Polish
- Chapter nav dots should hide on very small screens (< 375px width)
- Favorites pill should sit higher on mobile to avoid bottom safe area overlap

## Files to Edit

**`src/pages/public/ClientGalleryExperience.tsx`** — Single file, visual-only refinements:

1. Add missing `galleryLoadBar` keyframe to the `galleryStyles` block
2. Fix password gate shake to use the keyframe animation properly (remove inline transform, rely on animation property)
3. Add `aspect-[3/2] overflow-hidden` to each image container in 2-up and 3-up grid rows so images align cleanly
4. Increase hero event name to `clamp(28px, 4vw, 40px)` for responsive scaling
5. Soften hero gradient from `rgba(0,0,0,0.5)` to `rgba(0,0,0,0.35)`
6. Add `min-height: 200px` to full-width single image containers
7. Tighten grid gap from 8px to 6px for tighter editorial feel
8. Add responsive padding bump for viewer on large screens
9. Ensure favorites pill respects `env(safe-area-inset-bottom)`

No logic changes. No routing changes. No new dependencies. Pure visual polish pass on the existing 1612-line component.
