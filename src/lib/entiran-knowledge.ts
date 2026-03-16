export type KnowledgeEntry = {
  keywords: string[];
  context: string[]; // 'all' for universal
  question: string;
  answer: string;
  followUp?: string;
};

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ─── Album Builder (10+) ───
  {
    keywords: ['create', 'album', 'selections', 'client', 'favorites'],
    context: ['album_builder', 'dashboard', 'all'],
    question: 'How do I create an album from client selections?',
    answer: `To create an album from client selections:\n\n1. Go to **Events** and open the event\n2. Check the **Selections** tab to see client picks\n3. Click **Create Album** — this opens the Album Builder with selected photos pre-loaded\n4. Choose your album size and layout preset\n5. Arrange spreads and export when ready`,
    followUp: 'Want me to show you how to customize the album layout?',
  },
  {
    keywords: ['photo', 'frame', 'fill', 'crop', 'cropping', 'cut', 'empty'],
    context: ['album_builder'],
    question: 'Why don\'t my photos fill the frame?',
    answer: `Photos may not fill frames when the aspect ratio differs from the frame shape.\n\n**Quick fixes:**\n1. Click the photo in the frame\n2. Use the **Crop** tool to reposition\n3. Drag to adjust the visible area\n4. Use **Fit** vs **Fill** mode — Fill stretches to cover, Fit shows the full image`,
  },
  {
    keywords: ['change', 'layout', 'template', 'spread', 'design'],
    context: ['album_builder'],
    question: 'How do I change the album layout?',
    answer: `To change a spread layout:\n\n1. Select the spread you want to modify\n2. Open the **Layout** panel on the right\n3. Browse preset layouts (1-photo, 2-photo, collage, etc.)\n4. Click a layout to apply it — your photos will rearrange automatically\n\nYou can also drag photos between frames to customize further.`,
  },
  {
    keywords: ['add', 'remove', 'spread', 'page', 'delete'],
    context: ['album_builder'],
    question: 'How do I add or remove spreads?',
    answer: `**To add a spread:** Click the **+** button in the spread timeline at the bottom, or use the toolbar's "Add Spread" option.\n\n**To remove a spread:** Right-click the spread thumbnail and select **Delete**, or select it and press the Delete key.\n\nNote: Removing a spread also removes any photos placed on it.`,
  },
  {
    keywords: ['rearrange', 'reorder', 'move', 'photo', 'between', 'spreads'],
    context: ['album_builder'],
    question: 'How do I rearrange photos between spreads?',
    answer: `To move photos between spreads:\n\n1. Click and hold the photo you want to move\n2. Drag it to the target spread in the timeline\n3. Drop it into the desired frame\n\nOn touch devices, long-press the photo first, then drag.`,
  },
  {
    keywords: ['export', 'print', 'pdf', 'jpeg', 'download', 'album'],
    context: ['album_builder'],
    question: 'How do I export my album for printing?',
    answer: `To export your album:\n\n1. Click the **Export** button in the toolbar\n2. Choose your format:\n   - **PDF** — best for print labs\n   - **JPEG** — individual spread images\n3. Select resolution (300 DPI recommended for printing)\n4. Click **Export** and wait for processing\n\nThe download will start automatically when ready.`,
    followUp: 'Do you need help with print lab specifications?',
  },
  {
    keywords: ['dimensions', 'size', 'paper', 'album', 'change', 'resize'],
    context: ['album_builder'],
    question: 'How do I change album dimensions?',
    answer: `Album dimensions are set when creating the album:\n\n1. Open Album Settings (gear icon in toolbar)\n2. Available sizes: 8×8, 10×10, 12×12, 12×8, 14×10\n3. Changing size after layout may require re-adjusting spreads\n\n**Tip:** Choose your size before placing photos to avoid rework.`,
  },
  {
    keywords: ['preset', 'layout', 'auto', 'suggest', 'automatic'],
    context: ['album_builder'],
    question: 'How do I use layout presets?',
    answer: `Layout presets auto-arrange your photos:\n\n1. Select a spread\n2. Open the **Layout Panel** on the right\n3. Browse categories: Classic, Modern, Collage, Minimal\n4. Click any preset to apply it instantly\n5. Use **Auto Layout** to let Mirror AI suggest arrangements based on your photos`,
  },
  {
    keywords: ['unbalanced', 'look', 'bad', 'ugly', 'improve', 'balance'],
    context: ['album_builder'],
    question: 'My spreads look unbalanced — what should I do?',
    answer: `Tips for balanced album spreads:\n\n1. **Alternate layouts** — don't use the same layout twice in a row\n2. **Mix photo counts** — alternate between 1-photo and multi-photo spreads\n3. **Use white space** — not every frame needs to be filled\n4. **Try Auto Layout** — Mirror AI analyzes composition and suggests improvements\n5. **Check flow** — preview the album as a slideshow to check pacing`,
  },
  {
    keywords: ['import', 'new', 'photos', 'add', 'more', 'existing', 'album'],
    context: ['album_builder'],
    question: 'How do I import new photos into an existing album?',
    answer: `To add more photos:\n\n1. Open the **Photo Library** panel (left sidebar)\n2. Click **Add Photos** at the top\n3. Select images from your computer or from an existing event\n4. New photos appear in the library — drag them into frames\n\nPhotos added here don't affect the original event gallery.`,
  },

  // ─── Event Gallery (8+) ───
  {
    keywords: ['create', 'new', 'event', 'gallery'],
    context: ['event_gallery', 'dashboard'],
    question: 'How do I create a new event gallery?',
    answer: `To create a new event gallery:\n\n1. Go to **Events** from the dashboard\n2. Click **Create Event**\n3. Fill in: event name, date, type (wedding, portrait, etc.)\n4. Click **Create** — you'll be taken to the gallery editor\n5. Upload photos using the upload button\n\nYour gallery is private by default until you publish it.`,
  },
  {
    keywords: ['upload', 'photos', 'images', 'gallery', 'add'],
    context: ['event_gallery'],
    question: 'How do I upload photos to a gallery?',
    answer: `To upload photos:\n\n1. Open the event gallery\n2. Click the **Upload** button (or drag & drop files)\n3. Select JPEG or PNG files (max 25MB each)\n4. Photos are automatically compressed and optimized\n5. Upload progress shows in the panel\n\n**Tip:** You can upload ZIP files for bulk imports. Duplicates are auto-detected and skipped.`,
  },
  {
    keywords: ['share', 'link', 'send', 'client', 'gallery'],
    context: ['event_gallery', 'gallery_delivery'],
    question: 'How do I share the gallery with my client?',
    answer: `To share your gallery:\n\n1. Open the event gallery\n2. Click the **Share** button in the toolbar\n3. Copy the gallery link\n4. Send it to your client via email, WhatsApp, or any messenger\n\nYou can also set a **PIN code** for extra security, or enable **password protection** in gallery settings.`,
    followUp: 'Want to set up PIN protection for this gallery?',
  },
  {
    keywords: ['download', 'enable', 'disable', 'client', 'allow'],
    context: ['event_gallery'],
    question: 'How do I enable or disable client downloads?',
    answer: `To manage download settings:\n\n1. Open the event gallery\n2. Go to **Settings** (gear icon)\n3. Toggle **Downloads Enabled**\n4. Choose resolution: Web (optimized) or Original (full size)\n5. Optionally set a download password\n\nYou can also allow downloads only for favorited photos.`,
  },
  {
    keywords: ['pin', 'password', 'protect', 'security', 'private'],
    context: ['event_gallery'],
    question: 'How do I set gallery PIN protection?',
    answer: `To protect your gallery with a PIN:\n\n1. Open gallery **Settings**\n2. Find **Gallery Protection**\n3. Enable **PIN Protection**\n4. Enter a 4-6 digit PIN\n5. Save changes\n\nClients will need to enter this PIN before viewing photos. Share the PIN separately from the gallery link for security.`,
  },
  {
    keywords: ['favorites', 'selections', 'how', 'work', 'select'],
    context: ['event_gallery', 'all'],
    question: 'How do favorites and selections work?',
    answer: `**Favorites** let clients mark photos they love:\n\n1. When viewing the gallery, clients tap the heart icon on photos\n2. Favorites are saved to their session\n3. You can view all client favorites in the **Selections** tab\n4. Use favorites to create albums or prepare final deliveries\n\n**Selection Mode** lets clients make a formal selection with a submit button.`,
  },
  {
    keywords: ['view', 'client', 'selected', 'picked', 'chosen'],
    context: ['event_gallery', 'dashboard'],
    question: 'How do I view my client\'s selected photos?',
    answer: `To view client selections:\n\n1. Open the event gallery\n2. Go to the **Selections** tab\n3. See all favorited/selected photos grouped by guest session\n4. You can filter by guest name if multiple people selected\n\nFrom here you can create an album or export the selection list.`,
  },
  {
    keywords: ['reminder', 'nudge', 'client', 'selection', 'send'],
    context: ['event_gallery', 'gallery_delivery'],
    question: 'How do I send a selection reminder to my client?',
    answer: `To remind clients to make their selections:\n\n1. Open the event gallery\n2. Click **Share** → **Send Reminder**\n3. A pre-written reminder message will be prepared\n4. Customize the message if needed\n5. Send via email or copy the link to share manually\n\nThe reminder includes the gallery link and a gentle nudge to select their favorites.`,
  },

  // ─── Dashboard (6+) ───
  {
    keywords: ['manage', 'events', 'list', 'overview'],
    context: ['dashboard'],
    question: 'How do I manage my events?',
    answer: `From the **Dashboard**:\n\n1. Click **Events** in the navigation\n2. See all your events sorted by date\n3. Click any event to open it\n4. Use the search bar to find specific events\n5. Archive old events to keep your list clean\n\nThe overview page shows your most recent events and quick stats.`,
  },
  {
    keywords: ['analytics', 'stats', 'views', 'statistics'],
    context: ['dashboard'],
    question: 'How do I view studio analytics?',
    answer: `To view your analytics:\n\n1. Go to **Analytics** from the dashboard sidebar\n2. See gallery views, downloads, and favorites over time\n3. Check which galleries are most popular\n4. View client engagement metrics\n\nAnalytics update in real-time as clients interact with your galleries.`,
  },
  {
    keywords: ['domain', 'custom', 'connect', 'website', 'url'],
    context: ['dashboard', 'domains', 'settings'],
    question: 'How do I connect a custom domain?',
    answer: `To connect a custom domain:\n\n1. Go to **Domains** in dashboard settings\n2. Click **Add Custom Domain**\n3. Enter your domain (e.g. photos.yourstudio.com)\n4. Add the DNS records shown to your domain provider\n5. Click **Verify** — verification may take up to 48 hours\n\nYour Mirror AI website will then be accessible at your custom domain.`,
  },
  {
    keywords: ['profile', 'branding', 'logo', 'studio', 'name', 'update'],
    context: ['dashboard', 'settings'],
    question: 'How do I update my profile and branding?',
    answer: `To update your studio profile:\n\n1. Go to **Profile** in the sidebar\n2. Update your studio name, bio, and contact info\n3. Upload your logo and cover image\n4. For advanced branding, go to **Website Editor** to customize colors, fonts, and layout`,
  },
  {
    keywords: ['pricing', 'subscription', 'plan', 'billing', 'upgrade'],
    context: ['dashboard', 'settings'],
    question: 'How do I manage my subscription?',
    answer: `To manage your subscription:\n\n1. Go to **Profile** → **Billing**\n2. See your current plan and usage\n3. Upgrade or downgrade as needed\n4. Update payment method\n\nYour storage usage and photo limits are shown on the dashboard overview.`,
  },
  {
    keywords: ['navigate', 'find', 'where', 'menu', 'help'],
    context: ['dashboard', 'all'],
    question: 'How do I navigate Mirror AI?',
    answer: `**Mirror AI Navigation:**\n\n- **Overview** — Dashboard home with quick stats\n- **Events** — Create and manage photo galleries\n- **Website** — Edit your portfolio website\n- **Cheetah** — AI-powered photo culling\n- **Clients** — Manage client access\n- **Analytics** — View engagement stats\n- **Profile** — Update your studio info\n\nOn mobile, use the bottom navigation bar. The **More** tab shows additional options.`,
  },

  // ─── General (6+) ───
  {
    keywords: ['what', 'mirror', 'ai', 'about', 'platform'],
    context: ['all'],
    question: 'What is Mirror AI?',
    answer: `**Mirror AI** is a premium photography SaaS platform designed for professional photographers.\n\nKey features:\n- 📸 **Gallery Delivery** — Share beautiful galleries with clients\n- 📚 **Album Builder** — Design print-ready albums\n- ⚡ **Cheetah AI** — Smart photo culling\n- 🌐 **Portfolio Website** — Build your online presence\n- 👥 **Client Management** — Track selections and deliveries\n\nEverything you need to run your photography business, in one place.`,
  },
  {
    keywords: ['contact', 'support', 'help', 'team', 'reach'],
    context: ['all'],
    question: 'How do I contact support?',
    answer: `For support:\n\n1. Use this chat — I can help with most questions!\n2. Report bugs using the bug report flow (just say "report a bug")\n3. Email: support@mirrorai.studio\n\nOur team typically responds within 24 hours.`,
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
    answer: `**Keyboard Shortcuts:**\n\n- **Ctrl/Cmd + Z** — Undo\n- **Ctrl/Cmd + Y** — Redo\n- **Delete/Backspace** — Remove selected item\n- **Arrow Keys** — Reposition selected element\n- **Ctrl/Cmd + S** — Save (where applicable)\n- **Esc** — Close panel or deselect\n\nShortcuts work in the Album Builder and Gallery Editor.`,
  },
  {
    keywords: ['switch', 'event', 'between', 'change'],
    context: ['all'],
    question: 'How do I switch between events?',
    answer: `To switch between events:\n\n1. Click **Events** in the sidebar\n2. Select the event you want to work on\n3. Or use the search bar at the top to find a specific event by name\n\nYour work is auto-saved, so you can safely switch at any time.`,
  },
  {
    keywords: ['logout', 'sign out', 'switch', 'account'],
    context: ['all'],
    question: 'How do I logout or switch accounts?',
    answer: `To sign out:\n\n1. Click your **profile avatar** in the top-right corner\n2. Select **Sign Out**\n\nOn mobile, go to **More** → **Sign Out**.\n\nTo switch accounts, sign out first, then sign in with a different email.`,
  },
];

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
  const lower = message.toLowerCase();

  let bestMatch: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    // Check context
    const contextMatch =
      entry.context.includes('all') || entry.context.includes(pageContext);
    if (!contextMatch) continue;

    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }

    if (score >= 2 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  return bestMatch;
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
