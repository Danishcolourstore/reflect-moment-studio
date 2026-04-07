import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { PublicPhotoLightbox } from "@/components/PublicPhotoLightbox";
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
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0.9 }}
      animate={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed", left: x - 28, top: y - 28,
        width: 56, height: 56, pointerEvents: "none", zIndex: 100,
      }}
    >
      <Heart style={{ width: 56, height: 56, color: "hsl(var(--primary))", fill: "hsl(var(--primary))" }} />
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
      // Double tap detected
      if (!favs.has(photoId)) {
        toggle(photoId);
      }
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const id = burstIdRef.current++;
      setHeartBursts(prev => [...prev, { id, x: cx, y: cy }]);
      lastTapRef.current = { time: 0, photoId: "" };
    } else {
      lastTapRef.current = { time: now, photoId };
    }
  }, [favs, toggle]);

  const removeBurst = useCallback((id: number) => {
    setHeartBursts(prev => prev.filter(b => b.id !== id));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(45, 14%, 97%)" }}>
        <div style={{ padding: "80px 0 0", display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ width: "100%", aspectRatio: "3/2", background: "hsl(40, 5%, 93%)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ aspectRatio: "1/1", background: "hsl(40, 5%, 93%)" }} />
            <div style={{ aspectRatio: "1/1", background: "hsl(40, 5%, 93%)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(45, 14%, 97%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", color: "hsl(35, 4%, 56%)" }}>Gallery not found</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "hsl(45, 14%, 97%)" }}>
      <SiteHead
        title={`${gallery.name} | ${profile?.studio_name || "Photography"}`}
        ogTitle={`${gallery.name} — ${profile?.studio_name || "Photography"}`}
        ogImage={gallery.cover_url}
      />

      {/* Gallery title */}
      <div style={{ textAlign: "center", padding: "40px 16px 16px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "hsl(48, 7%, 10%)", letterSpacing: "0.02em" }}>
          {gallery.name}
        </h1>
      </div>

      {/* Editorial rhythm grid */}
      {photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 16px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
            No photos in this gallery
          </p>
        </div>
      ) : (
        <div style={{ paddingBottom: favCount > 0 ? 80 : 40 }}>
          <EditorialRhythmGrid
            photos={photos}
            onPhotoClick={(idx) => {
              // Only open lightbox if not a double-tap
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
                  {/* Subtle favorite dot indicator */}
                  {isFav && (
                    <div style={{
                      position: "absolute", bottom: 8, right: 8, zIndex: 2,
                      width: 6, height: 6, borderRadius: "50%",
                      background: "hsl(var(--primary))",
                      boxShadow: "0 0 4px hsl(var(--primary) / 0.4)",
                    }} />
                  )}
                  {/* Heart button — visible on hover/touch */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(photo.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      position: "absolute", top: 8, right: 8, zIndex: 3,
                      width: 32, height: 32,
                      background: "hsla(0, 0%, 0%, 0.15)", backdropFilter: "blur(8px)",
                      border: "none", borderRadius: "50%", display: "flex",
                      alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <Heart style={{
                      width: 14, height: 14,
                      color: isFav ? "hsl(var(--primary))" : "hsla(0, 0%, 100%, 0.85)",
                      fill: isFav ? "hsl(var(--primary))" : "none",
                      transition: "all 0.2s",
                    }} />
                  </button>
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
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setDrawerOpen(true)}
            style={{
              position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
              zIndex: 50, display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", background: "hsl(48, 7%, 10%)",
              border: "none", borderRadius: 40, cursor: "pointer",
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <Heart style={{ width: 14, height: 14, color: "hsl(var(--primary))", fill: "hsl(var(--primary))" }} />
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: 14,
              color: "hsl(45, 14%, 97%)", letterSpacing: "0.02em",
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.3)" }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 70,
                background: "hsl(45, 14%, 97%)", borderTop: "1px solid hsl(37, 10%, 90%)",
                borderRadius: "16px 16px 0 0", maxHeight: "70vh",
                display: "flex", flexDirection: "column",
              }}
            >
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: "hsl(37, 10%, 85%)" }} />
              </div>

              {/* Header */}
              <div style={{ padding: "8px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "hsl(48, 7%, 10%)", margin: 0 }}>
                    Your Selections
                  </h3>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(35, 4%, 56%)", marginTop: 2 }}>
                    {favCount} {favCount === 1 ? "photo" : "photos"}
                  </p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X style={{ width: 18, height: 18, color: "hsl(35, 4%, 56%)" }} />
                </button>
              </div>

              {/* Grid */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                  {favPhotos.map(p => (
                    <div key={p.id} style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", borderRadius: 4 }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      {/* Remove button */}
                      <button
                        onClick={() => toggle(p.id)}
                        style={{
                          position: "absolute", top: 3, right: 3, width: 18, height: 18,
                          borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                          border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", opacity: 0.7, transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                      >
                        <X style={{ width: 10, height: 10, color: "white" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "12px 20px 24px", display: "flex", gap: 8, borderTop: "1px solid hsl(37, 10%, 90%)" }}>
                {gallery.downloads_enabled && (
                  <button
                    onClick={() => { toast("Download started"); setDrawerOpen(false); }}
                    style={{
                      flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: "transparent", border: "1px solid hsl(37, 10%, 85%)",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.06em",
                      color: "hsl(48, 7%, 10%)", cursor: "pointer", transition: "background 0.2s",
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
                    background: "hsl(48, 7%, 10%)", border: "none",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.06em",
                    color: "hsl(45, 14%, 97%)", cursor: "pointer", transition: "opacity 0.2s",
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
        <PublicPhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
          showDownload={gallery.downloads_enabled}
          favorites={favs}
          onToggleFavorite={toggle}
        />
      )}
    </div>
  );
}

/* ── Inline send overlay — minimal, one action ── */
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
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 380, background: "hsl(45, 14%, 97%)",
          border: "1px solid hsl(37, 10%, 90%)", padding: 24,
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "hsl(var(--primary) / 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}>
              <Heart style={{ width: 24, height: 24, color: "hsl(var(--primary))", fill: "hsl(var(--primary))" }} />
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "hsl(48, 7%, 10%)", margin: 0 }}>
              Selections sent
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(35, 4%, 56%)", marginTop: 4 }}>
              {photoIds.length} photos shared with your photographer
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 20, height: 40, padding: "0 24px", background: "hsl(48, 7%, 10%)",
                color: "hsl(45, 14%, 97%)", border: "none", fontFamily: "'DM Sans', sans-serif",
                fontSize: 12, letterSpacing: "0.06em", cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 400, color: "hsl(48, 7%, 10%)", margin: "0 0 4px" }}>
              Send Selections
            </h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "hsl(35, 4%, 56%)", margin: "0 0 16px" }}>
              {photoIds.length} photos · Your photographer will be notified
            </p>
            {/* Thumbnail strip */}
            <div style={{ display: "flex", gap: 3, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
              {photos.slice(0, 8).map(p => (
                <img key={p.id} src={p.url} alt="" style={{ width: 48, height: 48, objectFit: "cover", flexShrink: 0 }} loading="lazy" />
              ))}
              {photos.length > 8 && (
                <div style={{ width: 48, height: 48, flexShrink: 0, background: "hsl(40, 5%, 93%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 10, color: "hsl(35, 4%, 56%)" }}>+{photos.length - 8}</span>
                </div>
              )}
            </div>
            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(35, 4%, 56%)" }}>Your Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Your name"
                  style={{
                    width: "100%", height: 40, marginTop: 4, padding: "0 12px",
                    border: "1px solid hsl(37, 10%, 88%)", background: "white",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "hsl(35, 4%, 56%)" }}>Your Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@email.com"
                  style={{
                    width: "100%", height: 40, marginTop: 4, padding: "0 12px",
                    border: "1px solid hsl(37, 10%, 88%)", background: "white",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "hsl(48, 7%, 10%)",
                    outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                style={{
                  height: 44, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "hsl(48, 7%, 10%)", color: "hsl(45, 14%, 97%)", border: "none",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.06em",
                  cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1,
                  transition: "opacity 0.2s",
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
