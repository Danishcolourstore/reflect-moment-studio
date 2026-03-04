# MirrorAI

> **Mirror never lies** — A premium photo gallery & studio management platform for professional photographers.

Built by **Colour Store Preset Universe**

---

## 🎯 Overview

MirrorAI is a mobile-first, dark luxury photography platform that enables professional photographers to manage events, deliver galleries, collaborate with clients, and leverage AI-powered tools — all within a cinematic, brand-forward interface.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | TanStack React Query |
| Routing | React Router v6 |
| Backend | Supabase (Lovable Cloud) — Auth, Database, Storage, Edge Functions |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Image Processing | browser-image-compression |
| ZIP Support | JSZip + FileSaver |
| Virtualization | react-window |

---

## 🎨 Design System — "Global Dark Luxury"

MirrorAI enforces a single forced-dark theme across all surfaces. No light mode exists.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary Background | `#050505` | Page backgrounds |
| Card Background | `rgba(20, 20, 20, 0.85)` | Glass-card surfaces with `backdrop-blur` |
| Card Border | `#2a2a2a` | Subtle separation, `border-radius: 14px` |
| Gold Accent | `#d4af37` | Interactive elements, highlights |
| Gold Gradient | `#d4af37 → #f6e27a` | Primary buttons, CTAs |
| Noise Texture | 1.8% opacity | Global grain overlay for tactile feel |

**Banned:** Pure white (`#FFFFFF`), pure black (`#000000`), cold tones (blues, purples, cold grays).

### Typography

| Usage | Font | Details |
|---|---|---|
| Titles & Branding | Cormorant Garamond | Serif, italic for headings |
| Body & Labels | Jost | Sans-serif, light/regular weight |
| Button Text | Jost | 11–12px, uppercase, `letter-spacing: 1.5–2px`, weight 600–700 |

### Component Standards

- **Primary Buttons:** Gold gradient (`#d4af37 → #f6e27a`) with soft glow on hover
- **Secondary Buttons:** Dark background with subtle border
- **Inputs:** `#0f0f0f` background, gold focus border (`#d4af37`)
- **Cards:** Glass-card with `backdrop-blur`, 14px radius, 1px `#2a2a2a` border
- **Modals:** Full-screen sheets on mobile (not dialog popups)
- **Floating Elements:** Positioned at `bottom-28` (112px) above bottom nav

---

## 📱 Mobile-First Layout

- **Max-width:** `480px` constraint on `#root`
- **Bottom Nav Height:** `72px`
- **Min Tap Target:** `44px`
- **Fixed Elements:** Centered via `left-1/2 -translate-x-1/2`, respecting 480px
- **Auth Pages:** Break out to `100vw × 100vh` for edge-to-edge cinematic feel

### Bottom Navigation (6 tabs)

| # | Icon | Label |
|---|---|---|
| 1 | Grid | OVERVIEW |
| 2 | Camera | EVENTS |
| 3 | Upload | UPLOAD |
| 4 | Sparkles | CULLING |
| 5 | Users | CLIENTS |
| 6 | Menu | MORE |

---

## 🔐 Authentication

### Method
Email + Password only. No social login (Google, Apple, etc.) or phone auth.

### Flow
1. **Login/Signup:** `/login` (toggle between modes)
2. **Forgot Password:** `/forgot-password` → reset email → `/reset-password`
3. **Owner Verification Gate:** `/verify-access`
   - 6-digit OTP sent to owner email (`danishsubair@gmail.com`)
   - 3 attempts max, 60-second lockout
   - Contact buttons: Call & WhatsApp (`+91 96057 61589`)
   - Master override PIN: `141120`
   - Persisted in `sessionStorage`
4. **Admin/Super Admin:** Bypass OTP gate, redirect to `/admin`

---

## 👥 Role-Based Access Control

4-tier RBAC system stored in the `user_roles` table (never on profiles).

| Role | Route | Access Level |
|---|---|---|
| `super_admin` | `/admin` | Full system control, immutable, locked to owner email |
| `admin` | `/admin` | Monitor events, manage photographers |
| `photographer` | `/dashboard` | Manage own events, photos, clients, galleries |
| `client` | `/client` | View assigned events, favorites, downloads |
| Guest | `/event/:slug` | Public gallery viewing (unauthenticated) |

### Security
- `super_admin` role permanently locked to `danishsubair@gmail.com` via DB triggers
- `has_role()` security definer function for all RLS policy checks
- Admin PIN gate with server-side SHA-256 hash verification
- Force logout capability via Edge Function + `force_logout_requested` flag
- All admin actions logged in `admin_activity_log` audit table

---

## ✅ Features

### 📸 Photographer Dashboard (`/dashboard`)

- Event creation, editing, duplication, archiving
- Photo upload with compression & progress tracking
- ZIP upload support
- Gallery management (masonry/grid/editorial layouts)
- Gallery chapters with drag-sort ordering
- Watermark system (text, position, opacity)
- Download controls (resolution, password protection)
- LiveSync real-time upload notifications
- Selection mode for guest album picks
- Guest favorites tracking
- Photo comments viewer
- Event analytics (views, downloads, favorites)
- Client management & invitation system
- Sneak peek photo selection
- QR code generation for event access
- Face recognition integration (Face++ API)
- Guest selfie matching
- Notification bell with real-time updates
- Studio branding (name, logo, accent color via `--studio-accent`)
- Website templates (Editorial Studio, Timeless Wedding, Modern Portfolio)
- AI culling (automated best/maybe/reject rating)
- Storage usage tracking
- Beta feedback with screenshot capture
- Profile & billing management

### 🌐 Public Gallery (`/event/:slug`)

- Password-protected galleries (PIN gate)
- Multiple gallery styles (Vogue Editorial, etc.)
- Guest session tracking
- Photo favorites (heart toggle)
- Photo slideshow & lightbox viewer
- Photo sharing sheet
- Photo comments
- Album selection mode
- Face recognition guest finder
- Progressive image loading with blur-up
- Embeddable gallery widget

### 👤 Client Portal (`/client`)

- Client dashboard with assigned events
- Event gallery viewing
- Favorites management
- Photo download tracking
- Client profile management

### ⚙️ Admin Panel (`/admin`)

- User management with role badges (gold=super_admin, blue=admin, grey=photographer)
- Role assignment (super_admin protected)
- Event monitoring across platform
- Photographer management
- Storage monitoring (platform-wide)
- Revenue tracking dashboard
- Activity audit log
- Bulk email system
- PIN reset system
- Force logout capability
- Admin settings & configuration
- Mobile responsive (collapsible sidebar, 2-col stat grids)

---

## 🗄 Database Schema

### Core Tables
`profiles`, `user_roles`, `events`, `photos`, `favorites`, `guest_sessions`, `event_views`, `event_analytics`, `photo_comments`, `photo_interactions`

### Gallery & Organization
`gallery_chapters`, `chapter_photos`, `album_selections`, `sneak_peeks`

### Client System
`clients`, `client_events`, `client_favorites`, `client_downloads`

### Guest Features
`guest_selections`, `guest_selection_photos`, `guest_registrations`, `guest_selfies`

### AI & Face Recognition
`photo_faces`, `face_indexing_jobs`, `culling_sessions`, `culled_photos`

### Admin & Platform
`admin_activity_log`, `admin_pin_attempts`, `platform_settings`, `notifications`, `bulk_emails`, `event_qr_access`

### Branding & Content
`studio_profiles`, `blog_posts`, `referrals`, `beta_feedback`

---

## ⚡ Edge Functions

| Function | Purpose |
|---|---|
| `admin-force-logout` | Terminate user sessions (service role) |
| `admin-pin-reset` | PIN reset with email token |
| `ai-culling` | AI-powered photo rating |
| `invite-client` | Client invitation with email |
| `process-guest-selfie` | Face matching for guest photos |
| `send-access-pin` | OTP delivery to owner |
| `send-comment-notification` | Notify on new comments |
| `send-favorites-notification` | Notify on guest favorites |
| `send-gallery-view-notification` | Notify on gallery views |
| `send-selection-notification` | Notify on album selections |
| `send-welcome-email` | Welcome email on signup |

---

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── events/          # Event-specific components
│   └── website/         # Public website templates
├── hooks/               # Custom React hooks
├── integrations/        # Supabase client & types (auto-generated)
├── lib/                 # Auth context, utilities, gallery styles
├── pages/               # Route pages
│   ├── admin/           # Admin panel pages
│   └── client/          # Client portal pages
├── services/            # Face recognition services
└── test/                # Test setup

supabase/
└── functions/           # Edge functions (auto-deployed)

public/
├── images/              # Static assets
├── icons/               # PWA icons
├── manifest.json        # PWA manifest
└── sw.js                # Service worker
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Lovable Cloud project (Supabase backend auto-provisioned)

### Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

---

## 📋 Environment Variables

Managed automatically by Lovable Cloud:
- `VITE_SUPABASE_URL` — Backend API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Public anon key
- `VITE_SUPABASE_PROJECT_ID` — Project identifier

---

## 📄 License

Private — Colour Store Preset Universe. All rights reserved.
