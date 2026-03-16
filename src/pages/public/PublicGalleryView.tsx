import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { PublicPhotoLightbox } from "@/components/PublicPhotoLightbox";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { siteOwnerId } = useSiteContext();
  const { profile } = useSiteProfile();
  const [gallery, setGallery] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const { favs, toggle } = useFavorites(id);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      (supabase.from("events").select("id, name, event_date, photo_count, downloads_enabled, cover_url").eq("id", id).maybeSingle() as any),
      (supabase.from("photos").select("id, url").eq("event_id", id).order("sort_order", { ascending: true }).limit(500) as any),
    ]).then(([gRes, pRes]: any) => {
      setGallery(gRes.data);
      setPhotos((pRes.data || []) as Photo[]);
      setLoading(false);
    });
  }, [id]);

  const displayPhotos = showFavsOnly ? photos.filter(p => favs.has(p.id)) : photos;
  const favCount = photos.filter(p => favs.has(p.id)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-40 mx-auto" />
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 mt-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="mb-4 rounded-lg" style={{ height: `${200 + (i % 3) * 80}px` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-[#1A1A1A]/50" style={{ fontFamily: "Inter, sans-serif" }}>Gallery not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 sm:px-6 py-12 sm:py-16">
      <SiteHead
        title={`${gallery.name} | ${profile?.studio_name || "Photography"}`}
        ogTitle={`${gallery.name} — ${profile?.studio_name || "Photography"}`}
        ogImage={gallery.cover_url}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {gallery.name}
          </h1>
          <p className="text-sm text-[#1A1A1A]/50 mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
            {gallery.event_date && new Date(gallery.event_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {" · "}
            {photos.length} photos
          </p>
        </div>

        {/* Favorites filter */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setShowFavsOnly(false)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ease-out ${
              !showFavsOnly
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#E8E0D4]/50 text-[#1A1A1A]/60 hover:bg-[#E8E0D4]"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            All
          </button>
          <button
            onClick={() => setShowFavsOnly(true)}
            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ease-out flex items-center gap-1.5 ${
              showFavsOnly
                ? "bg-[#1A1A1A] text-white"
                : "bg-[#E8E0D4]/50 text-[#1A1A1A]/60 hover:bg-[#E8E0D4]"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            <Heart className="w-3.5 h-3.5" />
            Favorites
            {favCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-[#C9A96E] text-white text-[10px] font-medium px-1.5">
                {favCount}
              </span>
            )}
          </button>
        </div>

        {/* Masonry Grid */}
        {displayPhotos.length === 0 ? (
          <p className="text-center text-[#1A1A1A]/40 py-12" style={{ fontFamily: "Inter, sans-serif" }}>
            {showFavsOnly ? "No favorites yet — tap the heart on photos you love" : "No photos in this gallery"}
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {displayPhotos.map((photo) => {
              const realIndex = photos.findIndex(p => p.id === photo.id);
              const isFav = favs.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className="relative mb-4 break-inside-avoid group cursor-pointer rounded-lg overflow-hidden"
                  onClick={() => setLightboxIndex(realIndex)}
                >
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className="w-full block transition-all duration-300 ease-out group-hover:scale-[1.02]"
                    style={{ backgroundColor: "#E8E0D4" }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  {/* Heart button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(photo.id); }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out text-white/80 hover:text-white"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
