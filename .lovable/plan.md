

## Plan: Use Wedding Photo as Login Hero Background

### What
Replace the current dark radial gradient on the Auth page with the uploaded Indian wedding photo as a full-bleed background, restoring the cinematic hero image aesthetic while keeping the glass-morphism login card and all existing auth logic.

### Changes

**1. Copy the uploaded image to the project**
- Copy `user-uploads://01_8_1.jpg` → `public/images/login-hero.jpg`

**2. Update `src/pages/Auth.tsx`**
- Replace the radial gradient `div` (lines 84-93) with an `<img>` tag loading `/images/login-hero.jpg` with `object-fit: cover`, full absolute positioning
- Add a dark overlay on top: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7))`
- Keep the same phase-based fade-in animation (opacity 0→1 over 2s)
- All login card, logo, tagline, inputs, auth logic remain untouched

### Result
The login page will show the wedding ceremony photo as a cinematic full-bleed background with a dark overlay ensuring text readability, matching the original design spec.

