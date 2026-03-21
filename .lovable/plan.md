

## Plan: Replace Login Hero with New Wedding Photo

### What
Replace `public/images/login-hero.jpg` with the first uploaded photo (the rose petals kiss shot) — it's more cinematic and emotional, perfect for a full-bleed login background.

### Changes

**1. Copy uploaded image**
- Copy `user-uploads://weddingbellsphotography-20250719-0001_1.jpg` → `public/images/login-hero.jpg` (overwrite existing)

**2. No code changes needed**
- `Auth.tsx` already references `/images/login-hero.jpg` with the correct overlay, fade-in animation, and glass-morphism card. Just swapping the asset.

### Result
Login page will show the intimate rose-petals wedding moment as the cinematic hero background, with the existing dark overlay preserving readability.

