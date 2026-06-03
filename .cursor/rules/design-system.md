# MirrorAI Design System

> "If Apple, A24, Linear, and Pic-Time built a private operating system for elite visual studios."

This document is the single source of truth for all UI decisions in MirrorAI.
Every component, page, and interaction must conform to these rules.

---

## 1. Design Philosophy

MirrorAI has two surfaces with distinct emotional registers:

**Client side** — emotional, immersive, cinematic, calm.
**Studio side** — fast, precise, operational, intelligent.

Both share the same token system. The difference is in density, pacing, and whitespace.

### What we are NOT
- Another beige photography SaaS
- A Pic-Time clone with different colors
- A template-driven gallery service
- A generic dashboard with gradients

### What we ARE
- A creative studio operating system
- Cinematic where it matters, surgical where it counts
- Sharper than Pic-Time, more intelligent than Pixieset
- The UI equivalent of holding a Leica

---

## 2. Typography

### Fonts
- **DM Sans** — Primary system font. All body, UI, labels, buttons, data.
- **Cormorant Garamond** — Display font. Page titles, hero text, editorial moments only.

### Scale (use Tailwind classes, never arbitrary px)

| Token   | Size  | Line Height | Weight     | Use                              |
|---------|-------|-------------|------------|----------------------------------|
| `4xl`   | 56px  | 1.0         | 300 italic | Hero headers (rare)              |
| `3xl`   | 44px  | 1.05        | 300 italic | Page titles (LandingGate, etc.)  |
| `2xl`   | 32px  | 1.1         | 300 italic | Section headers                  |
| `xl`    | 24px  | 1.15        | 400        | Card headers, subheadings        |
| `lg`    | 18px  | 1.4         | 400        | Lead text, emphasized body       |
| `md`    | 16px  | 1.5         | 400        | Large body text                  |
| `base`  | 14px  | 1.55        | 400        | Default body                     |
| `sm`    | 12px  | 1.5         | 400        | Secondary text, descriptions     |
| `xs`    | 11px  | 1.4         | 500        | Meta labels (sparingly)          |
| `2xs`   | 10px  | 1.4         | 500        | Timestamps, tertiary info        |

### Rules
- **Body weight is 400, not 300.** Light weight (300) is reserved exclusively for Cormorant Garamond display text.
- **Uppercase is rare.** Only for: section divider labels, status badges, meta timestamps. Never for body text, button labels, or navigation items.
- **Letter-spacing > 0.1em is banned** except on `2xs` section labels.
- **Cormorant Garamond is always italic, weight 300.** Never use it at body sizes. Never use it for data.
- **DM Sans buttons use sentence case, weight 500, tracking normal.** Not uppercase. Not 300 weight.

---

## 3. Color System

### Light mode (`:root`)

| Token              | Hex       | Use                                    |
|--------------------|-----------|----------------------------------------|
| `--ink`            | `#111111` | Primary text, headings, icons          |
| `--ink-secondary`  | `#2A2A28` | Strong secondary text                  |
| `--ink-muted`      | `#555555` | Secondary text (passes 4.5:1 on paper) |
| `--ink-tertiary`   | `#888888` | Tertiary text, placeholders            |
| `--paper`          | `#FAFAF8` | Page background                        |
| `--surface`        | `#F0EDE8` | Card/panel backgrounds                 |
| `--wash`           | `#F5F2ED` | Hover states, subtle fills             |
| `--rule`           | `#E4E1DC` | Borders, dividers                      |
| `--rule-strong`    | `#D4D1CC` | Active/hover borders                   |
| `--gold`           | `#B8953F` | Accent — surgical, intentional         |
| `--gold-hover`     | `#A07E32` | Gold hover state                       |
| `--gold-muted`     | `#F0E6D3` | Gold wash for badges                   |
| `--alert`          | `#A8615B` | Destructive/error                      |
| `--go`             | `#7C9A6B` | Success/positive                       |

### Dark mode (`.dark`)

| Token              | Hex       |
|--------------------|-----------|
| `--ink`            | `#FAFAF8` |
| `--ink-secondary`  | `#E6E4DD` |
| `--ink-muted`      | `#999999` |
| `--ink-tertiary`   | `#666666` |
| `--paper`          | `#0A0A0B` |
| `--surface`        | `#141414` |
| `--wash`           | `#1A1A1A` |
| `--rule`           | `#222222` |
| `--rule-strong`    | `#333333` |

### Grid Builder (noir theme — scoped to `.grid-builder`)
Uses `--grid-*` tokens. Inherits dark mode structure but is its own context.

### Rules
- **Gold is surgical.** Use for: focus rings, active tab indicators, progress bars, one accent per screen. Never as background fill on large areas. Never as brand paint.
- **`--ink-muted` must pass WCAG AA (4.5:1) against `--paper`.** The old `#6B6860` failed. Use `#555555` minimum.
- **Never hardcode hex in components.** Always reference `var(--token)` or Tailwind semantic classes.
- **`--ink-whisper` is removed.** It was illegible. Use `--ink-tertiary` at `#888888`.

---

## 4. Spacing

### Scale (Tailwind `spacing` — 4px base)

| Token | Value | Use                                      |
|-------|-------|------------------------------------------|
| `1`   | 4px   | Icon-to-text tight coupling              |
| `2`   | 8px   | Inside dense UI (pill padding, icon gap) |
| `3`   | 12px  | Tight vertical rhythm                    |
| `4`   | 16px  | Default component gap                    |
| `5`   | 20px  | Card padding (mobile)                    |
| `6`   | 24px  | Card padding (desktop), section gap      |
| `8`   | 32px  | Between distinct sections                |
| `10`  | 40px  | Page padding (desktop)                   |
| `12`  | 48px  | Major section dividers                   |
| `16`  | 64px  | Hero section margins                     |
| `20`  | 80px  | Page top margin (desktop)                |

### Rules
- **Never use inline `style={{ padding: "0 20px" }}`.** Use Tailwind: `px-5`.
- **Never use JS-computed spacing.** Use responsive Tailwind: `p-4 md:p-6 lg:p-10`.
- **Vertical rhythm uses 4/8/16/32/48 progression.** No arbitrary values.

---

## 5. Layout & Responsiveness

### Breakpoints
- `sm`: 640px (large phone landscape)
- `md`: 768px (tablet portrait)
- `lg`: 1024px (tablet landscape / small desktop)
- `xl`: 1280px (desktop)
- `2xl`: 1400px (wide desktop)

### Rules
- **Never detect mobile with JS (`window.innerWidth < 768`).** Use CSS media queries via Tailwind responsive prefixes: `hidden md:flex`, `text-3xl md:text-4xl`.
- **Sidebar width: 220px** on desktop (`lg:`). Hidden below `lg`.
- **Content max-width: 1200px** centered with `mx-auto`.
- **Mobile bottom nav height: 64px + safe-area.** Account for this in page padding.

### Three surfaces
1. **Mobile** (< md) — Full-bleed, immersive. Bottom nav. Drawer menu. Touch-first. Feels like holding a luxury instrument.
2. **Tablet** (md–lg) — Split-view potential. Filmstrip interactions. Drag curation workspace.
3. **Desktop** (lg+) — Sidebar nav. Command palette (future). Keyboard-first. Structured density.

---

## 6. Components

### Buttons
- **Primary:** `bg-[var(--ink)]` text white. Height 48px. DM Sans 13px weight 500. Sentence case. No uppercase.
- **Secondary:** Transparent, 1px `var(--ink)` border. Same typography.
- **Soft:** `bg-[var(--wash)]` text ink. Height 40px. For inline/contextual.
- **Ghost:** No chrome. Underline on hover. For tertiary actions.
- **Destructive:** 1px `var(--alert)` border, alert text.

### Cards
- Background: `var(--surface)` or white.
- Border: `1px solid var(--rule)`.
- Border radius: `rounded-lg` (12px). No box-shadow by default.
- Interactive cards: hover `var(--wash)` background, `var(--rule-strong)` border.

### Inputs
- Border-bottom only: `1px solid var(--rule)`.
- Focus: border-color `var(--gold)`.
- DM Sans 14px weight 400.
- Border radius: `rounded-md` (8px). No box-shadow.

### Status badges
- Tiny: 10px uppercase, weight 500, tracking 0.08em.
- Colors: muted semantic background + dark text.
- These are the ONLY place uppercase is acceptable in dense UI.

### Navigation
- Sidebar: DM Sans 13px weight 400. Sentence case. Active = `var(--ink)` with 1px gold left border.
- Mobile bottom nav: Icons 20px, labels 10px. Active = `var(--ink)`, inactive = `var(--ink-muted)`.
- Drawer: Cormorant Garamond 24px italic for nav items (editorial feel).

---

## 7. Motion

### Principles
- Motion communicates hierarchy, not decoration.
- Forward navigation = slide right→left (280ms).
- Back navigation = slide left→right (240ms).
- Same-depth = crossfade (160ms).
- Ease: `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-like spring).

### Specific
- **Hover:** `transition-colors duration-200` only.
- **Active press:** `active:scale-[0.98]` with `duration-75`. Only on buttons and cards.
- **Page loading:** 1px gold bar, `position: fixed`, top 0. No spinners on editorial screens.
- **Skeleton loading:** Pulse animation at 1200ms. Background `var(--wash)`.
- **No framer-motion for simple state changes.** Reserve for page transitions and complex orchestration.

---

## 8. Anti-Patterns (BANNED)

- `style={{ }}` inline objects for layout/spacing/color. Use Tailwind.
- `fontFamily: "'DM Sans', sans-serif"` in inline styles. Use `font-sans` class.
- `fontFamily: "'Cormorant Garamond', serif"` in inline styles. Use `font-serif` class.
- `onMouseEnter`/`onMouseLeave` for hover states. Use Tailwind `hover:` prefix.
- `window.innerWidth < 768` for responsive logic. Use Tailwind breakpoints.
- `letterSpacing: "0.22em"` or any tracking > 0.1em on body text.
- `fontWeight: 300` on DM Sans. Use 400 (body) or 500 (labels/buttons).
- `fontSize: 10`/`fontSize: 11` hardcoded in inline styles. Use `text-2xs`/`text-xs`.
- `.pill { border-radius: 0 !important }`. A pill is round. Remove the class or make it round.
- Duplicate color tokens (gold/cognac/grid-gold for the same value).
- `!important` in CSS except the global `border-radius: 0` reset.

---

## 9. File Organization

- `src/index.css` — Global resets, Tailwind directives, base typography, utility classes.
- `src/styles/tokens.css` — Grid Builder noir theme only.
- `tailwind.config.ts` — All design tokens, spacing, colors, fonts, shadows.
- `src/components/ui/` — shadcn primitives. Single source for all interactive components.
- Legacy CSS classes (`.btn-gold`, `.card-flat`, `.pill-*`) — **Deprecated.** Replace with shadcn components + Tailwind.

---

## 10. Implementation Priority

1. Fix `index.css`: body weight 300→400, heading weights, remove legacy classes.
2. Fix `tailwind.config.ts`: consolidate color tokens, remove duplicates.
3. Fix `tokens.css`: scope grid-builder tokens properly.
4. Migrate core layouts (DashboardLayout, LandingGate) from inline styles to Tailwind.
5. Migrate page components (Events, Auth) from inline styles to Tailwind.
6. Delete dead CSS classes after migration is complete.
