

## Rebuild Refyn Editor UI — VSCO Style

This plan rebuilds the entire Refyn editor visual layer to match VSCO's minimalist philosophy: pure black, white-only UI, no panels/cards/glass, photo fills 100% of screen.

### What changes

**No changes to**: `useCanvasEngine`, `useUndoHistory`, `RetouchEngine`, `usePinchZoom` logic, any hook or engine file.

**Files to rewrite (UI only)**:

1. **`src/components/refyn/RefynEditor.tsx`** — Complete UI rewrite
   - Pure `#000` background, no `#0d0d0d`
   - Remove ALL backdrop-filter, borders, shadows, border-radius (except slider thumb)
   - Top bar: transparent bg, 44px height, safe-area-inset-top
     - Left: `ChevronLeft` icon (white 70%), with discard confirmation overlay
     - Center: empty
     - Right: `Undo2` icon (white 50%/100%), `SplitSquareHorizontal` compare (hold = instant swap via onPointerDown/Up), "Next" text link (white, 14px semibold)
   - Bottom: two-row system
     - Row 1: Full-width slider (2px white 15% track, white 60% fill, 28px white circle thumb, value centered above in 13px white)
     - Row 2: Horizontal scroll tool strip — 60px items, icon + 10px uppercase label, active = white 100% + 3px dot below, inactive = white 40%/30%
   - Tools list: RETOUCH (sub-tools), FREQ SEP, SMOOTH, D&B (sub-tools), HEAL, LIQUIFY, SHARPEN, HAIR, EYES, TEETH
   - Sub-tool pattern: when RETOUCH or D&B tapped, slider row becomes a horizontal text-only strip of sub-parameters
   - Remove layer panel button from top bar (layers are internal engine detail)
   - Zoom badge: plain white text, no glass/blur
   - All CSS: inline `<style>` block rewritten to match spec exactly

2. **`src/components/refyn/RefynToolbar.tsx`** — Rewrite to VSCO tool strip
   - Remove pill-style buttons, gold colors, rounded corners
   - Each tool: 60px wide, scroll-snap, icon at white 40% + label 10px white 30%
   - Active: white 100% icon, white 80% label, 3px white dot centered below
   - Use lucide-react icons: `Sparkles`, `Layers`, `CircleDot`, `Sun`, `Eraser`, `Move`, `Diamond`, `Scissors`, `Eye`, `Smile`

3. **`src/components/retouching/ToolPanelPrimitives.tsx`** — Remove entirely or gut
   - The VSCO approach eliminates recipe panels. Sub-tools render inline in the bottom bar, not as slide-up panels
   - Individual tool components (FrequencySeparation, SkinSmoothing, etc.) will NO LONGER render as panels — the editor manages all slider state directly

4. **`src/components/refyn/RefynExport.tsx`** — Rewrite to VSCO export screen
   - Black bg, photo preview top (0px radius), slide-left 200ms transition
   - Text-only rows: "Save to Device" / "Save for Web" / "Save with XMP" in 15px white 80%
   - Subtitles in 12px white 30%
   - 2px white progress bar at top
   - "Saved ✓" inline confirmation
   - Remove rounded cards, gold buttons, watermark toggle, SendToMirror panel

5. **New: Entiran chat bubble + panel in editor** (floating)
   - 44px gold circle at bottom-right with `MessageCircle` icon
   - Hides when tools active (opacity 0, pointer-events none)
   - Chat panel: `rgba(0,0,0,0.95)`, 16px radius, no blur
   - Quick suggestion pills with `rgba(255,255,255,0.1)` border
   - Calls `entiran-chat` edge function (or placeholder responses)
   - "Apply" button in messages maps AI suggestions to tool sliders

### Architecture approach

The editor will manage ALL tool parameter state centrally (no more per-tool-component state). Each tool maps to a simple slider config:

```text
Tool ID → { label, sliders: [{ key, label, min, max, value }] }
```

When a tool is selected, its slider(s) render in Row 1. For multi-slider tools (RETOUCH, D&B), a sub-tool strip replaces the slider, and selecting a sub-tool shows that single slider.

This eliminates the need for FrequencySeparation.tsx, SkinSmoothing.tsx, DodgeBurn.tsx, etc. as UI components. Their rendering logic is absorbed into the editor. The retouching engine hooks remain untouched.

### Files NOT touched
- `src/hooks/useCanvasEngine.ts`
- `src/hooks/useUndoHistory.ts`
- `src/hooks/useBrushTool.ts`
- `src/lib/retouch-engine.ts`
- `src/lib/retouch-history.ts`
- `src/pages/ColourStore.tsx` (parent routing)
- `src/components/refyn/refyn-types.ts`
- `src/components/refyn/refyn-filters.ts`
- `src/components/refyn/RefynUpload.tsx`
- `src/components/refyn/RefynProcessing.tsx`

### Estimated scope
- 4 files rewritten, 1 new chat component
- ~800 lines of new UI code replacing ~700 lines of current UI code
- Zero logic changes

