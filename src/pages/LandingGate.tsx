import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Menu, Share, Plus, X, ChevronLeft } from "lucide-react";

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

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("Studio");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [readingPost, setReadingPost] = useState<FeedPost | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Scroll-based header
  const [scrolled, setScrolled] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!mob) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mob]);

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

    const { data: events } = await supabase
      .from("events").select("id, cover_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(30);

    const evtIds = (events || []).map((e: any) => e.id);
    const allPhotos: { id: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    for (const evt of events || []) {
      if (evt.cover_url && !seenUrls.has(evt.cover_url)) {
        allPhotos.push({ id: `cover-${evt.id}`, url: evt.cover_url });
        seenUrls.add(evt.cover_url);
      }
    }
    if (evtIds.length > 0) {
      const { data: photoData } = await supabase
        .from("photos").select("id, url")
        .in("event_id", evtIds)
        .order("created_at", { ascending: false }).limit(100);
      for (const p of photoData || []) {
        if (p.url && !seenUrls.has(p.url)) {
          allPhotos.push({ id: p.id, url: p.url });
          seenUrls.add(p.url);
        }
      }
    }
    setPhotos(allPhotos);
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

  // Blog reader overlay
  if (readingPost) {
    return <BlogReader post={readingPost} onClose={() => setReadingPost(null)} />;
  }

  const hasContent = photos.length > 0 || feedPosts.length > 0;
  const gridPhotos = photos;

  /* ── Mobile: Fullscreen native gallery ── */
  if (mob) {
    return (
      <div style={{ width: "100%", minHeight: "100dvh", background: "#0a0a0b", margin: 0, padding: 0, overflowX: "hidden" }}>
        <style>{`
          @keyframes lgFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        {/* Bold overlay header */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60, padding: "0 20px",
          paddingTop: "env(safe-area-inset-top)",
          background: scrolled ? "rgba(10,10,11,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          transition: "background 0.3s ease, backdrop-filter 0.3s ease",
        }}>
          <button onClick={drawer.toggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center", minWidth: 44, minHeight: 44 }}>
            <Menu style={{ width: 24, height: 24, color: "rgba(255,255,255,0.9)" }} strokeWidth={2} />
          </button>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600,
            color: "#fff", letterSpacing: "0.18em", textTransform: "uppercase",
          }}>
            {profileName}
          </span>
          <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center", minWidth: 44, minHeight: 44 }}>
            <Share style={{ width: 20, height: 20, color: "rgba(255,255,255,0.7)" }} strokeWidth={2} />
          </button>
        </nav>

        {loading ? (
          <>
            <div style={{ width: "100%", height: "100svh", background: "#141414" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "3/4", background: "#141414" }} />
              ))}
            </div>
          </>
        ) : !hasContent ? (
          <div style={{
            minHeight: "100dvh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: "0 24px",
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22, fontStyle: "italic", fontWeight: 300,
              color: "rgba(255,255,255,0.3)", textAlign: "center",
            }}>
              Your first gallery awaits
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              style={{
                marginTop: 24, height: 44, padding: "0 28px",
                background: "#1A1A1A", border: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#0a0a0b", cursor: "pointer",
              }}
            >
              Create Event
            </button>
          </div>
        ) : (
          <div style={{ paddingBottom: 72, paddingTop: 72 }}>

            {/* Masonry grid */}
            <div style={{
              columns: 3,
              columnGap: 0,
              padding: 0,
            }}>
              {gridPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  onClick={() => openLightbox(i + 1)}
                  style={{
                    breakInside: "avoid",
                    marginBottom: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={photo.url}
                    alt=""
                    loading={i < 9 ? "eager" : "lazy"}
                    decoding="async"
                    style={{
                      width: "100%",
                      display: "block",
                      animation: "lgFadeIn 0.4s ease both",
                      animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && photos[lightboxIdx] && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
            style={{ position: "fixed", inset: 0, background: "#0A0A0A", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <button onClick={closeLightbox}
              style={{ position: "fixed", top: 16, right: 16, zIndex: 310, background: "none", border: "none", cursor: "pointer", padding: 10, minWidth: 44, minHeight: 44 }}>
              <X style={{ width: 18, height: 18, color: "rgba(255,255,255,0.25)" }} />
            </button>
            <img src={photos[lightboxIdx].url} alt="" style={{ maxHeight: "100vh", maxWidth: "100vw", objectFit: "contain" }} />
            <span style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em" }}>
              {lightboxIdx + 1} / {photos.length}
            </span>
          </div>
        )}

        <DrawerMenu open={drawer.open} onClose={drawer.close} />
        <MobileBottomNav />
        <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadData()} />
        {editPost && (
          <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={() => loadData()} />
        )}
      </div>
    );
  }

  /* ── Desktop: Standard editorial layout ── */
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "hsl(45, 14%, 97%)" }}>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 48, padding: "0 16px",
        background: "hsla(45, 14%, 97%, 0.85)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      }}>
        <button onClick={drawer.toggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}>
          <Menu style={{ width: 18, height: 18, color: "hsl(48, 7%, 10%)" }} strokeWidth={1.5} />
        </button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 400, fontStyle: "italic", color: "hsl(35, 4%, 56%)", letterSpacing: "0.04em" }}>
          {profileName}
        </span>
        <button onClick={handleShare} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}>
          <Share style={{ width: 16, height: 16, color: "hsl(35, 4%, 56%)" }} strokeWidth={1.5} />
        </button>
      </nav>

      <div style={{ paddingTop: 48, paddingBottom: 80 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div style={{ width: "100%", aspectRatio: "3/2", background: "hsl(40, 5%, 93%)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ aspectRatio: "1/1", background: "hsl(40, 5%, 93%)" }} />
              <div style={{ aspectRatio: "1/1", background: "hsl(40, 5%, 93%)" }} />
            </div>
          </div>
        ) : !hasContent ? (
          <div style={{ textAlign: "center", padding: "120px 24px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
              Your first gallery awaits
            </p>
          </div>
        ) : (
          <div style={{ columns: 3, columnGap: 6 }}>
            {photos.map((photo, i) => (
              <div key={photo.id} style={{ breakInside: "avoid", marginBottom: 6, overflow: "hidden", cursor: "pointer" }} onClick={() => openLightbox(i)}>
                <img src={photo.url} alt="" style={{ width: "100%", display: "block" }} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && photos[lightboxIdx] && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          style={{ position: "fixed", inset: 0, background: "#050505", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <button onClick={closeLightbox}
            style={{ position: "fixed", top: 16, right: 16, zIndex: 310, background: "none", border: "none", cursor: "pointer", padding: 10 }}>
            <X style={{ width: 18, height: 18, color: "rgba(255,255,255,0.3)" }} />
          </button>
          <img src={photos[lightboxIdx].url} alt="" style={{ maxHeight: "96vh", maxWidth: "96vw", objectFit: "contain" }} />
          <span style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1em" }}>
            {lightboxIdx + 1} / {photos.length}
          </span>
        </div>
      )}

      {/* FAB — desktop only */}
      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed", bottom: 32, right: 32,
          width: 56, height: 56, borderRadius: "50%",
          background: "#1A1A1A", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(200,169,126,0.3)", zIndex: 50,
        }}
      >
        <Plus style={{ width: 22, height: 22, color: "#0a0a0b" }} strokeWidth={2} />
      </button>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <MobileBottomNav />
      <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadData()} />
      {editPost && (
        <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={() => loadData()} />
      )}
    </div>
  );
}

/* Blog reader overlay */
function BlogReader({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const dateStr = new Date(post.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const paragraphs = (post.content || "").split("\n").filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "hsl(45, 14%, 97%)", overflowY: "auto" }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "hsla(45, 14%, 97%, 0.9)",
        backdropFilter: "blur(12px)", padding: "12px 16px",
        display: "flex", alignItems: "center",
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(35, 4%, 56%)", display: "flex", alignItems: "center", gap: 6 }}>
          <ChevronLeft size={14} strokeWidth={1.5} /> Back
        </button>
      </div>

      {post.imageUrl && (
        <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "auto", maxHeight: "60vh", objectFit: "cover", display: "block" }} />
      )}

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "hsl(35, 4%, 56%)", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {dateStr}{post.location ? ` · ${post.location}` : ""}
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "hsl(48, 7%, 10%)", lineHeight: 1.25, marginBottom: 16 }}>
          {post.title}
        </h1>
        {post.caption && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "hsl(35, 4%, 56%)", fontStyle: "italic", lineHeight: 1.6, marginBottom: 28, borderLeft: "2px solid hsl(37, 10%, 90%)", paddingLeft: 16 }}>
            {post.caption}
          </p>
        )}
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "hsl(48, 7%, 20%)", lineHeight: 1.9, marginBottom: 20 }}>
            {para}
          </p>
        ))}
        {post.galleryImages.length > 0 && (
          <div style={{ margin: "32px 0" }}>
            {post.galleryImages.map((url, i) => (
              <img key={i} src={url} alt="" loading="lazy" style={{ width: "100%", display: "block", marginBottom: 6 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
