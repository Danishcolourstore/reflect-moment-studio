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

    const { data: prof } = await (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id).maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);

    // Get all events
    const { data: events } = await supabase
      .from("events")
      .select("id, cover_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    const evtIds = (events || []).map((e: any) => e.id);
    const allUrls: string[] = [];

    // Add cover URLs
    for (const evt of events || []) {
      if (evt.cover_url) allUrls.push(evt.cover_url);
    }

    // Get photos from events
    if (evtIds.length > 0) {
      const { data: photoData } = await supabase
        .from("photos")
        .select("thumbnail_url, url")
        .in("event_id", evtIds)
        .order("created_at", { ascending: false })
        .limit(100);

      for (const p of photoData || []) {
        const url = p.thumbnail_url || p.url;
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

  // Keyboard nav for lightbox
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
          padding: mob ? "16px 16px" : "20px 24px",
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
              fontSize: mob ? 20 : 24,
              fontWeight: 300,
              letterSpacing: "0.1em",
              color: "#1A1A1A",
            }}
          >
            {profileName.toUpperCase()}
          </h1>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {/* ── Gallery Content ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "24px 12px" : "32px 24px" }}>
          <h2
            style={{
              fontFamily: fonts.display,
              fontSize: mob ? 24 : 30,
              fontWeight: 300,
              marginBottom: 4,
              color: "#1A1A1A",
            }}
          >
            Welcome
          </h2>
          <p style={{ fontFamily: fonts.body, fontSize: mob ? 14 : 16, color: "#666666", marginBottom: mob ? 24 : 32 }}>
            Your wedding gallery
          </p>

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
                columnGap: mob ? 8 : window.innerWidth >= 1024 ? 16 : 12,
              }}
            >
              {photos.map((url, i) => (
                <div
                  key={i}
                  style={{
                    breakInside: "avoid",
                    marginBottom: mob ? 8 : window.innerWidth >= 1024 ? 16 : 12,
                  }}
                >
                  <div
                    onClick={() => openLightbox(i)}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      loading={i < 6 ? "eager" : "lazy"}
                      decoding="async"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "block",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
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
            image_url: editPost.imageUrl || "",
            location: editPost.location || "",
          }}
          onUpdated={() => loadPhotos()}
        />
      )}
    </div>
  );
}
