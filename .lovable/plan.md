
# MirrorAI Website Builder — Template System

## Architecture

### Core Files
1. **`src/lib/website-templates.ts`** — Template registry with all 5 template configs (colors, fonts, spacing tokens)
2. **`src/pages/WebsiteBuilder.tsx`** — Main builder page with template picker + editor + preview
3. **`src/components/website-builder/TemplatePicker.tsx`** — Template selection cards UI
4. **`src/components/website-builder/WebsitePreview.tsx`** — Live preview renderer that switches templates
5. **`src/components/website-builder/sections/`** — Shared section components that adapt to template tokens

### Template Sections (7 per template, template-aware)
Each section receives template tokens and renders accordingly:
- `HeroSection.tsx` — 4 hero variants (centered, split-left, split-right, bottom-left)
- `AboutSection.tsx` — 3 variants (two-col, full-width-image, typography-first)
- `PortfolioSection.tsx` — 4 grid variants (masonry, uniform, editorial, two-col)
- `ServicesSection.tsx` — 3 variants (list, cards, numbered)
- `TestimonialsSection.tsx` — 3 variants (single-centered, horizontal-scroll, dark-break)
- `ContactSection.tsx` — 3 variants (minimal, two-col, split-dark)
- `FooterSection.tsx` — 3 variants (centered, two-col, dark-bar)
- `NavigationBar.tsx` — 3 variants (transparent, solid, masthead)

### 5 Templates
1. **Reverie** — Soft gold, italic Cormorant, masonry portfolio, romantic
2. **Linen** — Pure monochrome, split hero, uniform grid, clean minimal
3. **Vesper** — Warm gold, bottom-left hero, editorial grid, cinematic
4. **Alabaster** — Cool monochrome, fashion editorial, two-col portfolio
5. **Heirloom** — Parchment, film grain, true masonry, vintage warmth

### Template Picker UI
- Full-width cards with preview thumbnails
- Ghost "Preview" + gold "Select" buttons
- Sticky bottom bar: "Continue with [Template]"
- Draft mode indicator

### Database (if needed)
- Store selected template + draft state in `studio_profiles` or new `website_drafts` table

## Build Order
1. Template config system (`website-templates.ts`)
2. Section components (all 8)
3. Preview renderer
4. Template picker UI
5. Main WebsiteBuilder page + routing
6. Database integration for persistence

## Design Constraints
- Only Cormorant Garamond + DM Sans
- No bold headings — regular or italic only
- Photography always hero — UI never competes
- Gold accent used sparingly
- Mobile-first responsive
