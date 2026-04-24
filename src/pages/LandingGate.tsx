import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
const CreateFeedPostModal = lazy(() => import("@/components/CreateFeedPostModal"));
const EditFeedPostModal = lazy(() => import("@/components/EditFeedPostModal"));
const CreateEventModal = lazy(() => import("@/components/CreateEventModal").then(m => ({ default: m.CreateEventModal })));
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Menu, Share, Plus, ChevronLeft } from "lucide-react";

interface FeedPost {
  id: string;
  title: string;
  caption: string | null;
  content: string | null;
  imageUrl: string | null;
  location: string | null;
  contentType: "post" | "blog";
  galleryImages: string[];
  date: string;
}

interface EventRow {
  id: string;
  name: string;
  slug: string | null;
  cover_url: string | null;
  event_date: string | null;
  photo_count: number | null;
  location: string | null;
}

interface Stats {
  events: number;
  photos: number;
  clients: number;
  revenue: number;
}

const RITUAL_LINES = [
  "Mirror never lies.",
  "Every gallery, a story.",
  "The light remembers.",
  "What is seen, stays.",
  "A frame, then forever.",
];

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [stats, setStats] = useState<Stats>({ events: 0, photos: 0, clients: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("Studio");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [readingPost, setReadingPost] = useState<FeedPost | null>(null);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: prof } = await (supabase.from("profiles").select("studio_name, username") as any)
      .eq("user_id", user.id).maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);
    let slug = prof?.username || null;
    if (!slug) {
      const { data: dom } = await (supabase.from("domains").select("subdomain") as any)
        .eq("user_id", user.id).maybeSingle();
      slug = dom?.subdomain || null;
    }
    setFeedSlug(slug);

    // Events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, name, slug, cover_url, event_date, photo_count, location")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const evRows = (eventsData || []) as EventRow[];
    setEvents(evRows);

    // Stats
    const evtIds = evRows.map((e) => e.id);
    let photoCount = 0;
    if (evtIds.length > 0) {
      const { count } = await supabase
        .from("photos")
        .select("id", { count: "exact", head: true })
        .in("event_id", evtIds);
      photoCount = count || 0;
    }

    let clientsCount = 0;
    let revenueAmt = 0;
    try {
      const { count: cc } = await (supabase
        .from("clients")
        .select("id", { count: "exact", head: true }) as any)
        .eq("user_id", user.id);
      clientsCount = cc || 0;
    } catch { /* table optional */ }

    try {
      const { data: bookings } = await (supabase
        .from("bookings")
        .select("amount, created_at") as any)
        .eq("photographer_id", user.id);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      revenueAmt = (bookings || [])
        .filter((b: any) => b.created_at >= monthStart)
        .reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
    } catch { /* table optional */ }

    setStats({
      events: evRows.length,
      photos: photoCount,
      clients: clientsCount,
      revenue: revenueAmt,
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleShare = async () => {
    const feedUrl = feedSlug ? `${window.location.origin}/feed/${feedSlug}` : window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ title: profileName, url: feedUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Link copied");
    }
  };

  if (readingPost) {
    return <BlogReader post={readingPost} onClose={() => setReadingPost(null)} />;
  }

  // Greeting based on hour
  const hour = new Date().getHours();
  const greetingTime =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long",
  });

  // Subtitle from event counts
  const subtitleParts: string[] = [];
  if (events.length > 0) subtitleParts.push(`${events.length} event${events.length === 1 ? "" : "s"} on the books.`);
  if (stats.photos > 0) subtitleParts.push(`${stats.photos.toLocaleString("en-IN")} photos in the library.`);
  const subtitle = subtitleParts.length > 0
    ? subtitleParts.join(" ")
    : "A quiet day to catch up.";

  // Ritual line — deterministic per day
  const dayIdx = Math.floor(Date.now() / 86400000) % RITUAL_LINES.length;
  const ritual = RITUAL_LINES[dayIdx];

  // Format helpers
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase() : "—";
  const fmtRevenue = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="w-full min-h-screen bg-[#EFEDE8]">
      {/* ─── TOP NAV ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-12 px-4 bg-white/80 backdrop-blur-md border-b border-[var(--rule)]"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <button
          onClick={drawer.toggle}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 bg-transparent border-0 cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-[var(--ink)]" strokeWidth={1.5} />
        </button>
        {/* Wordmark — Mirror AI brand */}
        <span className="font-serif text-[18px] font-normal text-[var(--ink)] inline-flex items-center gap-2 tracking-[-0.01em]">
          Mirror AI
          <span className="w-[3px] h-[3px] bg-[var(--ink)] rounded-full" />
        </span>
        <button
          onClick={handleShare}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 bg-transparent border-0 cursor-pointer"
          aria-label="Share"
        >
          <Share className="w-[18px] h-[18px] text-[var(--ink-muted)]" strokeWidth={1.5} />
        </button>
      </nav>

      {/* ─── SPECIMEN CONTAINER ─────────────────────────────────── */}
      <div className="pt-12 pb-32 md:pb-24">
        <div className="max-w-[1080px] mx-auto bg-white md:border md:border-[var(--rule)] md:my-10">
          {/* ─── DASH FRAGMENT ───────────────────────────────────── */}
          <div className="px-6 md:px-14 pt-8 md:pt-14 pb-8 md:pb-14">
            <h1 className="font-serif font-light text-[32px] md:text-[44px] leading-[1.08] tracking-[-0.02em] text-[var(--ink)] mb-9 md:mb-12">
              {today}
            </h1>

            {/* ─── STAT ROW ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 py-6 md:py-7 border-t border-b border-[var(--rule)] mb-10 md:mb-12">
              <StatCell label="Events"  value={loading ? "—" : String(stats.events)} hint="this quarter" />
              <StatCell label="Photos"  value={loading ? "—" : stats.photos.toLocaleString("en-IN")} hint="in library" />
              <StatCell label="Clients" value={loading ? "—" : String(stats.clients)} />
              <StatCell label="Revenue" value={loading ? "—" : fmtRevenue(stats.revenue)} hint="this month" />
            </div>

            {/* Recent Events preview removed — full list lives in /dashboard/events */}

            {/* ─── ACTIONS ROW ────────────────────────────────────── */}
            <div className="mt-10 md:mt-12 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCreateEventOpen(true)}
                className="flex-1 md:flex-none bg-[var(--ink)] text-white border-0 px-6 py-3.5 text-[12px] font-medium tracking-[0.08em] uppercase cursor-pointer hover:opacity-90 transition-opacity"
              >
                New event
              </button>
              <button
                onClick={() => navigate("/dashboard/events")}
                className="flex-1 md:flex-none bg-transparent text-[var(--ink)] border border-[var(--rule-strong)] px-6 py-3 text-[12px] font-medium tracking-[0.02em] cursor-pointer hover:border-[var(--ink)] transition-colors"
              >
                Open events
              </button>
              <span className="hidden md:inline text-[12px] text-[var(--ink-whisper)]">
                or press <span className="font-mono">⌘ N</span>
              </span>
            </div>
          </div>

          {/* ─── RITUAL LINE ─────────────────────────────────────── */}
          <div className="border-t border-[var(--rule)] px-6 md:px-14 py-10 md:py-14">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--ink-muted)] mb-5">
              Today's ritual
            </p>
            <p className="font-serif italic font-light text-[26px] md:text-[40px] leading-[1.3] tracking-[-0.01em] text-[var(--ink)] max-w-[720px]">
              {ritual}
            </p>
          </div>

          {/* ─── FOOTER ──────────────────────────────────────────── */}
          <div className="border-t border-[var(--rule)] px-6 md:px-14 py-8 flex justify-between items-baseline">
            <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-[var(--ink-muted)]">
              {profileName}
            </p>
            <p className="font-serif italic text-[14px] text-[var(--ink-whisper)]">
              Every gallery, a story.
            </p>
          </div>
        </div>
      </div>

      {/* ─── FAB ────────────────────────────────────────────────── */}
      <button
        onClick={() => setCreateEventOpen(true)}
        className="fixed right-5 md:right-8 w-14 h-14 rounded-full bg-[var(--ink)] flex items-center justify-center cursor-pointer z-50 hover:opacity-90 transition-opacity border-0 shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
        style={{ bottom: mob ? "calc(72px + env(safe-area-inset-bottom, 0px))" : "32px" }}
        aria-label="Create event"
      >
        <Plus className="w-5 h-5 text-white" strokeWidth={2} />
      </button>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      {mob && <MobileBottomNav />}
      <Suspense fallback={null}>
        {createPostOpen && (
          <CreateFeedPostModal open={createPostOpen} onOpenChange={setCreatePostOpen} onCreated={() => loadData()} />
        )}
        {createEventOpen && (
          <CreateEventModal
            open={createEventOpen}
            onOpenChange={setCreateEventOpen}
            onCreated={(id) => navigate(`/dashboard/events/${id}`)}
          />
        )}
        {editPost && editOpen && (
          <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={() => loadData()} />
        )}
      </Suspense>
    </div>
  );
}

/* ─── Stat cell ───────────────────────────────────────────────── */
function StatCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-[9px] md:text-[10px] font-medium tracking-[0.08em] uppercase text-[var(--ink-muted)] mb-3">
        {label}
      </p>
      <p className="text-[22px] md:text-[26px] font-medium text-[var(--ink)] tracking-[-0.02em] num leading-none">
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-[var(--ink-whisper)] mt-2">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ─── Blog reader overlay ─────────────────────────────────────── */
function BlogReader({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const dateStr = new Date(post.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const paragraphs = (post.content || "").split("\n").filter(Boolean);

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--paper)] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-4 py-3 flex items-center border-b border-[var(--rule)]">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] uppercase text-[var(--ink-muted)] bg-transparent border-0 cursor-pointer hover:text-[var(--ink)]"
        >
          <ChevronLeft size={14} strokeWidth={1.5} /> Back
        </button>
      </div>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-auto max-h-[60vh] object-cover block" loading="lazy" decoding="async" />
      )}

      <div className="max-w-[720px] mx-auto px-5 pt-8 pb-24">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[var(--ink-muted)] mb-3">
          {dateStr}{post.location ? ` · ${post.location}` : ""}
        </p>
        <h1 className="font-serif font-light text-[32px] md:text-[44px] leading-[1.1] tracking-[-0.02em] text-[var(--ink)] mb-5">
          {post.title}
        </h1>
        {post.caption && (
          <p className="font-serif italic font-light text-[18px] md:text-[20px] text-[var(--ink-muted)] leading-[1.5] mb-7">
            {post.caption}
          </p>
        )}
        {paragraphs.map((para, i) => (
          <p key={i} className="text-[15px] text-[var(--ink)] leading-[1.85] mb-5">
            {para}
          </p>
        ))}
        {post.galleryImages.length > 0 && (
          <div className="mt-8 space-y-1.5">
            {post.galleryImages.map((url, i) => (
              <img key={i} src={url} alt="" loading="lazy" className="w-full block" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
