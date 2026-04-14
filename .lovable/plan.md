

## Separate Home (Analytics) from Gallery (Feed)

**Current state:** The bottom nav has Events, Gallery (→ /home which is the photo feed), Grid, Album. There's no dedicated analytics/stats home screen on mobile.

**What you want:**
- **Home** = Studio analytics dashboard (stats, quick actions, business insights)
- **Gallery** = Photo feed of the studio (current LandingGate content)

### Changes

1. **Update MobileBottomNav** — Add a "Home" tab (House icon) pointing to `/dashboard` and rename current "Gallery" to keep pointing to `/home` (the feed). New tab order: Home, Events, Gallery, Grid, Album (5 tabs).

2. **Restore `/dashboard` route** — Instead of redirecting `/dashboard` → `/home`, render a proper analytics home page using `Dashboard.tsx` with the `HomeDashboardHub` component (stats cards, quick actions, business overview).

3. **Update Dashboard.tsx for mobile** — Replace the current photo-grid mobile view with a proper analytics layout: greeting, stat cards (events, photos, leads), quick action buttons (New Event, Upload, Cull), and recent events list — matching the editorial luxury aesthetic.

4. **Keep `/home` as Gallery feed** — `LandingGate.tsx` stays unchanged as the studio's photo feed/portfolio view.

### Files to update
- `src/components/MobileBottomNav.tsx` — add Home tab, reorder
- `src/App.tsx` — restore `/dashboard` to render Dashboard component
- `src/pages/Dashboard.tsx` — rebuild mobile view as analytics hub

