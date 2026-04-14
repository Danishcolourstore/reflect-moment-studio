
# Mobile-Compatible Website Builder

## What This Does
Make the entire Website Builder flow (Template Picker → Preview → Editor) work beautifully on mobile devices with touch-friendly controls, proper safe areas, and responsive layouts.

## Changes

### 1. Template Picker — Mobile Layout (`src/components/website-builder/TemplatePicker.tsx`)
- Template cards: stack vertically on mobile, reduce preview strip height to 160px on small screens
- Buttons: ensure 44px min touch targets
- Sticky bottom bar: add safe-area-inset-bottom padding
- Header: reduce font sizes for small screens

### 2. Website Builder — Mobile Toolbar (`src/pages/WebsiteBuilder.tsx`)
- Preview toolbar: make responsive — stack buttons on small screens, reduce padding
- Editor toolbar: collapse "Change Template" text to icon-only on mobile
- Draft bar: adjust for mobile viewport
- Add hamburger/mobile menu for nav links
- Ensure fullscreen views respect safe-area insets (top + bottom)

### 3. Website Preview — Mobile Sections (`src/components/website-builder/WebsitePreview.tsx` + section files)
- Already responsive ✓ — sections use `flex-col sm:flex-row` patterns
- Minor: ensure navigation links have mobile menu (hamburger)
- NavigationBar: add mobile hamburger menu toggle

### 4. Section Editor — Already Mobile-Ready
- `WebsiteSectionEditor.tsx` already handles portrait/landscape orientation with bottom panel vs sidebar
- Already has safe-area insets ✓
- No changes needed here

## Files Modified
- `src/components/website-builder/TemplatePicker.tsx` — mobile touch targets, safe-area bottom bar
- `src/pages/WebsiteBuilder.tsx` — responsive toolbars, mobile-friendly editor chrome
- `src/components/website-builder/sections/NavigationBar.tsx` — mobile hamburger menu

## What Stays Untouched
- Template system, colors, fonts — no changes
- Section content components (About, Portfolio, etc.) — already responsive
- Website Section Editor — already mobile-optimized
- All data/logic — visual only
