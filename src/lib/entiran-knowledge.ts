export type KnowledgeEntry = {
  keywords: string[];
  context: string[]; // 'all' for universal
  question: string;
  answer: string;
  followUp?: string;
  relatedQuestions?: string[];
};

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ─── Album Builder (10+) ───
  {
    keywords: ['create', 'album', 'selections', 'client', 'favorites'],
    context: ['album_builder', 'dashboard', 'all'],
    question: 'How do I create an album from client selections?',
    answer: `To create an album from client selections:\n\n1. Go to **Events** and open the event\n2. Check the **Selections** tab to see client picks\n3. Click **Create Album** — this opens the Album Builder with selected photos pre-loaded\n4. Choose your album size and layout preset\n5. Arrange spreads and export when ready`,
    followUp: 'Want me to show you how to customize the album layout?',
    relatedQuestions: ['How do I change the album layout?', 'How do I export my album for printing?'],
  },
  {
    keywords: ['photo', 'frame', 'fill', 'crop', 'cropping', 'cut', 'empty'],
    context: ['album_builder'],
    question: 'Why don\'t my photos fill the frame?',
    answer: `Photos may not fill frames when the aspect ratio differs from the frame shape.\n\n**Quick fixes:**\n1. Click the photo in the frame\n2. Use the **Crop** tool to reposition\n3. Drag to adjust the visible area\n4. Use **Fit** vs **Fill** mode — Fill stretches to cover, Fit shows the full image`,
    relatedQuestions: ['How do I change the album layout?', 'My album layout breaks on certain photos'],
  },
  {
    keywords: ['change', 'layout', 'template', 'spread', 'design'],
    context: ['album_builder'],
    question: 'How do I change the album layout?',
    answer: `To change a spread layout:\n\n1. Select the spread you want to modify\n2. Open the **Layout** panel on the right\n3. Browse preset layouts (1-photo, 2-photo, collage, etc.)\n4. Click a layout to apply it — your photos will rearrange automatically\n\nYou can also drag photos between frames to customize further.`,
    relatedQuestions: ['How do I use layout presets?', 'How do I use panoramic or full-bleed layouts?'],
  },
  {
    keywords: ['add', 'remove', 'spread', 'page', 'delete'],
    context: ['album_builder'],
    question: 'How do I add or remove spreads?',
    answer: `**To add a spread:** Click the **+** button in the spread timeline at the bottom, or use the toolbar's "Add Spread" option.\n\n**To remove a spread:** Right-click the spread thumbnail and select **Delete**, or select it and press the Delete key.\n\nNote: Removing a spread also removes any photos placed on it.`,
    relatedQuestions: ['How do I duplicate a spread?', 'How do I rearrange photos between spreads?'],
  },
  {
    keywords: ['rearrange', 'reorder', 'move', 'photo', 'between', 'spreads'],
    context: ['album_builder'],
    question: 'How do I rearrange photos between spreads?',
    answer: `To move photos between spreads:\n\n1. Click and hold the photo you want to move\n2. Drag it to the target spread in the timeline\n3. Drop it into the desired frame\n\nOn touch devices, long-press the photo first, then drag.`,
    relatedQuestions: ['How do I add or remove spreads?', 'How do I change the album layout?'],
  },
  {
    keywords: ['export', 'print', 'pdf', 'jpeg', 'download', 'album'],
    context: ['album_builder'],
    question: 'How do I export my album for printing?',
    answer: `To export your album:\n\n1. Click the **Export** button in the toolbar\n2. Choose your format:\n   - **PDF** — best for print labs\n   - **JPEG** — individual spread images\n3. Select resolution (300 DPI recommended for printing)\n4. Click **Export** and wait for processing\n\nThe download will start automatically when ready.`,
    followUp: 'Do you need help with print lab specifications?',
    relatedQuestions: ['What DPI and resolution is needed for print-ready export?', 'How do I save album as draft and resume later?'],
  },
  {
    keywords: ['dimensions', 'size', 'paper', 'album', 'change', 'resize'],
    context: ['album_builder'],
    question: 'How do I change album dimensions?',
    answer: `Album dimensions are set when creating the album:\n\n1. Open Album Settings (gear icon in toolbar)\n2. Available sizes: 8×8, 10×10, 12×12, 12×8, 14×10\n3. Changing size after layout may require re-adjusting spreads\n\n**Tip:** Choose your size before placing photos to avoid rework.`,
    relatedQuestions: ['What DPI and resolution is needed for print-ready export?', 'How do I change the album layout?'],
  },
  {
    keywords: ['preset', 'layout', 'auto', 'suggest', 'automatic'],
    context: ['album_builder'],
    question: 'How do I use layout presets?',
    answer: `Layout presets auto-arrange your photos:\n\n1. Select a spread\n2. Open the **Layout Panel** on the right\n3. Browse categories: Classic, Modern, Collage, Minimal\n4. Click any preset to apply it instantly\n5. Use **Auto Layout** to let Mirror AI suggest arrangements based on your photos`,
    relatedQuestions: ['How do I change the album layout?', 'My spreads look unbalanced — what should I do?'],
  },
  {
    keywords: ['unbalanced', 'look', 'bad', 'ugly', 'improve', 'balance'],
    context: ['album_builder'],
    question: 'My spreads look unbalanced — what should I do?',
    answer: `Tips for balanced album spreads:\n\n1. **Alternate layouts** — don't use the same layout twice in a row\n2. **Mix photo counts** — alternate between 1-photo and multi-photo spreads\n3. **Use white space** — not every frame needs to be filled\n4. **Try Auto Layout** — Mirror AI analyzes composition and suggests improvements\n5. **Check flow** — preview the album as a slideshow to check pacing`,
    relatedQuestions: ['How do I use layout presets?', 'How do I change the album layout?'],
  },
  {
    keywords: ['import', 'new', 'photos', 'add', 'more', 'existing', 'album'],
    context: ['album_builder'],
    question: 'How do I import new photos into an existing album?',
    answer: `To add more photos:\n\n1. Open the **Photo Library** panel (left sidebar)\n2. Click **Add Photos** at the top\n3. Select images from your computer or from an existing event\n4. New photos appear in the library — drag them into frames\n\nPhotos added here don't affect the original event gallery.`,
    relatedQuestions: ['How do I rearrange photos between spreads?', 'How do I create an album from client selections?'],
  },

  // ─── Album Builder Advanced (8) ───
  {
    keywords: ['duplicate', 'copy', 'spread', 'clone'],
    context: ['album_builder'],
    question: 'How do I duplicate a spread?',
    answer: `To duplicate a spread:\n\n1. Select the spread in the timeline\n2. Right-click and choose **Duplicate Spread**\n3. Or use the spread toolbar button (copy icon)\n\nThe duplicated spread will appear right after the original with the same layout and photos.`,
    relatedQuestions: ['How do I add or remove spreads?', 'How do I rearrange photos between spreads?'],
  },
  {
    keywords: ['text', 'caption', 'title', 'write', 'words', 'album', 'page'],
    context: ['album_builder'],
    question: 'How do I add text or captions to album pages?',
    answer: `To add text to album pages:\n\n1. Select the spread you want to add text to\n2. Click the **Text** tool in the toolbar (T icon)\n3. Click on the spread where you want the text\n4. Type your caption, title, or message\n5. Use the formatting panel to change font, size, and color\n\n**Tip:** Use text sparingly — let the photos tell the story.`,
    relatedQuestions: ['How do I change background color of a spread?', 'How do I change the album layout?'],
  },
  {
    keywords: ['background', 'color', 'spread', 'change', 'white', 'black'],
    context: ['album_builder'],
    question: 'How do I change the background color of a spread?',
    answer: `To change spread background color:\n\n1. Select the spread\n2. Open the **Settings** panel (right sidebar)\n3. Find **Background Color**\n4. Click the color swatch to choose a new color\n5. You can also select paper textures for a more natural look\n\nWhite and cream backgrounds work best for most wedding albums.`,
    relatedQuestions: ['How do I add text or captions to album pages?', 'How do I change the album layout?'],
  },
  {
    keywords: ['panoramic', 'full', 'bleed', 'edge', 'borderless', 'wide'],
    context: ['album_builder'],
    question: 'How do I use panoramic or full-bleed layouts?',
    answer: `For panoramic and full-bleed layouts:\n\n1. Select the spread\n2. Open **Layout Panel** → browse **Panoramic** category\n3. Full-bleed layouts extend photos to the page edges\n4. Available panoramic sizes: 12×36, 12×30, 10×30, 10×24\n\n**Important:** Full-bleed requires 3mm bleed area. The red guides in the editor show safe margins — keep important content inside them.`,
    relatedQuestions: ['What DPI and resolution is needed for print-ready export?', 'How do I change album dimensions?'],
  },
  {
    keywords: ['dpi', 'resolution', 'print', 'ready', 'quality', 'ppi'],
    context: ['album_builder'],
    question: 'What DPI and resolution is needed for print-ready export?',
    answer: `For print-ready album exports:\n\n- **Standard printing:** 300 DPI (recommended)\n- **Large format:** 150 DPI minimum\n- **Web/screen sharing:** 72-150 DPI\n\nMirror AI automatically exports at 300 DPI when you choose PDF or high-quality JPEG. The bleed area (3mm) and safe margins (5mm) are included automatically.\n\n**Tip:** Ensure your original photos are at least 3000px on the longest edge for best print quality.`,
    relatedQuestions: ['How do I export my album for printing?', 'How do I use panoramic or full-bleed layouts?'],
  },
  {
    keywords: ['save', 'draft', 'resume', 'later', 'continue', 'autosave'],
    context: ['album_builder'],
    question: 'How do I save album as draft and resume later?',
    answer: `Albums are **auto-saved** as you work:\n\n- Every change is saved automatically to the cloud\n- You'll see a small "Saved" indicator in the toolbar\n- To resume later, go to **Events** → select the event → **Albums** tab\n- Click on your album to continue editing\n\nDraft albums are marked with a "Draft" badge. They're only visible to you until exported.`,
    relatedQuestions: ['How do I export my album for printing?', 'How do I create multiple album versions for the same event?'],
  },
  {
    keywords: ['multiple', 'versions', 'album', 'same', 'event', 'another'],
    context: ['album_builder'],
    question: 'How do I create multiple album versions for the same event?',
    answer: `To create multiple albums for one event:\n\n1. Go to **Events** → select the event\n2. Open the **Albums** tab\n3. Click **New Album**\n4. Each album can have different sizes, layouts, and photo selections\n\n**Use cases:** Create a full wedding album plus a smaller parent album, or create different versions for client review.`,
    relatedQuestions: ['How do I create an album from client selections?', 'How do I duplicate a spread?'],
  },
  {
    keywords: ['undo', 'redo', 'revert', 'mistake', 'back', 'ctrl'],
    context: ['album_builder'],
    question: 'How do I undo or redo changes?',
    answer: `**Undo/Redo shortcuts:**\n\n- **Undo:** Ctrl+Z (Cmd+Z on Mac)\n- **Redo:** Ctrl+Y or Ctrl+Shift+Z (Cmd+Y or Cmd+Shift+Z on Mac)\n\nYou can also use the undo/redo buttons in the toolbar (arrow icons).\n\n**Note:** Undo history is maintained per session. If you close and reopen the album, you can't undo previous session changes.`,
    relatedQuestions: ['What keyboard shortcuts are available?', 'How do I save album as draft and resume later?'],
  },

  // ─── Event Gallery (8+) ───
  {
    keywords: ['create', 'new', 'event', 'gallery'],
    context: ['event_gallery', 'dashboard'],
    question: 'How do I create a new event gallery?',
    answer: `To create a new event gallery:\n\n1. Go to **Events** from the dashboard\n2. Click **Create Event**\n3. Fill in: event name, date, type (wedding, portrait, etc.)\n4. Click **Create** — you'll be taken to the gallery editor\n5. Upload photos using the upload button\n\nYour gallery is private by default until you publish it.`,
    relatedQuestions: ['How do I upload photos to a gallery?', 'How do I share the gallery with my client?'],
  },
  {
    keywords: ['upload', 'photos', 'images', 'gallery', 'add'],
    context: ['event_gallery'],
    question: 'How do I upload photos to a gallery?',
    answer: `To upload photos:\n\n1. Open the event gallery\n2. Click the **Upload** button (or drag & drop files)\n3. Select JPEG or PNG files (max 25MB each)\n4. Photos are automatically compressed and optimized\n5. Upload progress shows in the panel\n\n**Tip:** You can upload ZIP files for bulk imports. Duplicates are auto-detected and skipped.`,
    relatedQuestions: ['How do I create a new event gallery?', 'Photos missing from gallery after upload'],
  },
  {
    keywords: ['share', 'link', 'send', 'client', 'gallery'],
    context: ['event_gallery', 'gallery_delivery'],
    question: 'How do I share the gallery with my client?',
    answer: `To share your gallery:\n\n1. Open the event gallery\n2. Click the **Share** button in the toolbar\n3. Copy the gallery link\n4. Send it to your client via email, WhatsApp, or any messenger\n\nYou can also set a **PIN code** for extra security, or enable **password protection** in gallery settings.`,
    followUp: 'Want to set up PIN protection for this gallery?',
    relatedQuestions: ['How do I set gallery PIN protection?', 'How do I enable or disable client downloads?'],
  },
  {
    keywords: ['download', 'enable', 'disable', 'client', 'allow'],
    context: ['event_gallery'],
    question: 'How do I enable or disable client downloads?',
    answer: `To manage download settings:\n\n1. Open the event gallery\n2. Go to **Settings** (gear icon)\n3. Toggle **Downloads Enabled**\n4. Choose resolution: Web (optimized) or Original (full size)\n5. Optionally set a download password\n\nYou can also allow downloads only for favorited photos.`,
    relatedQuestions: ['How do I set download quality?', 'How do I create a download PIN for the gallery?'],
  },
  {
    keywords: ['pin', 'password', 'protect', 'security', 'private'],
    context: ['event_gallery'],
    question: 'How do I set gallery PIN protection?',
    answer: `To protect your gallery with a PIN:\n\n1. Open gallery **Settings**\n2. Find **Gallery Protection**\n3. Enable **PIN Protection**\n4. Enter a 4-6 digit PIN\n5. Save changes\n\nClients will need to enter this PIN before viewing photos. Share the PIN separately from the gallery link for security.`,
    relatedQuestions: ['How do I share the gallery with my client?', 'How do I create a download PIN for the gallery?'],
  },
  {
    keywords: ['favorites', 'selections', 'how', 'work', 'select'],
    context: ['event_gallery', 'all'],
    question: 'How do favorites and selections work?',
    answer: `**Favorites** let clients mark photos they love:\n\n1. When viewing the gallery, clients tap the heart icon on photos\n2. Favorites are saved to their session\n3. You can view all client favorites in the **Selections** tab\n4. Use favorites to create albums or prepare final deliveries\n\n**Selection Mode** lets clients make a formal selection with a submit button.`,
    relatedQuestions: ['How do I view my client\'s selected photos?', 'How do I send a selection reminder to my client?'],
  },
  {
    keywords: ['view', 'client', 'selected', 'picked', 'chosen'],
    context: ['event_gallery', 'dashboard'],
    question: 'How do I view my client\'s selected photos?',
    answer: `To view client selections:\n\n1. Open the event gallery\n2. Go to the **Selections** tab\n3. See all favorited/selected photos grouped by guest session\n4. You can filter by guest name if multiple people selected\n\nFrom here you can create an album or export the selection list.`,
    relatedQuestions: ['How do favorites and selections work?', 'How do I create an album from client selections?'],
  },
  {
    keywords: ['reminder', 'nudge', 'client', 'selection', 'send'],
    context: ['event_gallery', 'gallery_delivery'],
    question: 'How do I send a selection reminder to my client?',
    answer: `To remind clients to make their selections:\n\n1. Open the event gallery\n2. Click **Share** → **Send Reminder**\n3. A pre-written reminder message will be prepared\n4. Customize the message if needed\n5. Send via email or copy the link to share manually\n\nThe reminder includes the gallery link and a gentle nudge to select their favorites.`,
    relatedQuestions: ['How do favorites and selections work?', 'How do I share the gallery with my client?'],
  },

  // ─── Gallery Delivery (8) ───
  {
    keywords: ['download', 'quality', 'resolution', 'web', 'original', 'set'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I set download quality?',
    answer: `To configure download quality:\n\n1. Open the event gallery **Settings**\n2. Find **Download Settings**\n3. Choose resolution:\n   - **Web** — optimized for screen (faster downloads, smaller files)\n   - **Original** — full resolution as uploaded\n4. Save changes\n\n**Tip:** Use "Web" for proofing galleries, "Original" for final delivery.`,
    relatedQuestions: ['How do I enable or disable client downloads?', 'How do I watermark photos before delivery?'],
  },
  {
    keywords: ['watermark', 'brand', 'protect', 'logo', 'overlay'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I watermark photos before delivery?',
    answer: `To enable watermarking:\n\n1. Open event gallery **Settings**\n2. Toggle **Watermark Enabled**\n3. Your studio logo will be applied as a watermark\n4. Watermarks appear on preview images only — downloaded originals can be clean or watermarked based on your settings\n\n**To customize your watermark:** Go to **Profile** → **Branding** → upload your watermark image.`,
    relatedQuestions: ['How do I set download quality?', 'How do I customize the delivery page branding?'],
  },
  {
    keywords: ['download', 'pin', 'code', 'protect', 'password'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I create a download PIN for the gallery?',
    answer: `To add a download PIN:\n\n1. Open gallery **Settings**\n2. Enable **Download Requires Password**\n3. Set your download PIN/password\n4. Save changes\n\nClients can view photos freely but must enter the PIN to download. This is separate from the gallery view PIN.`,
    relatedQuestions: ['How do I set gallery PIN protection?', 'How do I enable or disable client downloads?'],
  },
  {
    keywords: ['expiry', 'expire', 'date', 'limit', 'time', 'gallery', 'access'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I set gallery expiry date?',
    answer: `Currently, Mirror AI galleries don't expire by default — they remain accessible until you archive them.\n\n**To limit access:**\n1. Open gallery **Settings**\n2. Toggle **Archive** when you want to disable access\n3. Archived galleries are hidden from clients but preserved for you\n\n**Tip:** You can unarchive galleries at any time to restore access.`,
    relatedQuestions: ['How do I share the gallery with my client?', 'How do I manage my events?'],
  },
  {
    keywords: ['track', 'downloaded', 'count', 'how many', 'client', 'analytics'],
    context: ['gallery_delivery', 'event_gallery', 'dashboard'],
    question: 'How do I track client downloads?',
    answer: `To track downloads:\n\n1. Open the event gallery\n2. Go to the **Analytics** tab\n3. See download count, most downloaded photos, and client activity\n\nYou can also check **Dashboard** → **Analytics** for an overview across all galleries.\n\nDownload tracking is automatic — no setup required.`,
    relatedQuestions: ['How do I view studio analytics?', 'How do I enable or disable client downloads?'],
  },
  {
    keywords: ['individual', 'single', 'zip', 'bulk', 'full', 'download', 'gallery'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I enable individual vs full gallery download?',
    answer: `To configure download options:\n\n1. Open gallery **Settings**\n2. Find **Download Options**:\n   - **Allow Full Download** — clients can download all photos as a ZIP\n   - **Allow Favorites Download** — clients download only their selected photos\n3. Toggle each option independently\n\n**Recommendation:** Enable both for the best client experience.`,
    relatedQuestions: ['How do I set download quality?', 'How do I enable or disable client downloads?'],
  },
  {
    keywords: ['cover', 'photo', 'delivery', 'page', 'thumbnail', 'hero'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I add a cover photo for the delivery page?',
    answer: `To set a gallery cover photo:\n\n1. Open the event gallery\n2. Click **Settings** (gear icon)\n3. Find **Cover Image**\n4. Upload or select a photo from the gallery\n5. The cover appears on the gallery landing page and in shared links\n\n**Tip:** Choose a standout hero shot that represents the event.`,
    relatedQuestions: ['How do I customize the delivery page branding?', 'How do I share the gallery with my client?'],
  },
  {
    keywords: ['customize', 'branding', 'colors', 'delivery', 'page', 'theme'],
    context: ['gallery_delivery', 'event_gallery'],
    question: 'How do I customize the delivery page branding?',
    answer: `To customize your delivery page:\n\n1. Open gallery **Settings**\n2. Find **Gallery Style** — choose from themes like Editorial, Minimal, Cinematic\n3. Each theme has different layouts and color schemes\n4. Your studio logo and branding are applied automatically\n\nFor studio-wide branding, go to **Profile** → **Website Editor** to set colors and fonts.`,
    relatedQuestions: ['How do I watermark photos before delivery?', 'How do I update my profile and branding?'],
  },

  // ─── Pricing & Subscription (5) ───
  {
    keywords: ['upgrade', 'plan', 'pro', 'premium', 'change', 'tier'],
    context: ['dashboard', 'settings'],
    question: 'How do I upgrade my plan?',
    answer: `To upgrade your plan:\n\n1. Go to **Profile** → **Billing**\n2. View available plans and features\n3. Click **Upgrade** on your desired plan\n4. Complete payment\n\nUpgrades take effect immediately. Your storage limit and feature access will update right away.`,
    relatedQuestions: ['What features are included in each plan?', 'How do I download invoice or payment receipt?'],
  },
  {
    keywords: ['features', 'included', 'plan', 'what', 'get', 'compare'],
    context: ['dashboard', 'settings', 'all'],
    question: 'What features are included in each plan?',
    answer: `**Mirror AI Plans:**\n\n**Free:**\n- 5 events, 500 photos, basic gallery themes\n\n**Pro:**\n- Unlimited events, 10,000 photos, all gallery themes, album builder, watermarking, analytics\n\n**Studio:**\n- Everything in Pro + custom domain, priority support, advanced branding, API access\n\nVisit **Billing** in your profile for current pricing and details.`,
    relatedQuestions: ['How do I upgrade my plan?', 'How do I manage my subscription?'],
  },
  {
    keywords: ['cancel', 'subscription', 'stop', 'end', 'unsubscribe'],
    context: ['dashboard', 'settings'],
    question: 'How do I cancel my subscription?',
    answer: `To cancel your subscription:\n\n1. Go to **Profile** → **Billing**\n2. Click **Manage Subscription**\n3. Select **Cancel Plan**\n4. Confirm cancellation\n\nYour access continues until the end of your billing period. Data is preserved — you can resubscribe anytime.\n\n**Note:** Consider downgrading instead of canceling to keep basic access.`,
    relatedQuestions: ['How do I upgrade my plan?', 'How do I change payment method?'],
  },
  {
    keywords: ['invoice', 'receipt', 'payment', 'bill', 'download', 'history'],
    context: ['dashboard', 'settings'],
    question: 'How do I download invoice or payment receipt?',
    answer: `To access invoices:\n\n1. Go to **Profile** → **Billing**\n2. Scroll to **Payment History**\n3. Click the download icon next to any payment\n4. PDF invoice will be downloaded\n\nInvoices include all tax details and are suitable for business accounting.`,
    relatedQuestions: ['How do I upgrade my plan?', 'How do I change payment method?'],
  },
  {
    keywords: ['payment', 'method', 'card', 'change', 'update', 'credit'],
    context: ['dashboard', 'settings'],
    question: 'How do I change payment method?',
    answer: `To update your payment method:\n\n1. Go to **Profile** → **Billing**\n2. Find **Payment Method**\n3. Click **Update** to add a new card\n4. Enter your new card details\n5. Save — the new card will be used for future payments\n\nYou can also add backup payment methods.`,
    relatedQuestions: ['How do I download invoice or payment receipt?', 'How do I cancel my subscription?'],
  },

  // ─── Dashboard (6+) ───
  {
    keywords: ['manage', 'events', 'list', 'overview'],
    context: ['dashboard'],
    question: 'How do I manage my events?',
    answer: `From the **Dashboard**:\n\n1. Click **Events** in the navigation\n2. See all your events sorted by date\n3. Click any event to open it\n4. Use the search bar to find specific events\n5. Archive old events to keep your list clean\n\nThe overview page shows your most recent events and quick stats.`,
    relatedQuestions: ['How do I create a new event gallery?', 'How do I view studio analytics?'],
  },
  {
    keywords: ['analytics', 'stats', 'views', 'statistics'],
    context: ['dashboard'],
    question: 'How do I view studio analytics?',
    answer: `To view your analytics:\n\n1. Go to **Analytics** from the dashboard sidebar\n2. See gallery views, downloads, and favorites over time\n3. Check which galleries are most popular\n4. View client engagement metrics\n\nAnalytics update in real-time as clients interact with your galleries.`,
    relatedQuestions: ['How do I track client downloads?', 'How do I manage my events?'],
  },
  {
    keywords: ['domain', 'custom', 'connect', 'website', 'url'],
    context: ['dashboard', 'domains', 'settings'],
    question: 'How do I connect a custom domain?',
    answer: `To connect a custom domain:\n\n1. Go to **Domains** in dashboard settings\n2. Click **Add Custom Domain**\n3. Enter your domain (e.g. photos.yourstudio.com)\n4. Add the DNS records shown to your domain provider\n5. Click **Verify** — verification may take up to 48 hours\n\nYour Mirror AI website will then be accessible at your custom domain.`,
    relatedQuestions: ['How do I update my profile and branding?', 'How do I navigate Mirror AI?'],
  },
  {
    keywords: ['profile', 'branding', 'logo', 'studio', 'name', 'update'],
    context: ['dashboard', 'settings'],
    question: 'How do I update my profile and branding?',
    answer: `To update your studio profile:\n\n1. Go to **Profile** in the sidebar\n2. Update your studio name, bio, and contact info\n3. Upload your logo and cover image\n4. For advanced branding, go to **Website Editor** to customize colors, fonts, and layout`,
    relatedQuestions: ['How do I connect a custom domain?', 'How do I customize the delivery page branding?'],
  },
  {
    keywords: ['pricing', 'subscription', 'plan', 'billing', 'upgrade'],
    context: ['dashboard', 'settings'],
    question: 'How do I manage my subscription?',
    answer: `To manage your subscription:\n\n1. Go to **Profile** → **Billing**\n2. See your current plan and usage\n3. Upgrade or downgrade as needed\n4. Update payment method\n\nYour storage usage and photo limits are shown on the dashboard overview.`,
    relatedQuestions: ['How do I upgrade my plan?', 'What features are included in each plan?'],
  },
  {
    keywords: ['navigate', 'find', 'where', 'menu', 'help'],
    context: ['dashboard', 'all'],
    question: 'How do I navigate Mirror AI?',
    answer: `**Mirror AI Navigation:**\n\n- **Overview** — Dashboard home with quick stats\n- **Events** — Create and manage photo galleries\n- **Website** — Edit your portfolio website\n- **Cheetah** — AI-powered photo culling\n- **Clients** — Manage client access\n- **Analytics** — View engagement stats\n- **Profile** — Update your studio info\n\nOn mobile, use the bottom navigation bar. The **More** tab shows additional options.`,
    relatedQuestions: ['What is Mirror AI?', 'What keyboard shortcuts are available?'],
  },

  // ─── General (6+) ───
  {
    keywords: ['what', 'mirror', 'ai', 'about', 'platform'],
    context: ['all'],
    question: 'What is Mirror AI?',
    answer: `**Mirror AI** is a premium photography SaaS platform designed for professional photographers.\n\nKey features:\n- 📸 **Gallery Delivery** — Share beautiful galleries with clients\n- 📚 **Album Builder** — Design print-ready albums\n- ⚡ **Cheetah AI** — Smart photo culling\n- 🌐 **Portfolio Website** — Build your online presence\n- 👥 **Client Management** — Track selections and deliveries\n\nEverything you need to run your photography business, in one place.`,
    relatedQuestions: ['How do I navigate Mirror AI?', 'How do I contact support?'],
  },
  {
    keywords: ['contact', 'support', 'help', 'team', 'reach'],
    context: ['all'],
    question: 'How do I contact support?',
    answer: `For support:\n\n1. Use this chat — I can help with most questions!\n2. Report bugs using the bug report flow (just say "report a bug")\n3. Email: support@mirrorai.studio\n\nOur team typically responds within 24 hours.`,
    relatedQuestions: ['How do I report a bug?', 'What is Mirror AI?'],
  },
  {
    keywords: ['report', 'bug', 'broken', 'error', 'issue', 'not working', 'problem'],
    context: ['all'],
    question: 'How do I report a bug?',
    answer: '__BUG_REPORT_TRIGGER__',
  },
  {
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'keys'],
    context: ['all'],
    question: 'What keyboard shortcuts are available?',
    answer: `**Keyboard Shortcuts:**\n\n- **Ctrl/Cmd + Z** — Undo\n- **Ctrl/Cmd + Y** — Redo\n- **Delete/Backspace** — Remove selected item\n- **Arrow Keys** — Reposition selected element\n- **Ctrl/Cmd + S** — Save (where applicable)\n- **Ctrl/Cmd + Shift + E** — Toggle Daan assistant\n- **Esc** — Close panel or deselect\n\nShortcuts work in the Album Builder and Gallery Editor.`,
    relatedQuestions: ['How do I undo or redo changes?', 'How do I navigate Mirror AI?'],
  },
  {
    keywords: ['switch', 'event', 'between', 'change'],
    context: ['all'],
    question: 'How do I switch between events?',
    answer: `To switch between events:\n\n1. Click **Events** in the sidebar\n2. Select the event you want to work on\n3. Or use the search bar at the top to find a specific event by name\n\nYour work is auto-saved, so you can safely switch at any time.`,
    relatedQuestions: ['How do I manage my events?', 'How do I navigate Mirror AI?'],
  },
  {
    keywords: ['logout', 'sign out', 'switch', 'account'],
    context: ['all'],
    question: 'How do I logout or switch accounts?',
    answer: `To sign out:\n\n1. Click your **profile avatar** in the top-right corner\n2. Select **Sign Out**\n\nOn mobile, go to **More** → **Sign Out**.\n\nTo switch accounts, sign out first, then sign in with a different email.`,
    relatedQuestions: ['How do I navigate Mirror AI?', 'How do I update my profile and branding?'],
  },
  {
    keywords: ['what', 'can', 'you', 'do', 'help', 'daan', 'capabilities'],
    context: ['all'],
    question: 'What can you do?',
    answer: `I'm **Daan**, your AI studio assistant! Here's what I can help with:\n\n💬 **Ask anything** — Instant help with galleries, albums, settings, and more\n🐛 **Report issues** — I auto-collect device info and screenshots\n🧠 **Studio Brain** — Proactive suggestions based on your studio activity\n⚡ **Quick actions** — Tap chips below for common tasks\n\nI also watch your studio activity and nudge you when clients select photos, galleries are ready to share, or albums need exporting.`,
    relatedQuestions: ['What is Mirror AI?', 'What keyboard shortcuts are available?'],
  },

  // ─── Troubleshooting (6) ───
  {
    keywords: ['blurry', 'preview', 'low', 'quality', 'album', 'fuzzy', 'pixelated'],
    context: ['album_builder', 'all'],
    question: 'Photos appear blurry in album preview',
    answer: `Don't worry — **preview images use lower resolution** for faster performance.\n\n**The exported file will be full quality** at 300 DPI.\n\nTo verify:\n1. Check the photo's original resolution (hover over it in the library)\n2. Ensure the original is at least 3000px on the longest edge\n3. Try the **100% zoom** view to see actual print quality\n\nIf photos are still blurry at 100% zoom, the originals may be too small for the frame size.`,
    relatedQuestions: ['What DPI and resolution is needed for print-ready export?', 'How do I export my album for printing?'],
  },
  {
    keywords: ['gallery', 'loading', 'slowly', 'slow', 'takes', 'long', 'page'],
    context: ['event_gallery', 'gallery_delivery', 'all'],
    question: 'Gallery page is loading slowly',
    answer: `If your gallery is loading slowly, try these steps:\n\n1. **Check your internet connection** — galleries load high-quality images\n2. **Clear browser cache** — old cached data can slow things down\n3. **Close other browser tabs** — free up memory\n4. **Reduce open tabs** — each gallery tab uses memory\n\nIf you have a very large gallery (500+ photos), loading time is normal. Photos load progressively — keep scrolling and they'll appear.\n\nStill slow? Try a different browser or device.`,
    relatedQuestions: ['How do I contact support?', 'How do I report a bug?'],
  },
  {
    keywords: ['cannot', 'login', 'cant', 'password', 'reset', 'sign', 'in', 'access'],
    context: ['all'],
    question: 'Cannot login or password reset not working',
    answer: `If you're having trouble logging in:\n\n1. **Clear cookies and cache** in your browser settings\n2. **Try incognito/private mode** — rules out extension conflicts\n3. **Check your email** — password reset emails may take a few minutes\n4. **Check spam folder** — reset emails sometimes go to spam\n5. **Try a different browser** — Chrome or Safari recommended\n\nIf nothing works, contact support at support@mirrorai.studio with your account email.`,
    relatedQuestions: ['How do I contact support?', 'How do I logout or switch accounts?'],
  },
  {
    keywords: ['export', 'stuck', 'processing', 'pending', 'never', 'finishes'],
    context: ['album_builder', 'all'],
    question: 'Export stuck at processing',
    answer: `If your export seems stuck:\n\n1. **Wait 2-3 minutes** — large albums take time to process\n2. **Clear browser cache** and refresh the page\n3. **Try a different browser** — Chrome works best\n4. **Check your internet** — a stable connection is needed during export\n\nIf the export fails completely, try exporting fewer spreads at a time, or reduce the resolution setting.\n\nStill having issues? Report a bug and we'll investigate.`,
    relatedQuestions: ['How do I export my album for printing?', 'How do I report a bug?'],
  },
  {
    keywords: ['photos', 'missing', 'disappeared', 'gone', 'upload', 'not', 'showing'],
    context: ['event_gallery', 'all'],
    question: 'Photos missing from gallery after upload',
    answer: `If photos aren't showing after upload:\n\n1. **Check the upload status** — look for the upload progress panel\n2. **Verify file format** — only JPEG and PNG are supported\n3. **Check file size** — maximum 25MB per photo\n4. **Refresh the page** — photos may take a moment to process\n5. **Check your storage quota** — you may have reached your plan's limit\n\nCorrupted files or unsupported formats (HEIC, RAW, TIFF) will be skipped during upload.`,
    relatedQuestions: ['How do I upload photos to a gallery?', 'How do I manage my subscription?'],
  },
  {
    keywords: ['layout', 'breaks', 'broken', 'wrong', 'aspect', 'ratio', 'distorted'],
    context: ['album_builder', 'all'],
    question: 'Album layout breaks on certain photos',
    answer: `Layout issues usually happen due to **aspect ratio mismatch**:\n\n- **Landscape photos** in portrait frames (or vice versa) will be cropped heavily\n- **Panoramic photos** may lose important content in square frames\n\n**Fixes:**\n1. Use the **Crop tool** to adjust what's visible in the frame\n2. Switch to a layout that matches your photo orientations\n3. Use **Auto Layout** — it matches photo orientation to frame shape automatically\n4. Pre-crop problematic photos in your editing software before importing`,
    relatedQuestions: ['Why don\'t my photos fill the frame?', 'How do I change the album layout?'],
  },
];

// ─── Synonym Mapping ───
const SYNONYMS: Record<string, string[]> = {
  photo: ['pic', 'image', 'picture', 'shot'],
  spread: ['page', 'layout', 'slide'],
  share: ['send', 'deliver', 'give', 'distribute'],
  bug: ['broken', 'not working', 'error', 'issue', 'problem', 'glitch'],
  slow: ['laggy', 'hanging', 'stuck', 'freezing', 'loading'],
  album: ['book', 'photobook', 'photo book'],
  gallery: ['collection', 'portfolio', 'folder'],
  export: ['download', 'save', 'print', 'output'],
  client: ['customer', 'couple', 'bride', 'groom'],
};

function expandSynonyms(message: string): string {
  let expanded = message.toLowerCase();
  for (const [root, syns] of Object.entries(SYNONYMS)) {
    for (const syn of syns) {
      if (expanded.includes(syn) && !expanded.includes(root)) {
        expanded += ` ${root}`;
      }
    }
  }
  return expanded;
}

const TROUBLESHOOTING: { keywords: string[]; suggestion: string }[] = [
  {
    keywords: ['not loading', 'blank', 'white screen', 'empty'],
    suggestion: 'Try refreshing the page first. If that doesn\'t help, clear your browser cache. Still seeing the issue?',
  },
  {
    keywords: ['slow', 'laggy', 'lag', 'frozen', 'freeze'],
    suggestion: 'Try closing other browser tabs to free up memory. Also check your internet connection. Still experiencing slowness?',
  },
  {
    keywords: ['can\'t upload', 'upload failed', 'upload error', 'won\'t upload'],
    suggestion: 'Check that your files are JPEG or PNG and under 25MB each. Also ensure you have a stable internet connection. Still having trouble?',
  },
];

export function matchKnowledge(
  message: string,
  pageContext: string
): { entry: KnowledgeEntry; score: number } | null {
  const expanded = expandSynonyms(message);

  let bestMatch: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    const contextMatch =
      entry.context.includes('all') || entry.context.includes(pageContext);
    if (!contextMatch) continue;

    let score = 0;
    for (const kw of entry.keywords) {
      if (expanded.includes(kw.toLowerCase())) score++;
    }

    // Context priority boost: 2x if entry context matches current page
    if (entry.context.includes(pageContext) && !entry.context.includes('all')) {
      score *= 2;
    }

    if (score >= 2 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  return bestMatch;
}

export function getRelatedQuestions(
  entry: KnowledgeEntry,
  pageContext: string
): string[] {
  if (entry.relatedQuestions && entry.relatedQuestions.length > 0) {
    return entry.relatedQuestions.slice(0, 3);
  }
  // Fallback: pick 2 from same context
  const related = KNOWLEDGE_BASE
    .filter(e => e.question !== entry.question && (e.context.includes(pageContext) || e.context.includes('all')))
    .slice(0, 2)
    .map(e => e.question);
  return related;
}

export function matchTroubleshooting(message: string): string | null {
  const lower = message.toLowerCase();
  for (const t of TROUBLESHOOTING) {
    if (t.keywords.some((kw) => lower.includes(kw))) {
      return t.suggestion;
    }
  }
  return null;
}

export function isBugReportTrigger(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = ['report a bug', 'report bug', 'something is broken', 'there\'s an error', 'not working', 'broken', 'bug report'];
  return triggers.some((t) => lower.includes(t));
}
