import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { PublicPhotoLightbox } from "@/components/PublicPhotoLightbox";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

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

export default function PublicGalleryView() {
  const { id } = useParams<{ id: string }>();
  const galleryId = id;
  const { siteOwnerId } = useSiteContext();
  const { profile } = useSiteProfile();
  const [gallery, setGallery] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const { favs, toggle } = useFavorites(galleryId);

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

  const displayPhotos = showFavsOnly ? photos.filter(p => favs.has(p.id)) : photos;
  const favCount = photos.filter(p => favs.has(p.id)).length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(45, 14%, 97%)" }}>
        <div style={{ columns: 2, columnGap: 6, paddingTop: 48 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ breakInside: "avoid", marginBottom: 6, height: `${200 + (i % 3) * 80}px`, background: "hsl(40, 5%, 93%)" }} />
          ))}
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

      {/* Minimal gallery name — centered, quiet */}
      <div style={{ textAlign: "center", padding: "40px 16px 16px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 300, color: "hsl(48, 7%, 10%)", letterSpacing: "0.02em" }}>
          {gallery.name}
        </h1>
      </div>

      {/* Favorites toggle — only if there are favorites */}
      {favCount > 0 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingBottom: 16 }}>
          <button
            onClick={() => setShowFavsOnly(false)}
            style={{
              padding: "6px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.08em",
              background: !showFavsOnly ? "hsl(48, 7%, 10%)" : "transparent",
              color: !showFavsOnly ? "hsl(45, 14%, 97%)" : "hsl(35, 4%, 56%)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ALL
          </button>
          <button
            onClick={() => setShowFavsOnly(true)}
            style={{
              padding: "6px 16px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: showFavsOnly ? "hsl(48, 7%, 10%)" : "transparent",
              color: showFavsOnly ? "hsl(45, 14%, 97%)" : "hsl(35, 4%, 56%)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Heart style={{ width: 12, height: 12 }} />
            {favCount}
          </button>
        </div>
      )}

      {/* Full-bleed masonry — edge-to-edge, tight gaps */}
      {displayPhotos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 16px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
            {showFavsOnly ? "No favorites yet" : "No photos in this gallery"}
          </p>
        </div>
      ) : (
        <div style={{ columns: 2, columnGap: 6 }}>
          {displayPhotos.map((photo) => {
            const realIndex = photos.findIndex(p => p.id === photo.id);
            const isFav = favs.has(photo.id);
            return (
              <div
                key={photo.id}
                className="group"
                style={{ breakInside: "avoid", marginBottom: 6, position: "relative", overflow: "hidden", cursor: "pointer" }}
                onClick={() => setLightboxIndex(realIndex)}
              >
                <img
                  src={photo.url}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", display: "block", backgroundColor: "hsl(40, 5%, 93%)" }}
                />
                {/* Heart overlay on hover/touch */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(photo.id); }}
                  className="opacity-0 group-hover:opacity-100"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 36,
                    height: 36,
                    background: "hsla(0, 0%, 0%, 0.2)",
                    backdropFilter: "blur(8px)",
                    border: "none",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                >
                  <Heart style={{ width: 14, height: 14, color: isFav ? "hsl(0, 80%, 60%)" : "hsla(0, 0%, 100%, 0.85)", fill: isFav ? "hsl(0, 80%, 60%)" : "none" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

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
