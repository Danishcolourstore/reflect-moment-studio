
# MirrorAI Full Redesign — Luxury Editorial System

## Phase 1: Foundation (Design Tokens + Fonts)
1. **Update `src/index.css`** — New color palette (#FAFAF8 bg, #1A1917 text, #B8953F gold, #E8E6E1 borders), remove all fonts except Cormorant Garamond + DM Sans, strip border-radius globally, remove shadows
2. **Update `tailwind.config.ts`** — Align all semantic tokens, remove unused font families, set radius to 0
3. **Update `src/styles/design-tokens.ts`** — New palette, remove old dark cinematic tokens
4. **Update `index.html`** — Clean font imports

## Phase 2: Global Components
4. **Sidebar** (`AppSidebar.tsx` or new) — 240px, #FFFFFF bg, wordmark "MirrorAI", 5 items only (Events, Galleries, Cull, Settings, Billing), STUDIO/ACCOUNT section headers, active = left gold border
5. **Mobile Bottom Nav** (`MobileBottomNav.tsx`) — 4 tabs (Events, Galleries, Cull, Account), #FFFFFF bg, 64px height, no pill indicator, just color shift
6. **Buttons** — Update `button.tsx` variants: primary (#1A1917 bg, sharp corners), secondary (border only), ghost (text only)
7. **Toasts** — Bottom-left, dark bg, no icons, 3s auto-dismiss
8. **Loading states** — Thin gold progress bar, warm skeleton colors
9. **Empty states pattern** — Cormorant heading, DM Sans subtext, single CTA

## Phase 3: Pages
10. **Dashboard/Home** (`Dashboard.tsx`) — Redesign with new palette, editorial layout
11. **Events List** — Title + count, filter tabs, vertical/2-col cards, FAB
12. **Gallery View** — Hero cover, centered name, masonry grid, hover overlay
13. **Settings** — Single column, bottom-border inputs, section headings
14. **DashboardLayout** — Wire up new sidebar + bottom nav

## Phase 4: Sweep
15. Strip contradicting styles from all remaining components (cards, dialogs, modals, forms)
