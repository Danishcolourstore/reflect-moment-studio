import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
const CinematicLightbox = lazy(() => import("@/components/lightbox").then(m => ({ default: m.CinematicLightbox })));
import { EditorialRhythmGrid } from "@/components/EditorialRhythmGrid";
import { supabase } from "@/integrations/supabase/client";
import { Heart, X, Download, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Photo {
  id: string;
  url: string;
}

function useFavorites(galleryId: string | undefined) {
  const key = `mirrorai_favorites_${galleryId}`;
  const [favs, setFavs] = useState<Set<string>>(() => {
    if (!galleryId) return new Set();
    try {
      const stored = localStorage.getItem(key);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggle = useCallback((id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (galleryId) localStorage.setItem(key, JSON.stringify([...next]));
      return next;
    });
  }, [galleryId, key]);

  return { favs, toggle };
}

/* ── Heart burst animation on double-tap ── */
function HeartBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0.85 }}
      animate={{ scale: 1.1, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed", left: x - 24, top: y - 24,
        width: 48, height: 48, pointerEvents: "none", zIndex: 100,
      }}
    >
      <Heart style={{ width: 48, height: 48, color: "#1A1A1A", fill: "#1A1A1A" }} />
    </motion.div>
  );
}

export default function PublicGalleryView() {
  const { id } = useParams<{ id: string }>();
  const galleryId = id;
  const { siteOwnerId } = useSiteContext();
  const { profile } = useSiteProfile();
  const [gallery, setGallery] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { favs, toggle } = useFavorites(galleryId);

  // Heart burst state
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const burstIdRef = useRef(0);

  // Double-tap tracking
  const lastTapRef = useRef<{ time: number; photoId: string }>({ time: 0, photoId: "" });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);

  // Title fade on scroll
  const [titleOpacity, setTitleOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setTitleOpacity(Math.max(0, 1 - y / 120));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!galleryId) return;
    Promise.all([
      (supabase.from("events").select("id, name, event_date, photo_count, downloads_enabled, cover_url").eq("id", galleryId).maybeSingle() as any),
      (supabase.from("photos").select("id, url").eq("event_id", galleryId).order("sort_order", { ascending: true }).limit(500) as any),
    ]).then(([gRes, pRes]: any) => {
      setGallery(gRes.data);
      setPhotos((pRes.data || []) as Photo[]);
      setLoading(false);
    });
  }, [galleryId]);

  const favCount = photos.filter(p => favs.has(p.id)).length;
  const favPhotos = photos.filter(p => favs.has(p.id));

  const handleDoubleTap = useCallback((photoId: string, e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const last = lastTapRef.current;
    if (now - last.time < 400 && last.photoId === photoId) {
      if (!favs.has(photoId)) {
        toggle(photoId);
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const bId = burstIdRef.current++;
      setHeartBursts(prev => [...prev, { id: bId, x: cx, y: cy }]);
      lastTapRef.current = { time: 0, photoId: "" };
    } else {
      lastTapRef.current = { time: now, photoId };
    }
  }, [favs, toggle]);

  const removeBurst = useCallback((bId: number) => {
    setHeartBursts(prev => prev.filter(b => b.id !== bId));
  }, []);

  /* Loading skeleton — immersive, edge-to-edge */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>
        <div style={{ width: "100%", aspectRatio: "3/2", background: "hsl(40, 5%, 93%)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 32 }}>
          <div style={{ aspectRatio: "1/1", background: "hsl(40, 5%, 93%)" }} />
          <div style={{ aspectRatio: "1/1", background: "hsl(40, 5%, 93%)" }} />
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", color: "#6E6E6E" }}>Gallery not found</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8" }}>
      <SiteHead
        title={`${gallery.name} | ${profile?.studio_name || "Photography"}`}
        ogTitle={`${gallery.name} — ${profile?.studio_name || "Photography"}`}
        ogImage={gallery.cover_url}
      />

      {/* Gallery title — fades on scroll, minimal */}
      <div
        style={{
          textAlign: "center",
          padding: "40px 16px 16px",
          opacity: titleOpacity,
          transition: "opacity 0.1s",
          pointerEvents: titleOpacity < 0.1 ? "none" : "auto",
        }}
      >
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 22,
          fontWeight: 300,
          color: "#1A1917",
          letterSpacing: "0.02em",
          margin: 0,
        }}>
          {gallery.name}
        </h1>
      </div>

      {/* Editorial rhythm grid — edge-to-edge, immersive */}
      {photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 16px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", color: "#C4C1BB", fontWeight: 300 }}>
            No photos in this gallery
          </p>
        </div>
      ) : (
        <div style={{ paddingBottom: favCount > 0 ? 80 : 40 }}>
          <EditorialRhythmGrid
            photos={photos}
            onPhotoClick={(idx) => {
              const now = Date.now();
              const last = lastTapRef.current;
              if (now - last.time < 400 && last.photoId === photos[idx].id) return;
              setTimeout(() => {
                if (Date.now() - lastTapRef.current.time > 350 || lastTapRef.current.photoId !== photos[idx].id) {
                  setLightboxIndex(idx);
                }
              }, 300);
            }}
            renderOverlay={(photo) => {
              const isFav = favs.has(photo.id);
              return (
                <>
                  {/* Double-tap target */}
                  <div
                    onClick={(e) => handleDoubleTap(photo.id, e)}
                    style={{ position: "absolute", inset: 0, zIndex: 1 }}
                  />
                  {/* Subtle favorite dot — bottom-right, 6px */}
                  {isFav && (
                    <div style={{
                      position: "absolute", bottom: 8, right: 8, zIndex: 2,
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#1A1A1A",
                    }} />
                  )}
                </>
              );
            }}
          />
        </div>
      )}

      {/* Heart burst animations */}
      {heartBursts.map(b => (
        <HeartBurst key={b.id} x={b.x} y={b.y} onDone={() => removeBurst(b.id)} />
      ))}

      {/* ── Floating favorites pill ── */}
      <AnimatePresence>
        {favCount > 0 && !drawerOpen && lightboxIndex === null && (
          <motion.button
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setDrawerOpen(true)}
            style={{
              position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
              zIndex: 50, display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", background: "#1A1917",
              border: "none", cursor: "pointer",
            }}
          >
            <Heart style={{ width: 13, height: 13, color: "#1A1A1A", fill: "#1A1A1A" }} />
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
              color: "#FAFAF8", letterSpacing: "0.02em",
            }}>
              {favCount} {favCount === 1 ? "selection" : "selections"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Favorites drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.2)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
                background: "#FAFAF8", borderTop: "1px solid #E8E6E1",
                maxHeight: "70vh", display: "flex", flexDirection: "column",
              }}
            >
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 32, height: 4, background: "#E8E6E1" }} />
              </div>

              {/* Header */}
              <div style={{ padding: "8px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1917", margin: 0 }}>
                    Your Selections
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6E6E6E", marginTop: 2 }}>
                    {favCount} {favCount === 1 ? "photo" : "photos"}
                  </p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
                  <X style={{ width: 16, height: 16, color: "#6E6E6E" }} />
                </button>
              </div>

              {/* Grid */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                  {favPhotos.map(p => (
                    <div key={p.id} style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      <button
                        onClick={() => toggle(p.id)}
                        style={{
                          position: "absolute", top: 3, right: 3, width: 18, height: 18,
                          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)",
                          border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <X style={{ width: 10, height: 10, color: "white" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "12px 16px 24px", display: "flex", gap: 8, borderTop: "1px solid #E8E6E1" }}>
                {gallery.downloads_enabled && (
                  <button
                    onClick={() => { toast("Download started"); setDrawerOpen(false); }}
                    style={{
                      flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: "transparent", border: "1px solid #E8E6E1",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.06em",
                      color: "#1A1917", cursor: "pointer",
                    }}
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    Download All
                  </button>
                )}
                <button
                  onClick={() => { setSendOpen(true); setDrawerOpen(false); }}
                  style={{
                    flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: "#1A1917", border: "none",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.06em",
                    color: "#FAFAF8", cursor: "pointer",
                  }}
                >
                  <Send style={{ width: 13, height: 13 }} />
                  Send Selections
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Send selections overlay ── */}
      <AnimatePresence>
        {sendOpen && (
          <SendSelectionsOverlay
            eventId={galleryId!}
            photoIds={[...favs]}
            photos={favPhotos}
            onClose={() => setSendOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <CinematicLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          open={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          canDownload={gallery.downloads_enabled}
          isFavorite={(id) => favs.has(id)}
          toggleFavorite={toggle}
        />
      )}
    </div>
  );
}

/* ── Send overlay ── */
function SendSelectionsOverlay({ eventId, photoIds, photos, onClose }: {
  eventId: string;
  photoIds: string[];
  photos: Photo[];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSending(true);
    try {
      const { data: sel } = await (supabase.from("guest_selections" as any).insert({
        event_id: eventId,
        guest_name: name.trim(),
        guest_email: email.trim(),
      } as any).select("id").single() as any);
      if (sel) {
        const inserts = photoIds.map(pid => ({ selection_id: (sel as any).id, photo_id: pid }));
        await (supabase.from("guest_selection_photos" as any).insert(inserts as any) as any);
      }
      try {
        await supabase.functions.invoke("send-favorites-notification", {
          body: { event_id: eventId, guest_name: name.trim(), guest_email: email.trim(), photo_count: photoIds.length },
        });
      } catch {}
      setSent(true);
    } catch {
      toast.error("Could not send — try again");
    }
    setSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 380, background: "#FAFAF8",
          border: "1px solid #E8E6E1", padding: 24,
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "rgba(184,149,63,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}>
              <Heart style={{ width: 24, height: 24, color: "#1A1A1A", fill: "#1A1A1A" }} />
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1917", margin: 0 }}>
              Selections sent
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6E6E6E", marginTop: 4 }}>
              {photoIds.length} photos shared with your photographer
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 20, height: 40, padding: "0 24px", background: "#1A1917",
                color: "#FAFAF8", border: "none", fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, letterSpacing: "0.06em", cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "#1A1917", margin: "0 0 4px" }}>
              Send Selections
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6E6E6E", margin: "0 0 16px" }}>
              {photoIds.length} photos · Your photographer will be notified
            </p>
            <div style={{ display: "flex", gap: 3, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
              {photos.slice(0, 8).map(p => (
                <img key={p.id} src={p.url} alt="" style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0 }} loading="lazy" />
              ))}
              {photos.length > 8 && (
                <div style={{ width: 48, height: 48, flexShrink: 0, background: "hsl(40, 5%, 93%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, color: "#6E6E6E" }}>+{photos.length - 8}</span>
                </div>
              )}
            </div>
            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <input
                  value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  style={{
                    width: "100%", height: 40, padding: "0 0 0 2px",
                    border: "none", borderBottom: "1px solid #E8E6E1", background: "transparent",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1A1917",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#1A1917")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#E8E6E1")}
                />
              </div>
              <div>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Your email"
                  style={{
                    width: "100%", height: 40, padding: "0 0 0 2px",
                    border: "none", borderBottom: "1px solid #E8E6E1", background: "transparent",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1A1917",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "#1A1917")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#E8E6E1")}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                style={{
                  height: 44, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "#1A1917", color: "#FAFAF8", border: "none",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.06em",
                  cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {sending ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 13, height: 13 }} />}
                {sending ? "Sending…" : "Send Selections"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
