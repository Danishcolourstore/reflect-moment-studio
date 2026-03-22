

## Theme & Navigation Overhaul — MirrorAI

This is a large overhaul touching ~12 files. The work breaks into 5 parallel streams.

---

### 1. BRANDING: Replace "Colour Store" → "MirrorAI"

**Files to edit:**
- `src/components/GlobalDrawerMenu.tsx` — line 19: `"Colour Store"` → `"MirrorAI Retouch"`
- `src/components/colour-store/ProductNav.tsx` — all `'Colour Store'` references → `'MirrorAI'`
- `src/components/colour-store/IntelligenceBar.tsx` — `"Colour Store Intelligence"` → `"MirrorAI Intelligence"`
- `src/components/colour-store/IntelligenceDot.tsx` — `"Colour Store Intelligence"` → `"MirrorAI Intelligence"`
- `src/components/colour-store/ClientPreviewPage.tsx` — `"COLOUR STORE RI"` → `"MIRRORAI RI"`
- `src/components/colour-store/RetouchSignatureCard.tsx` — `"Powered by Colour Store RI"` → `"Powered by MirrorAI RI"`
- `src/components/StorybookGate.tsx` — `"Colour Store"` → `"MirrorAI"` (2 places)
- `src/pages/LandingPage.tsx` — `"Colour Store Universe"` → `"MirrorAI"`
- `supabase/functions/colour-intelligence/index.ts` — system prompt reference update

---

### 2. HOME PAGE (LandingGate.tsx) — Clean Up

**Changes:**
- Replace top bar center text from `profileName` with Playfair→Cormorant Garamond `"MirrorAI"` at 18px
- Replace `"WORKSPACE"` button with a small grid icon (`LayoutGrid` from lucide) that navigates to `/dashboard`
- Remove the `"FEED" | "ART GALLERY"` sub-nav tabs entirely — show content directly
- Remove the `"Portfolio Sections"` dropdown/settings block (lines 232-284) — move to profile/settings
- Change `"+ New Post"` button from yellow filled (`#FFCC00`) to subtle gold text button (`#C8A97E` text, transparent bg, 1px gold border)
- Remove `"YOUR FEED"` header and `"Moments"` heading — just show feed cards directly
- Update the full-screen drawer menu to show: Portfolio, Stories, About, Contact, Sign In (bottom)

**Fonts:** Replace `playfair` and `mont` local consts with imports from `design-tokens.ts` (`fonts.display`, `fonts.body`)

---

### 3. PUBLIC FEED (/feed/:username) — White Theme + Fix NOT FOUND

**PublicFeed.tsx changes:**
- Change `BG` from `colors.black` to `#FFFFFF`
- Change text colors: headings `#1A1A1A`, secondary `#666666`, muted `#999999`
- Nav bar: white background, dark text
- Borders: `#E8E8E8` instead of dark borders
- Keep masonry grid, full-bleed images, 0 border-radius — just invert the color scheme
- Gold accent `#C8A97E` only on CTA buttons and active links

**Fix NOT FOUND bug:**
- The lookup logic at line 224 queries `studio_profiles.username`. If no `studio_profile` exists for the user, it falls through to `domains.subdomain`, then to slugified `profiles.studio_name`
- The `danishsubair` username likely has no matching row in any of these tables
- Add a migration or auto-create logic: when profile loads and no `studio_profiles` row exists, the public feed should still work by matching against the `profiles` table email prefix or user metadata
- Alternatively, ensure the signup flow creates a `studio_profiles` row with a `username` derived from the email

---

### 4. NAVIGATION — Consolidate to One System

**Mobile (< 768px):**
- Rewrite `MobileBottomNav.tsx` with 5 tabs: Home (`Home` icon), Events (`Calendar` icon), Create (`Plus` icon), Tools (`Sparkles` icon), Profile (`User` icon)
- "Create" tap → action sheet (New Event, Upload Photos, New Storybook)
- "Tools" tap → action sheet (Cheetah, Refyn, Storybook, Album Designer)
- Style: dark bg `#0A0A0B`, gold active icon `#C8A97E`, white 40% inactive, 56px + safe-area

**Desktop (≥ 768px):**
- Clean up `DashboardLayout.tsx` sidebar:
  - Width: 200px (currently wider)
  - Group into sections: STUDIO (Home, Events, Galleries), TOOLS (Storybook, Cheetah, Refyn), BUSINESS (Clients, Analytics), SETTINGS (Domains, Profile, Notifications)
  - Active: gold left border + gold text
  - Remove FAB (`FloatingActionButton`) from DashboardLayout — replaced by Create tab on mobile

**Remove:** The `FloatingActionButton.tsx` rendering from `DashboardLayout.tsx` (the pencil/edit button users see overlapping content)

---

### 5. PAGE-SPECIFIC CLEANUPS

**Cheetah (CheetahLive.tsx):**
- Search for hardcoded test session data (e.g., "dfghj") and remove it
- Add empty state: "No sessions yet. Tap + New Session to start."
- On mobile, the page uses `DashboardLayout` which shows sidebar — ensure sidebar is hidden on mobile (it already should be via the layout, but verify)

**Storybook (StorybookCreator.tsx):**
- Fix FAB z-index/positioning so it doesn't overlap cards
- Move FAB to bottom-right with 20px margin, above bottom tab bar

**BetaFeedbackButton.tsx:**
- This is the floating pencil/bug button visible in screenshots. Either:
  - Remove it from `App.tsx` where it's rendered, OR
  - Hide it on production (check if there's a condition — currently it shows for all logged-in users)

---

### Files Modified (Summary)

| File | Change |
|------|--------|
| `src/pages/LandingGate.tsx` | Remove tabs, portfolio settings, rebrand top bar |
| `src/pages/PublicFeed.tsx` | White theme, fix NOT FOUND |
| `src/components/MobileBottomNav.tsx` | Rewrite to 5-tab system with action sheets |
| `src/components/DashboardLayout.tsx` | Clean sidebar groups, remove FAB, 200px width |
| `src/components/GlobalDrawerMenu.tsx` | Rebrand, simplify for public context |
| `src/components/FloatingActionButton.tsx` | Remove or relocate |
| `src/App.tsx` | Remove BetaFeedbackButton from render |
| `src/components/colour-store/*` (4 files) | Replace "Colour Store" text |
| `src/components/StorybookGate.tsx` | Replace "Colour Store" text |
| `src/pages/LandingPage.tsx` | Replace "Colour Store Universe" |
| `src/pages/CheetahLive.tsx` | Remove test data, add empty state |

### No new features added. Only fix, clean, and unify.

