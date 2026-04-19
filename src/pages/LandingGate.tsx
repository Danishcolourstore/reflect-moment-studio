import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { CreateEventModal } from "@/components/CreateEventModal";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  Menu, Share, Plus, X, ChevronLeft, ArrowRight,
  Camera, Image as ImageIcon, BookOpen, Globe, Zap,
} from "lucide-react";

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
  views: number;
  leads: number;
}

const QUICK_ACTIONS = [
  { label: "New Event",  icon: Camera,    to: "/dashboard/events",          primary: true  },
  { label: "Upload",     icon: ImageIcon, to: "/dashboard/events",          primary: false },
  { label: "Storybook",  icon: BookOpen,  to: "/dashboard/storybook",       primary: false },
  { label: "Cheetah",    icon: Zap,       to: "/dashboard/cheetah-live",    primary: false },
  { label: "Website",    icon: Globe,     to: "/dashboard/website-builder", primary: false },
];

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [stats, setStats] = useState<Stats>({ events: 0, photos: 0, views: 0, leads: 0 });
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("Studio");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [readingPost, setReadingPost] = useState<FeedPost | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

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

    // Feed posts
    const { data: postsData } = await (supabase.from("feed_posts")
      .select("id, title, caption, content, image_url, location, content_type, gallery_images, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) as any);

    const posts: FeedPost[] = (postsData || []).map((p: any) => ({
      id: p.id, title: p.title, caption: p.caption, content: p.content,
      imageUrl: p.image_url, location: p.location,
      contentType: p.content_type || "post", galleryImages: p.gallery_images || [],
      date: p.created_at,
    }));
    setFeedPosts(posts);

    // Events
    const { data: eventsData } = await supabase
      .from("events")
      .select("id, name, slug, cover_url, event_date, photo_count, location")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const evRows = (eventsData || []) as EventRow[];
    setEvents(evRows);

    // Photos for masonry + count
    const evtIds = evRows.map((e) => e.id);
    const allPhotos: { id: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    for (const evt of evRows) {
      if (evt.cover_url && !seenUrls.has(evt.cover_url)) {
        allPhotos.push({ id: `cover-${evt.id}`, url: evt.cover_url });
        seenUrls.add(evt.cover_url);
      }
    }

    let photoCount = 0;
    if (evtIds.length > 0) {
      const { data: photoData, count } = await supabase
        .from("photos")
        .select("id, url", { count: "exact" })
        .in("event_id", evtIds)
        .order("created_at", { ascending: false })
        .limit(100);
      photoCount = count || 0;
      for (const p of photoData || []) {
        if (p.url && !seenUrls.has(p.url)) {
          allPhotos.push({ id: p.id, url: p.url });
          seenUrls.add(p.url);
        }
      }
    }
    setPhotos(allPhotos);

    // Lightweight stats — best-effort; ignore failures so the page still renders
    let leadsCount = 0;
    let viewsCount = 0;
    try {
      const { count: lc } = await (supabase
        .from("leads")
        .select("id", { count: "exact", head: true }) as any)
        .eq("user_id", user.id);
      leadsCount = lc || 0;
    } catch { /* table optional */ }

    try {
      const { count: vc } = await ((supabase as any)
        .from("gallery_views")
        .select("id", { count: "exact", head: true }))
        .eq("photographer_id", user.id);
      viewsCount = vc || 0;
    } catch { /* table optional */ }

    setStats({
      events: evRows.length,
      photos: photoCount,
      views: viewsCount,
      leads: leadsCount,
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight" && lightboxIdx < photos.length - 1) setLightboxIdx(i => i + 1);
      if (e.key === "ArrowLeft" && lightboxIdx > 0) setLightboxIdx(i => i - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, lightboxIdx, photos.length]);

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

  const heroImage = events.find((e) => e.cover_url)?.cover_url || photos[0]?.url || null;
  const recentEvents = events.slice(0, mob ? 4 : 6);

  return (
    <div className="w-full min-h-screen bg-[var(--paper)]">
      {/* ─── TOP NAV ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-12 px-4 bg-white/85 backdrop-blur border-b border-[var(--rule)]"
        style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
      >
        <button
          onClick={drawer.toggle}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2 bg-transparent border-0 cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-[var(--ink)]" strokeWidth={1.5} />
        </button>
        <span className="font-serif text-[15px] font-normal tracking-[0.2em] uppercase text-[var(--ink)]">
          {profileName}
        </span>
        <button
          onClick={handleShare}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 bg-transparent border-0 cursor-pointer"
          aria-label="Share"
        >
          <Share className="w-[18px] h-[18px] text-[var(--ink-muted)]" strokeWidth={1.5} />
        </button>
      </nav>

      <div className="pt-12 pb-24">
        {/* ─── HERO BLOCK ─────────────────────────────────────────── */}
        <section className="border-b border-[var(--rule)]">
          <div className="max-w-[1280px] mx-auto px-5 md:px-12 py-10 md:py-16">
            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-16 items-center">
              {/* Left: greeting + stats + CTA */}
              <div>
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--ink-muted)] mb-3">
                  Studio
                </p>
                <h1 className="text-[28px] md:text-[40px] leading-[1.1] tracking-tight text-[var(--ink)] font-medium mb-2">
                  Welcome back
                </h1>
                <p className="text-[14px] text-[var(--ink-muted)] mb-8 md:mb-10">
                  Here's what's happening with your studio today.
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
                  <StatCell label="Events" value={stats.events} loading={loading} />
                  <StatCell label="Photos" value={stats.photos} loading={loading} />
                  <StatCell label="Views"  value={stats.views}  loading={loading} />
                  <StatCell label="Leads"  value={stats.leads}  loading={loading} />
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((a) => {
                    const Icon = a.icon;
                    const baseCls =
                      "flex items-center gap-2 h-10 px-4 text-[12px] font-medium tracking-[0.06em] uppercase cursor-pointer transition-colors border";
                    const cls = a.primary
                      ? `${baseCls} bg-[var(--ink)] text-white border-[var(--ink)] hover:bg-black`
                      : `${baseCls} bg-white text-[var(--ink)] border-[var(--rule-strong)] hover:border-[var(--ink)]`;
                    return (
                      <button
                        key={a.label}
                        onClick={() => a.label === "New Event" ? setCreateEventOpen(true) : navigate(a.to)}
                        className={cls}
                      >
                        <Icon className="w-[14px] h-[14px]" strokeWidth={1.75} />
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: hero image */}
              <div className="aspect-[4/5] md:aspect-[4/5] w-full bg-[var(--wash)] overflow-hidden">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt=""
                    className="w-full h-full object-cover block"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-[12px] tracking-[0.15em] uppercase text-[var(--ink-whisper)]">
                      No photos yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ─── RECENT EVENTS ──────────────────────────────────────── */}
        {recentEvents.length > 0 && (
          <section className="border-b border-[var(--rule)]">
            <div className="max-w-[1280px] mx-auto px-5 md:px-12 py-10 md:py-14">
              <div className="flex items-end justify-between mb-6 md:mb-8">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--ink-muted)] mb-2">
                    Recent
                  </p>
                  <h2 className="text-[20px] md:text-[24px] font-medium text-[var(--ink)] tracking-tight">
                    Your events
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/dashboard/events")}
                  className="flex items-center gap-1.5 text-[12px] font-medium tracking-[0.06em] uppercase text-[var(--ink)] hover:opacity-70 bg-transparent border-0 cursor-pointer"
                >
                  View all
                  <ArrowRight className="w-[14px] h-[14px]" strokeWidth={1.75} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                {recentEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                    className="group text-left bg-transparent border-0 p-0 cursor-pointer"
                  >
                    <div className="aspect-[4/5] w-full bg-[var(--wash)] overflow-hidden mb-3">
                      {evt.cover_url ? (
                        <img
                          src={evt.cover_url}
                          alt={evt.name}
                          className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-5 h-5 text-[var(--ink-whisper)]" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-[var(--ink)] truncate">
                      {evt.name || "Untitled event"}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)] tracking-[0.04em] mt-0.5">
                      {evt.event_date
                        ? new Date(evt.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                      {evt.photo_count ? ` · ${evt.photo_count} photos` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── MASONRY GALLERY ────────────────────────────────────── */}
        <section>
          <div className="max-w-[1280px] mx-auto px-5 md:px-12 py-10 md:py-14">
            {photos.length > 0 && (
              <div className="mb-6 md:mb-8">
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--ink-muted)] mb-2">
                  Library
                </p>
                <h2 className="text-[20px] md:text-[24px] font-medium text-[var(--ink)] tracking-tight">
                  Latest frames
                </h2>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-[var(--wash-strong)] skeleton-block" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="py-20 md:py-28 text-center border border-[var(--rule)]">
                <p className="text-[13px] text-[var(--ink-muted)] mb-1">No photos yet</p>
                <p className="text-[11px] tracking-[0.15em] uppercase text-[var(--ink-whisper)] mb-6">
                  Create your first event to begin
                </p>
                <button
                  onClick={() => setCreateEventOpen(true)}
                  className="inline-flex items-center gap-2 h-10 px-5 bg-[var(--ink)] text-white text-[12px] font-medium tracking-[0.06em] uppercase cursor-pointer hover:bg-black transition-colors"
                >
                  <Plus className="w-[14px] h-[14px]" strokeWidth={2} />
                  Create event
                </button>
              </div>
            ) : (
              <div
                className="[column-count:2] md:[column-count:4] [column-gap:8px] md:[column-gap:12px]"
              >
                {photos.map((photo, i) => (
                  <div
                    key={photo.id}
                    onClick={() => openLightbox(i)}
                    className="break-inside-avoid mb-2 md:mb-3 overflow-hidden cursor-pointer bg-[var(--wash)]"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      loading={i < 8 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full block transition-opacity duration-300 hover:opacity-90"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ─── LIGHTBOX ───────────────────────────────────────────── */}
      {lightboxOpen && photos[lightboxIdx] && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          className="fixed inset-0 bg-[var(--obsidian)] z-[300] flex items-center justify-center"
        >
          <button
            onClick={closeLightbox}
            className="fixed top-4 right-4 z-[310] flex items-center justify-center min-w-[44px] min-h-[44px] bg-transparent border-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-[18px] h-[18px] text-white/40" />
          </button>
          <img
            src={photos[lightboxIdx].url}
            alt=""
            className="max-h-screen max-w-[100vw] object-contain"
          />
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] tracking-[0.15em] text-white/30 num">
            {lightboxIdx + 1} / {photos.length}
          </span>
        </div>
      )}

      {/* ─── FAB (mobile too) ───────────────────────────────────── */}
      <button
        onClick={() => setCreateEventOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-5 md:right-8 w-14 h-14 rounded-full bg-[var(--ink)] flex items-center justify-center cursor-pointer z-50 hover:bg-black transition-colors border-0"
        aria-label="Create event"
      >
        <Plus className="w-5 h-5 text-white" strokeWidth={2} />
      </button>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      {mob && <MobileBottomNav />}
      <CreateFeedPostModal open={createPostOpen} onOpenChange={setCreatePostOpen} onCreated={() => loadData()} />
      <CreateEventModal
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        onCreated={(id) => navigate(`/dashboard/events/${id}`)}
      />
      {editPost && (
        <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={() => loadData()} />
      )}
    </div>
  );
}

/* ─── Stat cell ───────────────────────────────────────────────── */
function StatCell({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="border-l border-[var(--rule)] pl-3 md:pl-4 first:border-l-0 first:pl-0">
      <p className="text-[9px] md:text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--ink-muted)] mb-1.5">
        {label}
      </p>
      {loading ? (
        <div className="w-10 h-7 bg-[var(--wash-strong)] skeleton-block" />
      ) : (
        <p className="text-[24px] md:text-[32px] font-medium text-[var(--ink)] leading-none num tracking-tight">
          {value}
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
          className="w-full h-auto max-h-[60vh] object-cover block"
        />
      )}

      <div className="max-w-[720px] mx-auto px-5 pt-8 pb-24">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[var(--ink-muted)] mb-3">
          {dateStr}{post.location ? ` · ${post.location}` : ""}
        </p>
        <h1 className="text-[28px] md:text-[36px] leading-[1.2] font-medium text-[var(--ink)] tracking-tight mb-5">
          {post.title}
        </h1>
        {post.caption && (
          <p className="text-[15px] text-[var(--ink-muted)] leading-[1.6] mb-7 border-l-2 border-[var(--rule)] pl-4">
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
