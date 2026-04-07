import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Menu, Share, Plus } from "lucide-react";

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

  const [photos, setPhotos] = useState<string[]>([]);
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
    const allUrls: string[] = [];
    for (const evt of events || []) { if (evt.cover_url) allUrls.push(evt.cover_url); }
    if (evtIds.length > 0) {
      const { data: photoData } = await supabase
        .from("photos").select("url")
        .in("event_id", evtIds)
        .order("created_at", { ascending: false }).limit(100);
      for (const p of photoData || []) {
        if (p.url && !allUrls.includes(p.url)) allUrls.push(p.url);
      }
    }
    setPhotos(allUrls);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextPhoto = () => setLightboxIdx((i) => (i + 1) % photos.length);
  const prevPhoto = () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, photos.length]);

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

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "hsl(45, 14%, 97%)" }}>
      {/* Minimal floating header */}
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

      {/* Full-bleed continuous scroll — no tabs, no labels */}
      <div style={{ paddingTop: 48, paddingBottom: 80 }}>
        {loading ? (
          <div style={{ columns: mob ? 2 : 3, columnGap: 6 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, height: 180 + (i % 3) * 60, background: "hsl(40, 5%, 93%)" }} />
            ))}
          </div>
        ) : !hasContent ? (
          <div style={{ textAlign: "center", padding: "120px 24px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
              Your first gallery awaits
            </p>
          </div>
        ) : (
          <div style={{ columns: mob ? 2 : 3, columnGap: 6 }}>
            {photos.map((url, i) => (
              <div
                key={i}
                style={{ breakInside: "avoid", marginBottom: 6, overflow: "hidden", cursor: "pointer" }}
                onClick={() => openLightbox(i)}
              >
                <img
                  src={url}
                  alt=""
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.98)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <button onClick={closeLightbox}
            style={{ position: "fixed", top: 12, right: 16, zIndex: 310, width: 40, height: 40, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", color: "white", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
          <img src={photos[lightboxIdx]} alt="" style={{ maxHeight: "85vh", maxWidth: "95vw", objectFit: "contain" }} />
          <div style={{ position: "absolute", bottom: 32, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", zIndex: 310 }}>
            <button onClick={prevPhoto} style={lightboxBtnStyle}>‹</button>
            <span style={{ color: "white", fontSize: 13, fontFamily: "'DM Sans', sans-serif", opacity: 0.5 }}>
              {lightboxIdx + 1} / {photos.length}
            </span>
            <button onClick={nextPhoto} style={lightboxBtnStyle}>›</button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed", bottom: mob ? 76 : 32, right: mob ? 20 : 32,
          width: 56, height: 56, borderRadius: "50%",
          background: "hsl(40, 52%, 48%)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px hsla(40, 52%, 48%, 0.3)", zIndex: 50,
        }}
      >
        <Plus style={{ width: 22, height: 22, color: "hsl(45, 14%, 97%)" }} strokeWidth={2} />
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
          ← Back
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

const lightboxBtnStyle: React.CSSProperties = {
  width: 40, height: 40, background: "rgba(255,255,255,0.15)", borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "white", fontSize: 18, border: "none", cursor: "pointer",
};
