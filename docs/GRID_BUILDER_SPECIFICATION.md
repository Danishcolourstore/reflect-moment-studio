# Grid Builder — Complete Feature & Design Specification

> **MirrorAI Platform** · Professional Instagram Grid & Content Design Suite  
> Last updated: April 2026

---

## 1. Overview

Grid Builder is a professional-grade visual design tool within MirrorAI that allows wedding photographers to create Instagram-ready grid compositions, carousel posts, framed singles, and editorial collages. It is a **client-side canvas editor** with AI-powered layout analysis, caption generation, and Instagram profile inspiration capabilities.

### Key Value Proposition
- Photographers can design polished Instagram content without Photoshop or Canva
- AI analyzes reference posts from Instagram and replicates grid structures + typography
- Exports at Instagram-native resolutions (1080×1080, 1080×1350, 1080×1920) as lossless PNG
- Full mobile-first touch interaction with pinch-to-zoom, drag-to-reposition, and swipe gestures

### Entry Point
- Route: Accessible from the dashboard (not a standalone page — rendered via `GridBuilder` component)
- Component: `src/components/grid-builder/GridBuilder.tsx`

---

## 2. Architecture & File Map

```
src/components/grid-builder/
├── GridBuilder.tsx              # Root orchestrator — layout selection → editor flow
├── GridEditor.tsx               # Main editor canvas with all tools (617 lines)
├── GridLayoutSelector.tsx       # Category-filtered layout picker grid
├── GridCell.tsx                 # Individual cell — image upload, drag-to-pan, pinch-zoom
├── GridInspireModal.tsx         # AI-powered "Grid Inspire" — analyze Instagram/screenshots
├── InspireCropView.tsx          # Crop step within Grid Inspire flow
│
├── types.ts                    # Core types: GridLayout, GridCellData, CanvasFormat, FrameConfig
├── text-overlay-types.ts       # TextLayer interface, font definitions, quick presets
├── element-types.ts            # DesignElement (shapes: rectangle, circle, line, divider, badge)
│
├── TextOverlay.tsx             # Draggable/rotatable text layer on canvas
├── TextToolbar.tsx             # Text editing controls (font, size, color, presets)
├── ElementOverlay.tsx          # Draggable shape element on canvas
├── ElementToolbar.tsx          # Shape editing controls
├── LogoOverlay.tsx             # Logo/watermark layer with opacity & positioning
├── LogoToolbar.tsx             # Logo upload and style controls
│
├── BackgroundStyler.tsx        # Background: solid, gradient, texture (grain) presets
├── SafeAreaGuides.tsx          # Instagram safe area overlays (feed, story, carousel)
├── FontPicker.tsx              # Full font browser with categories, search, favorites
├── font-library.ts            # 40+ Google Fonts with dynamic loading, caching, pairings
│
├── AICaptionGenerator.tsx      # AI-generated captions + hashtags via edge function
├── AILayoutSuggestions.tsx      # AI-recommended layouts based on photo count + event type
│
├── SmartFillUploader.tsx       # Batch-upload images to fill all cells at once
├── DownloadGridButton.tsx      # Export with resolution picker (7 preset sizes)
├── CarouselExporter.tsx        # Export full grid as single image
├── CarouselSliceExporter.tsx   # Export each cell as individual slide → ZIP
├── InstagramCarouselPreview.tsx # Mock Instagram feed preview
├── export-utils.ts             # Canvas-based renderer for pixel-perfect PNG export
```

### Supporting Files
```
src/hooks/use-grid-templates.ts  # Fetches grid templates from Supabase `grid_templates` table
```

### Edge Functions (AI features)
```
supabase/functions/analyze-grid-layout/   # Gemini AI: analyze image → detect grid + typography
supabase/functions/generate-caption/      # AI caption + hashtag generation
supabase/functions/suggest-layout/        # AI layout recommendation engine
supabase/functions/fetch-instagram-image/ # Instagram proxy with triple-fallback strategy
```

---

## 3. Layout System

### 3.1 GridLayout Interface

```typescript
interface GridLayout {
  id: string;
  name: string;
  category: 'basic' | 'instagram' | 'creative' | 'single';
  cols: number;
  rows: number;
  cells: [number, number, number, number][]; // [rowStart, colStart, rowEnd, colEnd]
  gridCols: number;  // CSS grid-template-columns count
  gridRows: number;  // CSS grid-template-rows count
  frame?: FrameConfig;      // For single-image layouts
  canvasRatio?: number;     // Width / height ratio, defaults to 1 (square)
}
```

### 3.2 Layout Categories & Counts

| Category   | Count | Description |
|-----------|-------|-------------|
| **Single** | 18 layouts | Single-image with frames (Polaroid, Editorial, Floating Card, etc.) |
| **Basic**  | 15 layouts | Regular NxN grids (1×1 through 5×5, plus strips) |
| **Instagram** | 14 layouts | Carousel-optimized (Carousel 1-10, Side Swipe, Panorama, Before/After) |
| **Creative** | 19 layouts | Editorial collages (Hero+N, Diptych, Triptych, Masonry, Magazine, Timeline) |

**Total: 66 layout presets** hardcoded in `types.ts`, with additional layouts fetchable from the `grid_templates` database table managed by Super Admin.

### 3.3 Frame System (Single-Image Layouts)

```typescript
interface FrameConfig {
  padding: [top, right, bottom, left]; // as % of canvas width
  imageRadius: number;                  // border-radius in px at 440px display
  background: string;                   // frame background color
  shadow: boolean;                      // drop shadow on image area
  borderWidth: number;                  // inner border px
  borderColor: string;
}
```

Frame presets include:
- **White Frame** — 6% equal padding, clean
- **Editorial Frame** — 10% padding with 1px border
- **Polaroid** — 5% top/sides, 18% bottom (classic Polaroid asymmetry)
- **Floating Card** — 8% padding, 12px radius, shadow
- **Large Margin** — 18% padding, cream background (#F3EFE9)
- **Top + Text Space** — 6% top, 28% bottom (for captions)
- **Title + Bottom** — 28% top, 6% bottom (for titles)
- **Magazine Frame** — 8% with 1px cream border

### 3.4 Canvas Formats

```typescript
const CANVAS_FORMATS = [
  { id: '1:1',  ratio: 1,    exportWidth: 1080, exportHeight: 1080 },
  { id: '4:5',  ratio: 0.8,  exportWidth: 1080, exportHeight: 1350 },
  { id: '9:16', ratio: 0.5625, exportWidth: 1080, exportHeight: 1920 },
  { id: '3:2',  ratio: 1.5,  exportWidth: 3000, exportHeight: 2000 },
  { id: '16:9', ratio: 1.778, exportWidth: 1920, exportHeight: 1080 },
];
```

---

## 4. Editor (GridEditor.tsx)

### 4.1 State Management

The editor manages these independent state slices:
- `cells: GridCellData[]` — Image data per cell (URL, file, offset, scale)
- `textLayers: TextLayer[]` — Typography overlays
- `elements: DesignElement[]` — Shape/decorative overlays
- `logo: LogoLayer | null` — Single logo/watermark
- `background: BackgroundStyle` — Canvas background (solid/gradient/grain)
- `format: CanvasFormat` — Active aspect ratio
- Selection state: `selectedTextId`, `selectedElementId`, `logoSelected`
- UI state: `activeTool`, `showSafeArea`, `showIgPreview`

### 4.2 Undo/Redo System

- **30-step history** stored in `historyRef` (not React state — avoids re-renders)
- Snapshots include ALL state: cells, text layers, elements, logo, background
- **Debounced capture**: 500ms delay after any state change to batch rapid edits
- **Keyboard shortcuts**: Ctrl+Z (undo), Ctrl+Shift+Z / Ctrl+Y (redo)
- `isUndoRedoRef` flag prevents recording undo/redo operations as new history entries

### 4.3 Tool System

Active tool determines which bottom panel is visible:

| Tool | Icon | Panel Component | Description |
|------|------|-----------------|-------------|
| `text` | Type | `TextToolbar` | Add/edit text overlays with presets, font picker, color |
| `elements` | Shapes | `ElementToolbar` | Add shapes (rectangle, circle, line, divider, badge) |
| `background` | Palette | `BackgroundStyler` | Solid, gradient, texture background presets |
| `logo` | Stamp | `LogoToolbar` | Upload and position logo/watermark |
| `caption` | MessageSquare | `AICaptionGenerator` | AI-generated captions for the post |

### 4.4 Bottom Panel UX

- **Slide-up panels** from the bottom with drag-to-dismiss
- Touch-based drag handle (pill indicator at top)
- Dismisses when dragged down >80px
- All panels render between the tool bar and canvas area
- Fixed bottom bar with `env(safe-area-inset-bottom)` for iOS notch devices

### 4.5 Header Controls

- **Back button** with layout name
- **Format selector** (1:1, 4:5, 9:16) — pill-style toggle, shows export dimensions on desktop
- **Undo/Redo** buttons with disabled states
- **Safe Area** toggle (eye icon) — shows Instagram overlay guides
- **Reset** button — clears all images, text, elements, logo, background
- **Smart Fill** uploader — batch-fill all cells from selected files

---

## 5. Grid Cell (GridCell.tsx)

### 5.1 Image Interaction Model

Each cell is an independent image container supporting:

**Desktop:**
- Click empty cell → file picker
- Drag image to reposition (pointer events)
- Mouse wheel to zoom (0.3× to 5× scale range)
- Hover to reveal controls

**Mobile:**
- Tap empty cell → file picker
- Tap image → toggle controls overlay (auto-hide after 4 seconds)
- Drag to reposition (pointer events with capture)
- **Pinch-to-zoom** — native two-finger gesture via pointer event tracking
  - Maintains distance-based scaling between two pointers
  - Transitions smoothly from pinch back to single-finger drag

### 5.2 Gesture System

The cell uses a unified pointer event system:
```
onPointerDown → track pointer(s) in Map
onPointerMove → if 2 pointers: pinch zoom + pan; if 1 pointer: drag
onPointerUp → cleanup, detect tap (movement < 5px)
```

### 5.3 Cell Controls

When visible:
- **Top-right**: Replace photo (RefreshCw icon), Remove photo (X icon)
- **Bottom center**: Zoom out, Scale % display, Zoom in, Fit/Fill toggle
- **Center**: Move indicator icon (non-interactive)

Fit modes:
- **Fill** (default): `object-fit: cover`, scale 1.0
- **Fit**: `object-fit: contain`, scale 0.65

### 5.4 GridCellData

```typescript
interface GridCellData {
  id: string;
  imageUrl: string | null;  // blob/object URL
  file: File | null;        // original file for export
  offsetX: number;          // pixel offset for pan
  offsetY: number;
  scale: number;            // zoom factor (0.3 to 5.0)
}
```

---

## 6. Typography System

### 6.1 TextLayer Interface

```typescript
interface TextLayer {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;          // px at 440px display
  letterSpacing: number;     // px
  lineHeight: number;        // multiplier
  color: string;
  opacity: number;           // 0-1
  shadow: TextShadow | null;
  alignment: 'left' | 'center' | 'right';
  x: number;                 // % of container width
  y: number;                 // % of container height
  rotation: number;          // degrees
  scale: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'lowercase';
  underline?: boolean;
  stroke?: TextStroke | null;
  bgHighlight?: string | null;
  gradientColors?: [string, string] | null;
}
```

### 6.2 Font Library

**40+ Google Fonts** organized into 4 categories:

| Category | Fonts | Notable |
|----------|-------|---------|
| Sans Serif | 11 | Inter, Poppins, Montserrat, DM Sans, Roboto, Jost |
| Serif | 8 | Playfair Display, Cormorant Garamond, Bodoni Moda, EB Garamond |
| Display | 7 | Bebas Neue, Oswald, Anton, League Spartan, Abril Fatface |
| Script | 8 | Great Vibes, Allura, Parisienne, Alex Brush, Dancing Script |

**Font Loading System:**
- Dynamic Google Fonts loading via `<link>` injection
- Font cache (`Set<string>`) prevents re-fetching
- Loading deduplication via `Map<string, Promise<void>>`
- Common fonts preloaded on editor mount: Inter, Playfair Display, Montserrat, Bebas Neue, Great Vibes, Cormorant Garamond, DM Sans, Poppins

**Font Pairings (8 curated):**
- Classic Editorial: Playfair Display + Inter
- Modern Warmth: Montserrat + Lora
- Bold Impact: Bebas Neue + Open Sans
- Luxury Minimal: Cormorant Garamond + Jost
- Romantic Modern: Great Vibes + DM Sans

**User Preferences (localStorage):**
- Recently used fonts (max 8)
- Favorite fonts

### 6.3 Quick-Apply Text Presets

| Preset | Font | Size | Style |
|--------|------|------|-------|
| Wedding Title | Cormorant Garamond 32px | Uppercase, 8px spacing | Shadow, centered |
| Location Tag | Montserrat 12px | Uppercase, 6px spacing | Shadow |
| Date | Inter 11px, weight 300 | Uppercase, 5px spacing | Subtle shadow |
| Editorial Quote | Playfair Display 18px | Italic | Shadow, centered |
| Romantic Name | Great Vibes 36px | Normal case | Shadow, centered |

### 6.4 TextOverlay Component

- **Drag-to-move**: Pointer events with position as % of container
- **Rotate handle**: Circular button that tracks angle from element center
- **Inline editing**: Double-tap or pencil icon to enter edit mode via controlled `<textarea>`
- **Delete**: Trash icon button or Delete/Backspace key when selected
- **Event isolation**: All pointer/touch events on text layers are carefully stopped from propagating to GridCell to prevent accidental image uploads

---

## 7. Design Elements (Shapes)

### 7.1 Shape Types

```typescript
type ShapeType = 'rectangle' | 'circle' | 'line' | 'divider' | 'badge';
```

| Shape | Default Size | Fill | Border |
|-------|-------------|------|--------|
| Rectangle | 80×60px | Filled white | None |
| Circle | 80×80px | Filled white | None |
| Line | 120×2px | Filled white | None |
| Divider | 120×1px, 40% opacity | Filled white | None |
| Badge | 80×60px, 20px radius | Unfilled | 1.5px white border |

### 7.2 DesignElement Properties

- Position: x, y as % of container
- Dimensions: width, height in px at 440px display
- Rotation, color, opacity (0-1)
- Border radius, border width, border color
- Filled toggle

---

## 8. Logo/Watermark System

### 8.1 LogoLayer

```typescript
interface LogoLayer {
  id: string;
  imageUrl: string;  // blob URL
  file: File;
  x: number;         // % (default: 85 — bottom-right)
  y: number;         // % (default: 90)
  width: number;     // px at 440 display (default: 60)
  opacity: number;   // default: 0.7
  rotation: number;
}
```

### 8.2 Behavior
- Only ONE logo at a time (replacing uploads the previous)
- Draggable positioning via pointer events
- Opacity and size controls in LogoToolbar
- Renders in export at correct scale relative to canvas resolution

---

## 9. Background System

### 9.1 BackgroundStyle

```typescript
interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'grain';
  color: string;
  gradientTo?: string;
  gradientAngle?: number;  // degrees
}
```

### 9.2 Preset Palette (19 presets)

**Solids (8):** White, Cream (#FAF6F0), Beige (#F5F0E8), Blush (#F8E8E0), Gold Tint (#F8F3E6), Sage (#E8EDE6), Charcoal (#2B2A28), Black (#0a0a0a)

**Gradients (6):** Warm Cream, Soft Blush, Dramatic Black, Golden Hour, Dusty Rose, Moody

**Textures (3):** Grain (beige), Dark Grain, Linen — rendered via SVG noise filter at 20% opacity

### 9.3 Background Disabled
When a layout has a `frame` config, the background controls are hidden — the frame's own background is used instead.

---

## 10. Safe Area Guides (SafeAreaGuides.tsx)

Overlays that help photographers keep important content within Instagram's visible zones:

| Guide | Description | Visual |
|-------|-------------|--------|
| Feed safe area | Center 93% × 88% | Dashed yellow border |
| Center crosshair | Vertical + horizontal center lines | White 10% opacity |
| Rule of thirds | 2 horizontal + 2 vertical lines with intersection dots | Cyan 15% opacity |
| Story safe zone | Top 14% and bottom 10% UI bars | Red overlay |
| Story text safe | Inner 86% × 76% within story safe | Dotted green border |
| 4:5 carousel safe | 4% inset + feed thumbnail crop preview | Cyan + orange borders |
| Square/general | 4% top/bottom, 2% sides | Cyan border |
| Instagram UI chrome | Camera/close icons and send bar outlines for stories | White 10% borders |

Guides adapt automatically based on `canvasRatio`:
- `< 0.65` → Story mode (9:16)
- `0.65–0.9` → Portrait mode (4:5)
- `0.9–1.1` → Square mode (1:1)

---

## 11. Export System

### 11.1 Canvas-Based Renderer (`export-utils.ts`)

The `renderGridToCanvas()` function reproduces the entire composition at export resolution using the HTML Canvas API:

**Rendering pipeline:**
1. Create canvas at target resolution (e.g., 1080×1080)
2. Fill background (solid color, gradient, or frame background)
3. Calculate image area (accounting for frame padding)
4. Render frame shadow and border if applicable
5. Calculate grid cell positions (accounting for gaps)
6. For each cell: load image → calculate cover-fit scaling → apply user offset → clip to cell bounds → draw
7. Render design elements (shapes) with rotation, opacity, fill/stroke
8. Render logo with scaling, rotation, opacity
9. Render text layers with:
   - Font loading
   - Letter spacing (character-by-character positioning)
   - Multi-line support (newline splitting)
   - Text shadow
   - Alignment (left/center/right)
   - Text transform (uppercase/lowercase)

**Scale factor**: All element positions are normalized to a 440px display reference. Export scales all dimensions proportionally: `exportWidth / 440`.

### 11.2 Export Options

**Single Image Download (DownloadGridButton.tsx):**
- Native format export (matches selected canvas format)
- 7 preset sizes: 1080×1080, 1080×1350, 1080×1440, 1080×1920, 1920×1080, 2048×2048, 4000×4000
- Progress indicator with percentage
- Lossless PNG output via `canvas.toDataURL('image/png')`

**Carousel Slice Export (CarouselSliceExporter.tsx):**
- Exports each filled cell as a separate 1080px PNG
- Packages into a ZIP file using JSZip
- Files named: `Slide_01.png`, `Slide_02.png`, etc.
- Only appears when ≥2 cells have images

**Carousel Full Export (CarouselExporter.tsx):**
- Exports the complete grid as a single image

### 11.3 Instagram Carousel Preview (InstagramCarouselPreview.tsx)
- Mock Instagram feed UI with profile avatar, username, action bar
- Swipeable carousel of filled cells
- Shows how the post will appear in the Instagram app

---

## 12. AI Features

### 12.1 Grid Inspire (GridInspireModal.tsx)

**Purpose:** Analyze any reference image (screenshot or Instagram post) and reverse-engineer its grid structure and typography.

**Three-step flow:**
1. **Entry** — Choose input method: Upload screenshot, paste Instagram link, select multiple carousel slides, or auto-generate
2. **Crop** — Crop the image to the composition area (InspireCropView)
3. **Preview** — View 4 AI-generated variations with different layout styles

**Input methods:**
- Single image upload
- Multiple image upload (batch carousel analysis)
- Instagram post URL (via `fetch-instagram-image` edge function with triple-fallback proxy)
- Auto-generate (random creative layouts, no image needed)

**Analysis pipeline:**
1. Image → base64 encoding
2. POST to `analyze-grid-layout` edge function
3. Edge function uses Gemini AI to detect:
   - Grid cell structure (row/column spans)
   - Typography blocks: text content, font group (serif/sans/script), weight, size, color, spacing, alignment, transform, shadow
4. Response mapped to `GridLayout` + `TextLayer[]`
5. 4 variations generated by shuffling cell order

**Typography mapping logic:**
- Script fonts: `Great Vibes` (>28px) or `Parisienne` (smaller)
- Serif fonts: `Playfair Display` (bold), `Bodoni Moda` (medium+large), `EB Garamond` (large), `Cormorant Garamond` (default)
- Sans fonts: `Montserrat` (uppercase+medium), `Jost` (uppercase+small), `Poppins` (semibold), `Inter` (light), `DM Sans` (default)
- Font weights snapped to nearest available weight for the chosen family

**Multi-slide carousel analysis:**
- Analyzes each slide independently
- Shows slide navigator (left/right arrows)
- Each slide gets its own layout + text layers
- Progress indicator shows current slide being analyzed

**Fallback behavior:**
- If AI analysis fails for any slide, falls back to random creative layout from the preset library

### 12.2 AI Caption Generator (AICaptionGenerator.tsx)

**Input:**
- Free-text description of the post
- Style selector (9 options): wedding photography, portrait session, engagement shoot, event coverage, landscape, street photography, product shoot, editorial fashion, family session

**Output:**
- Generated caption text
- Generated hashtag string

**Edge function:** `generate-caption` — invokes Lovable AI

**UX:**
- Copy individual (caption or hashtags) or copy all
- Embedded within the editor as a bottom panel tool

### 12.3 AI Layout Suggestions (AILayoutSuggestions.tsx)

**Input:**
- Photo count available
- Event type (8 options): wedding, portrait, engagement, event, product, editorial, family, landscape

**Output:**
- List of suggested layouts with:
  - Layout ID (maps to GRID_LAYOUTS)
  - Display name
  - Reason for recommendation
  - Optional tip

**Edge function:** `suggest-layout` — AI recommends best layouts for the content

---

## 13. Database Integration

### 13.1 Grid Templates Table (`grid_templates`)

Templates are stored in the database and managed via Super Admin:

```typescript
interface DbGridTemplate {
  id: string;
  name: string;
  category: string;          // 'basic' | 'instagram' | 'creative' | 'single'
  grid_type: string;         // unique layout key
  columns: number;
  rows: number;
  spacing: number;
  padding: number;
  border_radius: number;
  background_color: string;
  layout_config: any;        // JSON: { cells: [[r1,c1,r2,c2], ...], canvasRatio? }
  frame_style: string | null;
  is_active: boolean;
  sort_order: number;
}
```

**Hook:** `useGridTemplates()` — TanStack Query with 60s stale time, 5min GC time. Falls back to hardcoded `GRID_LAYOUTS` if DB fetch fails or returns empty.

---

## 14. Mobile-First Design

### 14.1 Device Detection

Uses `useDeviceDetect()` hook throughout. Key adaptations:

| Element | Desktop | Mobile |
|---------|---------|--------|
| Header height | 14px (sm:h-14) | 12px (h-12) |
| Category tabs | 10px text, 2.5py | 11px text, 3py, min-h-44px |
| Layout grid | 3-4 columns | 2 columns |
| Tool buttons | 4px icons, 8px labels | 5px icons, 9px labels |
| Cell controls | 7px buttons | 9px buttons |
| Zoom controls | 7px height | 9px height |
| Action pills | 36px min-height | 40px min-height |
| Bottom bar padding | 8px | `env(safe-area-inset-bottom)` |

### 14.2 Touch Targets

All interactive elements maintain minimum **44×44px** touch targets on mobile per Apple HIG guidelines.

### 14.3 Bottom Panel Interaction

- Drag handle pill at top of each tool panel
- Touch-drag down to dismiss (>80px threshold)
- Panel opacity fades as drag distance increases (>60px)
- Max height constrained to 50vh for caption panel

---

## 15. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + Y | Redo (alternative) |
| Delete / Backspace | Delete selected text, element, or logo |

*Note: Delete/Backspace is suppressed when focus is on INPUT or TEXTAREA elements.*

---

## 16. Performance Considerations

- **Blob URLs**: Created via `URL.createObjectURL()` for zero-copy image display. Properly revoked on cell clear, reset, and logo replacement to prevent memory leaks.
- **Font caching**: Loaded fonts tracked in a `Set<string>` — never re-requested.
- **History optimization**: History stored in `useRef` (not state) to avoid re-renders on every snapshot.
- **Debounced history push**: 500ms delay prevents excessive snapshots during rapid editing.
- **Canvas export**: Direct pixel manipulation via Canvas API — no DOM-to-image conversion needed.
- **Lazy loading**: GridBuilder and all sub-components loaded on demand (not in initial bundle).

---

## 17. Design Language

### Colors
- Canvas background default: `#ffffff`
- Active tool indicator: `hsl(var(--primary))`
- Muted controls: `text-muted-foreground/60`
- Safe area guides: Yellow (#FFFF00/40%), Cyan (#00FFFF/25%), Red (#FF0000/8%), Green (#00FF00/25%)
- UI chrome: `bg-background/80 backdrop-blur-xl`

### Typography
- Headers: `text-[11px] font-semibold tracking-[0.12em] uppercase`
- Labels: `text-[9px] tracking-[0.14em] uppercase text-muted-foreground/60`
- Layout names: `text-[9px] tracking-wider uppercase font-medium`
- Category tabs: `text-[10px] tracking-[0.12em] uppercase`

### Animations
- Tool panel: `animate-fade-in`
- Button press: `active:scale-95`
- Layout card hover: `hover:shadow-md hover:shadow-primary/5`
- Variation cards: `hover:scale-[1.01]`

### Shadows
- Canvas shadow: `0 12px 48px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)`
- Cell controls: `shadow-lg` (black/60 backdrop-blur)
- Preview button glow: `shadow-[0_0_10px_-2px_hsl(var(--primary)/0.35)]`

---

## 18. Smart Fill System

`SmartFillUploader.tsx` allows batch-filling all cells at once:
- User selects N files
- Files are assigned to cells in order (first file → first cell, etc.)
- Extra files are ignored; cells beyond file count are cleared
- All existing blob URLs are properly revoked before replacement

---

## 19. Instagram Preview

`InstagramCarouselPreview.tsx` provides a realistic Instagram feed mockup:
- Profile avatar circle + username
- Carousel dot indicators
- Like/Comment/Share/Save action bar
- Swipeable slides matching the canvas aspect ratio
- Shows only filled cells (empty cells excluded)

---

## 20. Error Handling & Fallbacks

| Scenario | Behavior |
|----------|----------|
| AI analysis fails | Falls back to random creative layout from preset library |
| Instagram link invalid | Toast error: "Please paste a valid Instagram post or reel link" |
| Instagram proxy fails | Toast error + suggest uploading screenshots instead |
| Font loading fails | Promise resolves (doesn't block) — falls back to system fonts |
| Grid templates DB fetch fails | Falls back to 66 hardcoded layouts |
| Export fails | Console error + toast "Export failed — try again" |
| Caption AI rate-limited | Toast: "Rate limit reached — try again in a moment" |
| Caption AI credits depleted | Toast: "AI credits needed — add funds in workspace settings" |

---

## 21. Integration Points

- **Super Admin Grid Manager** (`/super-admin/grid-manager`): CRUD for `grid_templates` table — add/edit/delete/reorder layouts
- **Admin Templates** (`/admin/templates`): Enable/disable website templates (separate from grid templates)
- **Supabase Storage**: Not used directly — all images are client-side blob URLs during editing
- **Edge Functions**: 4 AI-powered functions for analysis, captions, suggestions, and Instagram proxy

---

*This document is the complete technical specification for the Grid Builder feature. It covers architecture, data models, interaction design, AI integration, export pipeline, and mobile-first UX patterns.*
