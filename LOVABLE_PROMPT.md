# Mirror.AI — Ultimate Lovable Enhancement Prompt
## "Sharper than Pic-Time. More intelligent than Pixieset. The operating system for elite studios."

---

## CONTEXT & VISION

Mirror.AI is a full-stack creative studio operating system for wedding and event photographers. It already has 83 pages, 80+ database tables, live event streaming (Cheetah), face recognition, AI album builder, Instagram planning, storybooks, a website builder, and a full CRM/business suite.

The goal is to make every surface **world-class** — beating Pic-Time and Pixieset on gallery experience, beating HoneyBook on business tools, and introducing AI-native features no competitor has. Do not redesign the whole app. Elevate what exists and add the missing layers.

**Design system is locked.** Every change must follow:
- Fonts: DM Sans (body/UI) + Cormorant Garamond italic 300 (display only)
- Colors: `--ink` #111111, `--paper` #FAFAF8, `--surface` #F0EDE8, `--gold` #B8953F, `--rule` #E4E1DC
- No inline styles. Tailwind only. No hardcoded hex values.
- Buttons: sentence case, weight 500, height 48px primary / 40px secondary
- No spinners on editorial screens — use 1px gold top progress bar instead

---

## PHASE 1: CLIENT GALLERY — CINEMATIC REINVENTION

The client gallery is the product that clients see. It must feel like opening a luxury box, not logging into a portal.

### 1A. Gallery Landing Experience
When a client opens their gallery link:
- Full-screen **cover moment** — hero photo fills 100vh with a parallax scroll effect
- Studio name in Cormorant Garamond 44px italic, centered, over a dark overlay
- Client's name and event date as secondary text (DM Sans 14px, white/70%)
- A single gold "Enter gallery →" CTA button — 48px height, pill shape, backdrop blur
- If the gallery has a custom message from the photographer, it appears as an animated fade-in card before the grid
- Password gate: if protected, show it as a minimal modal over the cover photo — not a separate page

### 1B. Gallery Grid — Three World-Class Layouts

**Layout 1: Masonry Flow (default)**
- Organic masonry grid, 2–4 columns based on viewport
- Photos load in with a subtle fade-up (not a pop — a breath)
- Hover: slight scale 1.02, gold border appears, photo count badge appears top-right
- No visible borders between photos — pure imagery first

**Layout 2: Editorial Magazine**
- Alternating large hero photos (2/3 width) with portrait clusters
- Section breaks with chapter titles in Cormorant Garamond italic
- Feels like a Vogue editorial spread
- Each chapter has a thin gold divider line

**Layout 3: Filmstrip Immersion**
- Full-width single photo at top, horizontal scroll filmstrip below
- Keyboard arrow navigation
- Best for elopements, intimate sessions

### 1C. Lightbox — Cinema Mode
When a photo is clicked:
- Black background fills screen (not dark grey — pure `#0A0A0B`)
- Photo centered, max 90vh height, with subtle vignette
- Left/right navigation: swipe on mobile, arrow keys on desktop
- Bottom bar: photo number (e.g., "47 / 312"), like button (heart), download button, share button
- On hover: top bar fades in with event name + date (Cormorant Garamond italic white)
- EXIF data accessible via an "info" icon (shows camera, lens, aperture, ISO, shutter speed)
- **Smart zoom**: double-tap on mobile / scroll wheel on desktop — pixel-level zoom with pan
- If face recognition found this person's photos: subtle "More of you →" link at bottom

### 1D. Favorites & Selection Flow
- Heart button on every photo — animated heart fill on click (gold, not red)
- Favorites page: "Your favorites" header in Cormorant Garamond, curated grid of selected photos
- Photographer can set a **selection target** (e.g., "Choose your top 80 photos for the album")
- Selection counter: sticky bottom bar showing "48 / 80 selected" with a gold progress bar
- When target is reached: confetti-lite animation + "Send to photographer" CTA
- Client can add a note per photo ("Love the light here", "Could we have this in black and white?")
- Submit selections: generates a PDF summary + notifies photographer instantly

### 1E. Gallery Chapters & Organization
- Chapters appear as full-width dividers with title + optional subtitle
- Chapter navigation: sticky sidebar (desktop) / swipeable top pills (mobile)
- "All photos" filter always visible
- Smart albums automatically created: "Getting Ready", "Ceremony", "Reception", "Details", "Portraits" — photographer can rename/reorder

### 1F. Download Experience
- Download options as a clean modal: Full resolution / Web resolution / Mobile-optimized
- If downloading multiple: shows a progress bar with "Preparing your download..." 
- Zip file named: `[EventName]_[ClientName]_MirrorAI.zip`
- After download completes: "Share your memories" prompt — direct links to share on Instagram, save to Google Photos, or set as phone wallpaper

### 1G. Client Welcome Flow (First Time)
- First gallery visit: animated welcome card with photographer's logo/name
- Short 3-step onboarding: "Here's how to navigate", "Save your favorites", "Download your photos"
- Skip available — remembers in localStorage
- Photographer can customize the welcome message from their dashboard

---

## PHASE 2: PRINT & PRODUCT STORE (The Revenue Engine)

Neither Pictime nor Pixieset can be beaten without a world-class print store. This is the biggest missing revenue layer.

### 2A. Gallery Store Tab
- Every gallery gets a "Shop prints" tab — hidden until photographer activates it
- Store homepage shows 3–4 featured product categories with editorial photography
- Products: Fine Art Prints, Canvas Wraps, Metal Prints, Photo Books, Greeting Cards, USB Drive, Digital Downloads (individual photos)
- Price tiers set by photographer per event

### 2B. Product Configurator
When client clicks a photo + "Order print":
- Side panel slides in (not a new page)
- Product type selector: icons for Print / Canvas / Metal / Book
- Size selector: visual size comparison (A4, A3, A2, 30x40cm, 50x70cm, etc.)
- Paper finish: Lustre / Matte / Glossy — thumbnail previews
- Live mockup: photo shown in a room scene (frame on wall) — updates in real-time
- Quantity selector
- "Add to cart" button — gold, 48px
- Cart icon in gallery header shows count badge

### 2C. Cart & Checkout
- Cart drawer slides from right — shows all items with thumbnails
- Order summary with photographer's markup visible
- Client enters shipping address
- Payment: Stripe embedded checkout (card + Apple Pay + Google Pay)
- After order: confirmation email with order number + tracking info

### 2D. Photographer Store Settings (Dashboard)
- Enable/disable store per event
- Set markup per product category (e.g., "30% markup on fine art prints")
- Set minimum order for free shipping
- Add featured products to gallery cover
- View orders: status, tracking, revenue — in a clean table
- Revenue chart by month with Recharts — gold accent line

### 2E. Automated Upsell Emails
- Day 7 after gallery delivery: "Your photos are waiting — order prints before they're archived"
- Day 30: "Last chance — gallery closes in 7 days"
- AI-generated personalized message using client's name + event type
- Photographer can customize templates in Business Suite

---

## PHASE 3: PHOTOGRAPHER DASHBOARD 2.0

The studio dashboard should feel like Linear — fast, keyboard-navigable, information-dense but never cluttered.

### 3A. Command Center (Home Dashboard)
Replace the current home dashboard with a command center:
- **Top row:** 4 KPI cards — Revenue this month / Active galleries / Pending deliveries / Unread messages
- Each KPI shows trend arrow + % change vs last month
- **Middle section:** "What needs attention today" — AI-generated list of 3–5 actionable items
  - Examples: "Gallery for Sarah & Tom has been open 14 days — send reminder email"
  - "3 clients have made selections — review and approve"
  - "Instagram post scheduled for tomorrow — preview it"
- **Right column:** Calendar view of upcoming shoots (next 30 days)
- **Bottom:** Recent gallery activity — who viewed, who favorited, who downloaded (real-time feed)

### 3B. Event Management — Redesigned
Current events page needs a major UX upgrade:

**List view improvements:**
- Each event card shows: cover photo thumbnail (leftmost), event name, date, client name, status badge, photo count, delivery status, last activity
- Status badges: Draft / Processing / Delivered / Archived — color-coded
- Bulk actions toolbar appears on checkbox selection
- One-click filter pills: All / This Month / Undelivered / Awaiting Selection

**Event detail page:**
- Split view: left = photo grid (main), right = event info panel (collapsible)
- Info panel sections: Client details, Event timeline, Gallery settings, Analytics, Orders
- Inline editing of event name/date/client — no modal needed
- Quick actions floating bar: Share gallery link / Send sneak peek / Invite client / Generate album

### 3C. Analytics — Meaningful Intelligence
Replace basic analytics with a genuinely useful intelligence layer:

**Gallery performance score** (0–100 composite):
- Factors: open rate, time spent, favorites ratio, download rate, share rate
- Score card at top of each event's analytics tab

**Engagement timeline:**
- Hour-by-hour view of gallery activity for first 7 days post-delivery
- Peak engagement time shown ("Most active: Tuesday 7–9pm")

**Client journey map:**
- Visual flow: Gallery opened → Viewed X photos → Added Y favorites → Downloaded → Shared
- Drop-off points highlighted

**Revenue analytics:**
- Total revenue per event (prints + digital)
- Average order value trend
- Best-selling products

### 3D. Unified Inbox
- All client messages, selection submissions, form inquiries, and booking requests in one feed
- Left: conversation list (like iMessage) — shows name, last message, timestamp, unread badge
- Right: conversation thread
- AI draft reply button: generates a thoughtful response in the photographer's voice
- Templates: save and reuse common replies
- Mark as done / Follow up tags

### 3E. Quick Actions Panel
Floating bottom-right button (FAB) on all dashboard pages:
- Click to expand: "New event", "Upload photos", "Invite client", "Send sneak peek", "Create storybook"
- Keyboard shortcut: `Cmd/Ctrl + K` opens command palette for power users

---

## PHASE 4: AI INTELLIGENCE LAYER

These features have no equivalent in Pictime or Pixieset — they're Mirror.AI's moat.

### 4A. Smart Culling Assistant
On the event photo upload page, after processing completes:
- AI analyzes all photos and suggests a "best of" selection
- Criteria: sharpness, exposure, composition, emotional moment, face detection
- Shows side-by-side comparison: "Your 312 photos → AI suggests 180 as your best"
- Photographer can accept/reject individual AI picks
- One-click "Apply AI cull" to mark suggested photos as featured

### 4B. Gallery Narrative Generator
In event detail → Gallery settings:
- "Generate gallery story" button
- AI writes a 2–3 paragraph narrative of the wedding/event using: event date, location, people names, photo metadata
- Narrative appears as an elegant intro block in the client gallery
- Photographer can edit before publishing
- Written in a poetic, cinematic tone (matches Cormorant Garamond display style)

### 4C. Auto-Album First Draft
After an event is delivered:
- "AI Album Draft" button in event detail
- AI creates a 30–40 page album layout using best photos, proper chapter ordering, and spread variety
- Photographer reviews in the Album Designer — AI picks are highlighted in gold
- Saves 3–4 hours of album-building time

### 4D. Client Communication AI (Entiran Enhancement)
In the Unified Inbox:
- After reading a client message, AI suggests: "This client is asking about album timeline — here's a draft reply"
- Tone matching: analyzes the photographer's previous replies and matches writing style
- Smart templates: "Thank you for your selection", "Your gallery is ready", "Album proof attached"
- Bulk email composer: select multiple clients → AI generates personalized versions of a template

### 4E. Sneak Peek Intelligence
When creating a sneak peek:
- AI selects the 10 best photos from the event (using the culling algorithm)
- Suggests an ordering: Start strong, emotional middle, iconic close
- Photographer can swap any photo
- One-click publish to sneak peek + social share link

---

## PHASE 5: MOBILE — FIRST CLASS CITIZEN

### 5A. Photographer Mobile App (PWA Upgrade)
The studio dashboard on mobile must work as a full PWA:

**Mobile dashboard home:**
- Bottom navigation: Home / Events / Upload / Inbox / Profile
- Large touch targets (min 48px)
- Swipe-to-refresh on all lists
- Haptic feedback on key actions (photo uploaded, gallery shared)

**Mobile upload flow:**
- Camera access: shoot directly in-app (Cheetah mode for live events)
- Or pick from camera roll — supports HEIC, batch select
- Upload progress: persistent bottom bar showing X of Y uploaded, gold progress fill
- Background upload: continues even if screen locked (service worker)

**Mobile notifications:**
- Push notifications for: gallery opened, client downloaded photos, new selection submitted, new booking inquiry
- Notification center accessible from bottom nav

### 5B. Client Mobile Gallery
- Bottom bar: Gallery / Favorites / Downloads / Info
- Swipe between photos in lightbox (native-feeling momentum)
- Long press on photo: quick actions menu (favorite, download, share, order print)
- Pull to refresh in favorites list
- Haptic feedback on favorite toggle
- Face recognition: "Find my photos" prominent button in gallery — opens selfie camera flow

### 5C. Cheetah Live Event (Mobile Optimized)
For photographers shooting live:
- Simplified upload interface: big camera button, nothing else
- Auto-orientation detection
- Low-bandwidth mode: compresses to 50% quality for cellular upload
- Live guest view: QR code on big display — guests scan and see photos appear in real-time
- Photo reactions: guests can react with heart/fire/wow — photographer sees reactions in real-time

---

## PHASE 6: GALLERY SETTINGS — PHOTOGRAPHER CONTROL CENTER

Each event's gallery settings panel must give photographers total control without complexity:

### Gallery Customization Panel (slide-in right drawer):
**Tab 1: Design**
- Layout picker: Masonry / Editorial / Filmstrip — live preview thumbnail
- Color scheme: Light / Dark / Auto (follows client's OS)
- Cover photo: drag any photo to set as cover
- Watermark: toggle on/off, position (corner), opacity slider
- Font for client-facing headers: choose from 5 curated pairs

**Tab 2: Access**
- Password toggle + input
- Expiry date: calendar picker
- Download permissions: All / Favorites only / Disabled
- Guest selection: enable/disable, set target count
- QR code: display and download

**Tab 3: Features**
- Store: enable/disable print sales
- Face recognition: enable/disable
- Sneak peek mode: show only selected photos initially
- Comments/reactions: enable/disable
- Share button: enable/disable

**Tab 4: Notifications**
- Email photographer when: gallery opened / favorites submitted / download started
- Email client: welcome email (send now or schedule), reminder email

---

## PHASE 7: DESIGN POLISH & MICRO-INTERACTIONS

These small details separate world-class from merely good:

### Loading States
- Replace all spinners with: skeleton shimmer (pulse 1200ms, `--wash` background)
- Page-level loading: 1px gold bar top of screen, grows from 0% to 100%
- Photo grid loading: skeleton cards that match the masonry layout proportions

### Transitions
- Gallery photo hover: `transition-transform duration-200 ease-out scale-[1.02]`
- Drawer open/close: `translateX` transition 280ms cubic-bezier(0.32, 0.72, 0, 1)
- Tab switches: crossfade 160ms
- Modals: scale from 0.95 + fade in 200ms

### Empty States
Every empty state needs:
- An editorial, tasteful illustration (thin line art style, not colorful icons)
- A headline in Cormorant Garamond italic
- A clear CTA
- Examples: "No photos yet — upload your first gallery", "No favorites saved yet — heart the ones you love"

### Error States
- Inline, understated: small `--alert` colored text below the field
- Toast notifications: bottom-right, dismissible, 4s auto-dismiss
- Network errors: "You're offline — changes will sync when you reconnect" banner (gold, not red)

### Tooltips
- Appear on hover after 400ms delay
- DM Sans 12px, dark background, 4px border-radius
- Max-width 200px, text wraps cleanly
- For every icon-only button

---

## PHASE 8: COMPETITIVE DIFFERENTIATORS (What Pictime & Pixieset Can't Do)

These features are unique to Mirror.AI and must be polished to flagship quality:

### 8A. Storybook — The Digital Wedding Film
A Storybook is a scrollable, immersive digital narrative for each event:
- Cinematic full-screen photo moments interspersed with text
- Music background (client uploads or photographer suggests)
- Client shares a single link — opens in full-screen immersive mode
- OTP access for privacy
- Social sharing card: auto-generated preview image

### 8B. Reflections — The Emotional Archive
A private space where clients revisit their photos with emotional context:
- On anniversary reminders: "One year ago today, you got married"
- Push notification triggers gallery revisit
- Reflection prompts: "What's your favorite memory from this day?"
- Client writes reflections on specific photos — saved as a private journal
- Photographer can see that the client is "Still revisiting their gallery 2 years later" — opportunity for reconnection

### 8C. Art Gallery Intelligence Hub
A public-facing community where photographers share their work:
- Curated editorial discover feed
- Photographer profiles with portfolio grids
- Peer reactions (not likes — "Stunning light / Emotional moment / Technical mastery")
- Featured photographer spotlight (super-admin curated)

### 8D. Cheetah Live — Real-Time Event Experience
No competitor has anything close to Cheetah. Make it flagship:
- Photographer shoots → photo uploads in <5 seconds to guest view
- Guests see their name appear when face recognition matches their selfie
- "Photo wall" mode: large-screen display showing stream of new photos (for venue displays)
- Instant digital photo booth: guest scans QR → takes selfie → gets matched photos → downloads → shares
- Photo reactions from guests visible to photographer in real-time

---

## TECHNICAL REQUIREMENTS

- All new components must use existing shadcn/ui primitives from `src/components/ui/`
- New database tables must follow the existing Supabase schema pattern (snake_case, UUID primary keys, `created_at` timestamps, RLS policies)
- All new queries must use React Query (`useQuery`, `useMutation`) with proper keys
- File uploads must use the existing Cloudflare R2 presigned URL pattern
- New edge functions must be in `supabase/functions/[function-name]/index.ts`
- No new dependencies without justification — prefer existing libraries first
- Mobile-first: every new component starts with mobile layout, then adds `md:` and `lg:` breakpoints
- No `window.innerWidth` — use Tailwind responsive classes
- No inline `style={{}}` for layout/spacing/color — Tailwind only
- Every new feature needs a loading state, empty state, and error state

---

## PRIORITY ORDER

Build in this order (highest impact first):

1. **Client gallery cover + lightbox** — First thing clients see
2. **Favorites & selection flow** — Core workflow clients use
3. **Print store** — Revenue layer
4. **Command center dashboard** — Daily photographer use
5. **Unified inbox** — Communication backbone
6. **AI smart culling** — Biggest time-saver
7. **Mobile PWA upgrades** — Accessibility
8. **Gallery settings panel** — Photographer control
9. **Storybook polish** — Differentiator
10. **Cheetah live polish** — Differentiator

---

*Mirror.AI — "The UI equivalent of holding a Leica."*
