import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { colors, fonts } from "@/styles/design-tokens";

/* ── Individual masonry photo with fade-in on load ── */
function MasonryPhoto({ url, index, mob, onOpen }: { url: string; index: number; mob: boolean; onOpen: (i: number) => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ breakInside: "avoid", marginBottom: mob ? 6 : 8 }}>
      <div
        onClick={() => onOpen(index)}
        style={{
          overflow: "hidden",
          cursor: "pointer",
          background: "#F5F5F5",
          minHeight: 120,
          position: "relative",
        }}
      >
        {!loaded && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(110deg, #F5F5F5 30%, #ECECEC 50%, #F5F5F5 70%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }} />
        )}
        <img
          src={url}
          alt=""
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

interface FeedItem {
  id: string;
  type: "event" | "post";
  title: string;
  caption: string | null;
  imageUrl: string | null;
  location: string | null;
  date: string;
  photoCount?: number;
}

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("MIRROR AI");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [showFeedMenu, setShowFeedMenu] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadPhotos = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: prof } = await (supabase.from("profiles").select("studio_name, username") as any)
      .eq("user_id", user.id).maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);

    // Resolve feed slug: username → subdomain fallback
    let slug = prof?.username || null;
    if (!slug) {
      const { data: dom } = await (supabase.from("domains").select("subdomain") as any)
        .eq("user_id", user.id).maybeSingle();
      slug = dom?.subdomain || null;
    }
    setFeedSlug(slug);

    // Get all events
    const { data: events } = await supabase
      .from("events")
      .select("id, cover_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const evtIds = (events || []).map((e: any) => e.id);
    const allUrls: string[] = [];

    for (const evt of events || []) {
      if (evt.cover_url) allUrls.push(evt.cover_url);
    }

    if (evtIds.length > 0) {
      const { data: photoData } = await supabase
        .from("photos")
        .select("url")
        .in("event_id", evtIds)
        .order("created_at", { ascending: false })
        .limit(100);

      for (const p of photoData || []) {
        const url = p.url;
        if (url && !allUrls.includes(url)) allUrls.push(url);
      }
    }

    setPhotos(allUrls);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

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

  /* ── Share feed link ── */
  const handleShare = async () => {
    const baseUrl = window.location.origin;
    const feedUrl = feedSlug ? `${baseUrl}/feed/${feedSlug}` : baseUrl;
    const shareData = {
      title: profileName,
      text: `Check out ${profileName}'s photography portfolio`,
      url: feedUrl,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(feedUrl);
        toast.success("Feed link copied to clipboard");
      } catch {
        toast.error("Could not copy link");
      }
    }
  };

  /* ── Preview public feed ── */
  const handlePreviewFeed = () => {
    if (feedSlug) {
      window.open(`/feed/${feedSlug}`, "_blank");
    } else {
      toast("Set up your username in Settings → Profile to get your public feed link");
    }
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF" }}>
      {/* ── Header ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "white",
          borderBottom: "1px solid #f0f0f0",
          padding: mob ? "14px 16px" : "18px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={drawer.toggle}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              padding: 4,
              cursor: "pointer",
              color: "#1A1A1A",
            }}
          >
            ☰
          </button>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: mob ? 18 : 24,
              fontWeight: 300,
              letterSpacing: "0.1em",
              color: "#1A1A1A",
            }}
          >
            {profileName.toUpperCase()}
          </h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Share button */}
            <button
              onClick={handleShare}
              title="Share your feed"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
            {/* More / Feed menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowFeedMenu(!showFeedMenu)}
                title="Feed options"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1A1A">
                  <circle cx="12" cy="5" r="1.5"/>
                  <circle cx="12" cy="12" r="1.5"/>
                  <circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              {showFeedMenu && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 50 }}
                    onClick={() => setShowFeedMenu(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 36,
                      zIndex: 60,
                      background: "white",
                      borderRadius: 12,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      border: "1px solid #EEEEEE",
                      minWidth: 200,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => { setShowFeedMenu(false); handleShare(); }}
                      style={menuItemStyle}
                    >
                      <span style={{ fontSize: 16, width: 24 }}>🔗</span>
                      <span>Copy Feed Link</span>
                    </button>
                    <button
                      onClick={() => { setShowFeedMenu(false); handlePreviewFeed(); }}
                      style={menuItemStyle}
                    >
                      <span style={{ fontSize: 16, width: 24 }}>👁</span>
                      <span>Preview Public Feed</span>
                    </button>
                    <div style={{ height: 1, background: "#F0F0F0" }} />
                    <button
                      onClick={() => { setShowFeedMenu(false); navigate("/dashboard/website-editor"); }}
                      style={menuItemStyle}
                    >
                      <span style={{ fontSize: 16, width: 24 }}>✏️</span>
                      <span>Edit Feed & Portfolio</span>
                    </button>
                    <button
                      onClick={() => { setShowFeedMenu(false); navigate("/dashboard/branding"); }}
                      style={menuItemStyle}
                    >
                      <span style={{ fontSize: 16, width: 24 }}>🎨</span>
                      <span>Brand & Style</span>
                    </button>
                    <div style={{ height: 1, background: "#F0F0F0" }} />
                    <button
                      onClick={() => { setShowFeedMenu(false); navigate("/dashboard/events"); }}
                      style={menuItemStyle}
                    >
                      <span style={{ fontSize: 16, width: 24 }}>📸</span>
                      <span>Manage Events</span>
                    </button>
                    <button
                      onClick={() => { setShowFeedMenu(false); navigate("/dashboard/profile"); }}
                      style={menuItemStyle}
                    >
                      <span style={{ fontSize: 16, width: 24 }}>⚙️</span>
                      <span>Feed Settings</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed info bar ── */}
      {!loading && photos.length > 0 && (
        <div
          style={{
            padding: mob ? "12px 16px" : "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F5F5F5",
          }}
        >
          <div>
            <p style={{
              fontFamily: fonts.display,
              fontSize: mob ? 20 : 26,
              fontWeight: 300,
              color: "#1A1A1A",
              lineHeight: 1.2,
            }}>
              Your Feed
            </p>
            <p style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: "#999999",
              marginTop: 2,
            }}>
              {photos.length} photos • {feedSlug ? "Public" : "Set username to go public"}
            </p>
          </div>
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "#1A1A1A",
              color: "white",
              border: "none",
              borderRadius: 20,
              cursor: "pointer",
              fontFamily: fonts.body,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            SHARE
          </button>
        </div>
      )}

      {/* ── Gallery Content ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "16px 8px" : "24px 24px" }}>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <p style={{ fontFamily: fonts.display, fontSize: 18, color: "#CCCCCC", fontStyle: "italic" }}>
                Loading gallery…
              </p>
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p style={{ fontFamily: fonts.display, fontSize: 24, color: "#999999" }}>No photos yet</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: "#AAAAAA", marginTop: 8 }}>
                Create an event and upload photos to see them here
              </p>
              <button
                onClick={() => navigate("/dashboard/events")}
                style={{
                  marginTop: 24,
                  padding: "12px 28px",
                  background: "#D4AF37",
                  color: "#1A1A1A",
                  borderRadius: 24,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: fonts.body,
                  fontSize: 14,
                }}
              >
                Create First Event
              </button>
            </div>
          ) : (
            <div
              style={{
                columnCount: mob ? 2 : window.innerWidth >= 1024 ? 4 : 3,
                columnGap: mob ? 6 : window.innerWidth >= 1024 ? 12 : 8,
              }}
            >
              {photos.map((url, i) => (
                <MasonryPhoto key={i} url={url} index={i} mob={mob} onOpen={openLightbox} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.98)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: "fixed",
              top: 12,
              right: 16,
              zIndex: 310,
              width: 40,
              height: 40,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              color: "white",
              fontSize: 24,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
          <img
            src={photos[lightboxIdx]}
            alt=""
            style={{
              maxHeight: "85vh",
              maxWidth: "95vw",
              objectFit: "contain",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 32,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 24px",
              zIndex: 310,
            }}
          >
            <button
              onClick={prevPhoto}
              style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 18,
                border: "none",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <span
              style={{
                color: "white",
                fontSize: 14,
                background: "rgba(0,0,0,0.4)",
                padding: "4px 12px",
                borderRadius: 20,
                fontFamily: fonts.body,
              }}
            >
              {lightboxIdx + 1} / {photos.length}
            </span>
            <button
              onClick={nextPhoto}
              style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 18,
                border: "none",
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <MobileBottomNav />

      <CreateFeedPostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => loadPhotos()}
      />
      {editPost && (
        <EditFeedPostModal
          open={editOpen}
          onOpenChange={setEditOpen}
          post={{
            id: editPost.id,
            title: editPost.title,
            caption: editPost.caption || "",
            imageUrl: editPost.imageUrl || "",
            location: editPost.location || "",
          }}
          onSaved={() => loadPhotos()}
        />
      )}
    </div>
  );
}

/* ── Shared menu item style ── */
const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "12px 16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  color: "#1A1A1A",
  textAlign: "left" as const,
  transition: "background 0.15s ease",
};
