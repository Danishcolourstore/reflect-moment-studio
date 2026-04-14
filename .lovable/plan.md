
Goal

Restore Grid Builder as a real, polished mobile-first tool: reachable from the bottom nav, rendered inside the proper dashboard flow, and fully functional for layout selection, image placement, text, branding, preview, and export.

What I found

- The current `GridBuilder.tsx` + `GridEditor.tsx` are only lightweight stubs, while the repo already contains many real Grid Builder subcomponents and a full spec.
- The main blank-editor bug is in `GridEditor.tsx`: it treats `layout.cells` as the array length source, so `Array.from({ length: layout.cells })` collapses the rendered grid.
- Layout rendering is also incorrect: it uses `layout.cols` instead of `gridCols/gridRows`, ignores cell spans, and does not use the existing `GridCell` interaction component.
- The Grid tab still points to the temporary standalone `/builder-test` route, so bottom-nav behavior and dashboard/mobile integration are inconsistent.

Implementation plan

1. Fix route and navigation integration
- Move Grid Builder onto a proper protected dashboard route such as `/dashboard/grid-builder`.
- Update the mobile bottom nav to open that route.
- Keep `/builder-test` as a redirect/fallback so old links do not break.

2. Replace the stub state model with the real one
- Refactor `GridBuilder.tsx` to manage:
  - selected layout
  - `GridCellData[]`
  - canvas format
  - text layers
  - shape elements
  - logo/watermark
  - background styling
  - preview/export state
- Use `createCellsForLayout(layout)` instead of a plain `images: string[]` array.
- Preserve uploaded `File` objects for export and clean up object URLs on replace/remove/unmount.

3. Rebuild the editor using the existing Grid Builder components
- Rework `GridEditor.tsx` to render the canvas with:
  - `layout.gridCols`
  - `layout.gridRows`
  - per-cell grid areas from `layout.cells`
- Wire in the already-built components:
  - `GridCell`
  - `TextOverlay` + `TextToolbar`
  - `ElementToolbar`
  - `LogoToolbar`
  - `BackgroundStyler`
  - `SafeAreaGuides`
  - `DownloadGridButton`
  - `InstagramCarouselPreview`
  - `AICaptionGenerator`
  - `AILayoutSuggestions`

4. Improve mobile UX and bottom-safe layout
- Make the layout picker simple and fast on mobile.
- Switch to an immersive editing view after layout selection so the canvas gets maximum space.
- Ensure header/toolbars/bottom spacing respect safe areas and do not clash with the mobile nav.
- Align responsive behavior so builder layout and bottom nav do not disagree.

5. Verify regressions and finish polish
- Test the full flow:
  - Grid tab opens correctly
  - bottom nav is visible on mobile routes
  - layout picker renders
  - selecting any preset opens a working canvas
  - uploads populate cells
  - drag/pinch/zoom works
  - text/logo/elements work
  - export downloads correctly
  - back navigation returns cleanly to the studio/home flow
- Specifically verify creative/single/span layouts, not just basic square grids.

Technical details

```text
Bottom nav
  Grid tab -> /dashboard/grid-builder
                  |
                  v
         Grid Builder page
         - layout picker
         - immersive editor

Canvas
  GridLayout
    -> createCellsForLayout(layout)
    -> CSS grid uses gridCols/gridRows
    -> each cell uses layout.cells grid area
```

Files I expect to update

- `src/App.tsx`
- `src/components/MobileBottomNav.tsx`
- `src/pages/BuilderTest.tsx` or a proper route wrapper page
- `src/components/grid-builder/GridBuilder.tsx`
- `src/components/grid-builder/GridEditor.tsx`

Backend impact

- No database/auth schema changes are needed for this fix.
- I’ll reuse the existing template query and existing AI/backend functions already present in the project.
