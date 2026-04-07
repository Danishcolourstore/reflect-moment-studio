

# Refine Client Gallery — Visual Noise Reduction Pass

## What This Does
A surgical polish pass on `ClientGalleryExperience.tsx` to strip visual noise, tighten spacing rhythm, and make images dominate more aggressively. No new features, no new components.

## Changes (single file: `src/pages/public/ClientGalleryExperience.tsx`)

### 1. Chapter Markers — Quieter
- Remove the bottom dot entirely (top dot is enough as a breath mark)
- Reduce chapter name font to 18px, use `#94918B` instead of `#1A1917` — chapter names should whisper, not announce
- Reduce vertical padding: 48px above the dot, 32px below the name (currently 64px/40px — too much dead space between image groups)

### 2. Grid Spacing — Tighter Rhythm
- Reduce gap in multi-image rows from 6px → 4px (tighter, more editorial, like a printed spread)
- Reduce breathing space after full-width images from 40px → 24px
- Reduce breathing space after paired/triple rows from 40px → 20px
- The effect: images pack closer together like a magazine layout, breathing room comes from chapter markers not row gaps

### 3. Hero Overlay — Lighter Touch
- Reduce gradient from `rgba(0,0,0,0.35)` → `rgba(0,0,0,0.25)` — let more of the photo through
- Remove `textShadow` from event name (the gradient does the work)
- Reduce date opacity from 0.8 → 0.6 — more recessive
- Move scroll indicator from `bottom: 32` → `bottom: 24`, reduce chevron opacity from 0.4 → 0.3

### 4. Image Viewer — More Invisible
- Reduce counter font from 12px → 11px
- Reduce heart/download icons from 24px → 20px — controls should feel delicate
- Increase icon gap from 56px → 48px (tighter, more considered)
- Reduce desktop arrow size from 32px → 28px, default opacity from 0.4 → 0.3

### 5. Favorites Drawer — Lighter
- Reduce title from 22px → 20px
- Change "Your Selections" to just "Selections" (fewer words = more premium)
- Reduce thumbnail grid gap from 4px → 3px
- Remove the heart icon from the Favorites Pill — just show the count number in Cormorant Garamond (e.g. "24 favorites") without the icon. The dot indicators on images are enough.

### 6. Footer — More Minimal
- Reduce "Thank you" from 24px → 20px
- Reduce top padding from 80px → 64px, bottom MirrorAI branding margin from 80px → 48px
- Remove studio logo/avatar circle entirely — just text credit is enough

### 7. Loading State — Cleaner
- Remove the wrapper div inside the load bar (redundant — the parent already has the background)

### 8. Favorites Dot Indicator — Smaller
- Reduce from 8px → 6px, move from `bottom: 8, right: 8` → `bottom: 6, right: 6`

### 9. Consistent Color Audit
- Chapter marker dot color stays `#E8E6E1` ✓
- Secondary text consistently `#94918B` everywhere ✓  
- Remove any remaining `#C4C1BB` usage in chapter nav inactive state → use `#D4D1CB` (slightly warmer, less cold)

### 10. Chapter Nav — Subtler
- Reduce dot size from 6px → 5px
- Reduce text from 9px → 8px
- Position from `right: 12` → `right: 8` (tighter to edge)

## Files Modified
- `src/pages/public/ClientGalleryExperience.tsx` — visual-only inline style and className adjustments

## What Stays Untouched
- All Supabase queries and data logic
- All gesture handlers and interaction logic
- All state management and routing
- Animation keyframes (already refined)
- Component structure and composition

