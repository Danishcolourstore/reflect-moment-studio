import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ChevronDown, ChevronLeft, ChevronRight, X, Download } from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
interface EventData {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  cover_url: string | null;
  gallery_pin: string | null;
  gallery_password: string | null;
  downloads_enabled: boolean;
  is_published: boolean;
  user_id: string;
}

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
  section: string | null;
  sort_order: number | null;
}

interface StudioProfile {
  studio_name: string;
  studio_logo_url: string | null;
}

interface Chapter {
  name: string;
  photos: Photo[];
}

/* ─── Mock Data for Demo ─── */
const MOCK_CHAPTERS = ["Getting Ready", "Ceremony", "Portraits", "Reception"];

function generateMockPhotos(): Chapter[] {
  const widths = [800, 900, 1000, 1100, 1200];
  const heights = [600, 700, 800, 900, 1000, 1200];
  let id = 0;
  return MOCK_CHAPTERS.map((name) => ({
    name,
    photos: Array.from({ length: 10 }, () => {
      id++;
      const w = widths[id % widths.length];
      const h = heights[id % heights.length];
      return {
        id: `mock-${id}`,
        url: `https://picsum.photos/seed/mirrorai${id}/${w}/${h}`,
        file_name: `photo-${id}.jpg`,
        section: name,
        sort_order: id,
      };
    }),
  }));
}

/* ─── Favorites Hook ─── */
function useFavorites(eventId: string | undefined) {
  const key = `mirrorai_fav_${eventId}`;
  const [favs, setFavs] = useState<Set<string>>(() => {
    if (!eventId) return new Set();
    try {
      const s = localStorage.getItem(key);
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggle = useCallback(
    (id: string) => {
      setFavs((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        if (eventId) localStorage.setItem(key, JSON.stringify([...next]));
        return next;
      });
    },
    [eventId, key]
  );

  return { favs, toggle, count: favs.size };
}

/* ─── Password Gate ─── */
function PasswordGate({
  eventName,
  eventDate,
  onUnlock,
}: {
  eventName: string;
  eventDate: string;
  onUnlock: () => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, accept any non-empty password
    if (!input.trim()) return;
    // In production, this would verify against the DB
    setError(true);
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ background: "#FAFAF8" }}
    >
      <div className="w-full" style={{ maxWidth: 320 }}>
        <h1
          className="text-center"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28,
            fontWeight: 300,
            color: "#1A1917",
          }}
        >
          {eventName}
        </h1>
        {dateStr && (
          <p
            className="text-center"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#94918B",
              marginTop: 8,
            }}
          >
            {dateStr}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 40 }}>
          <div
            style={{
              animation: shake ? "galleryShake 0.3s ease" : "none",
            }}
          >
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(false);
              }}
              placeholder="Enter password"
              autoFocus
              className="w-full outline-none"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#1A1917",
                textAlign: "center",
                background: "transparent",
                border: "none",
                borderBottom: `1px solid ${error ? "#A3553A" : "#E8E6E1"}`,
                padding: "12px 0",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                if (!error)
                  e.currentTarget.style.borderBottomColor = "#1A1917";
              }}
              onBlur={(e) => {
                if (!error)
                  e.currentTarget.style.borderBottomColor = "#E8E6E1";
              }}
            />
          </div>
          {error && (
            <p
              className="text-center"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: "#A3553A",
                marginTop: 8,
              }}
            >
              Incorrect password
            </p>
          )}

          <button
            type="submit"
            className="w-full"
            style={{
              marginTop: 24,
              background: "#1A1917",
              color: "#FAFAF8",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "14px 0",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            View Gallery
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Hero Section ─── */
function HeroSection({
  coverUrl,
  eventName,
  eventDate,
  onScrollDown,
}: {
  coverUrl: string;
  eventName: string;
  eventDate: string;
  onScrollDown: () => void;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ height: "100dvh" }}
    >
      <img
        src={coverUrl}
        alt={`${eventName} cover`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
          willChange: "transform",
        }}
        loading="eager"
        decoding="async"
      />

      {/* Bottom left overlay */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 100%)",
          padding: "80px 24px 24px",
        }}
      >
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 300,
            color: "#FFFFFF",
          }}
        >
          {eventName}
        </h1>
        {dateStr && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              opacity: 0.6,
              marginTop: 6,
            }}
          >
            {dateStr}
          </p>
        )}
      </div>

      {/* Scroll indicator */}
      <button
        onClick={onScrollDown}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: 24 }}
        aria-label="Scroll down"
      >
        <ChevronDown
          size={20}
          color="#FFFFFF"
          style={{
            opacity: 0.3,
            animation: "galleryBounce 2s infinite ease-in-out",
          }}
        />
      </button>
    </div>
  );
}

/* ─── Chapter Marker ─── */
function ChapterMarker({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center" style={{ padding: "48px 0 32px" }}>
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#E8E6E1",
        }}
      />
      <h2
        className="text-center"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 18,
          fontWeight: 300,
          color: "#94918B",
          marginTop: 16,
        }}
      >
        {name}
      </h2>
    </div>
  );
}

/* ─── Lazy Image with fade in ─── */
function GalleryImage({
  src,
  alt,
  className,
  style,
  eager,
  onClick,
  onDoubleTap,
  isFavorited,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
  onClick?: () => void;
  onDoubleTap?: () => void;
  isFavorited?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(eager || false);
  const [heartAnim, setHeartAnim] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (eager || visible) return;
    const el = imgRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager, visible]);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      onDoubleTap?.();
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          onClick?.();
          lastTapRef.current = 0;
        }
      }, 300);
    }
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden cursor-pointer ${className || ""}`}
      style={{ background: "#F0EFEB", ...style }}
      onClick={handleClick}
    >
      {visible && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover block"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* Favorite dot indicator */}
      {isFavorited && !heartAnim && (
        <div
          className="absolute"
          style={{
            bottom: 6,
            right: 6,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#B8953F",
          }}
        />
      )}

      {/* Heart animation on double tap */}
      {heartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart
            size={48}
            fill="#B8953F"
            color="#B8953F"
            style={{
              animation: "galleryHeartPop 0.6s ease forwards",
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Editorial Grid Layout ─── */
function EditorialGrid({
  chapters,
  favs,
  onToggleFav,
  onOpenViewer,
  allPhotos,
}: {
  chapters: Chapter[];
  favs: Set<string>;
  onToggleFav: (id: string) => void;
  onOpenViewer: (globalIndex: number) => void;
  allPhotos: Photo[];
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  const getGlobalIndex = (photo: Photo) =>
    allPhotos.findIndex((p) => p.id === photo.id);

  const renderPhotoGroup = (photos: Photo[], startIdx: number) => {
    const groups: React.ReactNode[] = [];
    let i = 0;
    let rowKey = 0;

    while (i < photos.length) {
      const remaining = photos.length - i;
      const pattern = rowKey % 5;

      if (pattern === 0 && remaining >= 1) {
        // Row 1: single full width
        const p = photos[i];
        groups.push(
          <div key={`row-${startIdx}-${rowKey}`} style={{ marginBottom: 24, minHeight: 200 }}>
            <GalleryImage
              src={p.url}
              alt={`Photo from gallery`}
              eager={getGlobalIndex(p) < 6}
              style={{ width: "100%", maxHeight: "70vh", objectFit: "contain", background: "#FAFAF8" }}
              onClick={() => onOpenViewer(getGlobalIndex(p))}
              onDoubleTap={() => onToggleFav(p.id)}
              isFavorited={favs.has(p.id)}
            />
          </div>
        );
        i += 1;
      } else if (pattern === 1 && remaining >= 2) {
        // Row 2: two images
        groups.push(
          <div
            key={`row-${startIdx}-${rowKey}`}
            className="grid grid-cols-2"
            style={{ gap: 4, marginBottom: 4 }}
          >
            {photos.slice(i, i + 2).map((p) => (
              <div key={p.id} className="aspect-[3/2] overflow-hidden">
                <GalleryImage
                  src={p.url}
                  alt="Photo from gallery"
                  className="w-full h-full"
                  eager={getGlobalIndex(p) < 6}
                  onClick={() => onOpenViewer(getGlobalIndex(p))}
                  onDoubleTap={() => onToggleFav(p.id)}
                  isFavorited={favs.has(p.id)}
                />
              </div>
            ))}
          </div>
        );
        i += 2;
      } else if (pattern === 2 && remaining >= 2) {
        // Row 3: two images
        groups.push(
          <div
            key={`row-${startIdx}-${rowKey}`}
            className="grid grid-cols-2"
            style={{ gap: 4, marginBottom: 20 }}
          >
            {photos.slice(i, i + 2).map((p) => (
              <div key={p.id} className="aspect-[3/2] overflow-hidden">
                <GalleryImage
                  src={p.url}
                  alt="Photo from gallery"
                  className="w-full h-full"
                  eager={getGlobalIndex(p) < 6}
                  onClick={() => onOpenViewer(getGlobalIndex(p))}
                  onDoubleTap={() => onToggleFav(p.id)}
                  isFavorited={favs.has(p.id)}
                />
              </div>
            ))}
          </div>
        );
        i += 2;
      } else if (pattern === 3 && remaining >= 3) {
        // Row 4: three images
        groups.push(
          <div
            key={`row-${startIdx}-${rowKey}`}
            className="grid grid-cols-3"
            style={{ gap: 4, marginBottom: 4 }}
          >
            {photos.slice(i, i + 3).map((p) => (
              <div key={p.id} className="aspect-[3/2] overflow-hidden">
                <GalleryImage
                  src={p.url}
                  alt="Photo from gallery"
                  className="w-full h-full"
                  eager={getGlobalIndex(p) < 6}
                  onClick={() => onOpenViewer(getGlobalIndex(p))}
                  onDoubleTap={() => onToggleFav(p.id)}
                  isFavorited={favs.has(p.id)}
                />
              </div>
            ))}
          </div>
        );
        i += 3;
      } else if (pattern === 4 && remaining >= 2) {
        // Row 5: two images
        groups.push(
          <div
            key={`row-${startIdx}-${rowKey}`}
            className="grid grid-cols-2"
            style={{ gap: 4, marginBottom: 20 }}
          >
            {photos.slice(i, i + 2).map((p) => (
              <div key={p.id} className="aspect-[3/2] overflow-hidden">
                <GalleryImage
                  src={p.url}
                  alt="Photo from gallery"
                  className="w-full h-full"
                  eager={getGlobalIndex(p) < 6}
                  onClick={() => onOpenViewer(getGlobalIndex(p))}
                  onDoubleTap={() => onToggleFav(p.id)}
                  isFavorited={favs.has(p.id)}
                />
              </div>
            ))}
          </div>
        );
        i += 2;
      } else {
        // Remaining: show individually
        const p = photos[i];
        groups.push(
          <div key={`row-${startIdx}-${rowKey}`} style={{ marginBottom: 24 }}>
            <GalleryImage
              src={p.url}
              alt="Photo from gallery"
              eager={getGlobalIndex(p) < 6}
              style={{ width: "100%" }}
              onClick={() => onOpenViewer(getGlobalIndex(p))}
              onDoubleTap={() => onToggleFav(p.id)}
              isFavorited={favs.has(p.id)}
            />
          </div>
        );
        i += 1;
      }
      rowKey++;
    }

    return groups;
  };

  return (
    <div ref={contentRef} style={{ background: "#FFFFFF" }}>
      {chapters.map((chapter, ci) => (
        <div key={chapter.name} id={`chapter-${ci}`}>
          <ChapterMarker name={chapter.name} />
          <div className="px-4 md:px-6" style={{ maxWidth: 1200, margin: "0 auto" }}>
            {renderPhotoGroup(chapter.photos, ci * 100)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Chapter Nav (right edge, scroll-aware) ─── */
function ChapterNav({
  chapters,
  activeIndex,
  onSelect,
}: {
  chapters: Chapter[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = () => {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 1500);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-3 hidden min-[375px]:flex"
      style={{
        right: 8,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {chapters.map((ch, i) => (
        <button
          key={ch.name}
          className="flex items-center gap-2"
          onClick={() => onSelect(i)}
          style={{ minHeight: 24 }}
          aria-label={`Go to ${ch.name}`}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 8,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: i === activeIndex ? "#1A1917" : "#D4D1CB",
              transition: "color 0.2s ease",
            }}
          >
            {ch.name}
          </span>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: i === activeIndex ? "#B8953F" : "#E8E6E1",
              transition: "background 0.2s ease",
              flexShrink: 0,
            }}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Image Viewer (fullscreen) ─── */
function ImageViewer({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  favs,
  onToggleFav,
  downloadsEnabled,
}: {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  favs: Set<string>;
  onToggleFav: (id: string) => void;
  downloadsEnabled: boolean;
}) {
  const [controlsVisible, setControlsVisible] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const touchStartRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const current = photos[currentIndex];
  const isFav = favs.has(current?.id);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Preload adjacent
  useEffect(() => {
    [-1, 1].forEach((d) => {
      const idx = currentIndex + d;
      if (idx >= 0 && idx < photos.length) {
        const img = new Image();
        img.src = photos[idx].url;
      }
    });
  }, [currentIndex, photos]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
      if (e.key === "f" || e.key === "F") onToggleFav(current.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, photos, current, onClose, onNavigate, onToggleFav]);

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap = favorite
      onToggleFav(current.id);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 600);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          // Single tap = toggle controls
          setControlsVisible((v) => {
            if (!v) showControls();
            else setControlsVisible(false);
            return !v;
          });
          lastTapRef.current = 0;
        }
      }, 300);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > 50 && absDx > absDy) {
      if (dx < 0 && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
      if (dx > 0 && currentIndex > 0) onNavigate(currentIndex - 1);
    } else if (dy > 80 && absDy > absDx) {
      onClose();
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(current.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = current.file_name || "photo.jpg";
      a.click();
      URL.revokeObjectURL(url);
      toast("Photo downloaded");
    } catch {
      toast("Download failed");
    }
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "#0A0A0A" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-12 lg:p-16"
        onClick={handleTap}
      >
        <img
          src={current.url}
          alt="Gallery photo"
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Heart animation */}
      {heartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[310]">
          <Heart
            size={48}
            fill="#B8953F"
            color="#B8953F"
            style={{ animation: "galleryHeartPop 0.6s ease forwards" }}
          />
        </div>
      )}

      {/* Controls */}
      <div
        className="absolute inset-0 pointer-events-none z-[305]"
        style={{
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pointer-events-auto">
          <button
            onClick={onClose}
            style={{ minWidth: 44, minHeight: 44 }}
            className="flex items-center justify-center"
            aria-label="Close viewer"
          >
            <X size={20} color="#F5F5F5" />
          </button>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "#94918B",
            }}
          >
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-12 pointer-events-auto"
          style={{ paddingBottom: 32 }}
        >
          <button
            onClick={() => onToggleFav(current.id)}
            style={{ minWidth: 44, minHeight: 44 }}
            className="flex items-center justify-center"
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              size={20}
              color={isFav ? "#B8953F" : "#F5F5F5"}
              fill={isFav ? "#B8953F" : "none"}
            />
          </button>
          {downloadsEnabled && (
            <button
              onClick={handleDownload}
              style={{ minWidth: 44, minHeight: 44 }}
              className="flex items-center justify-center"
              aria-label="Download photo"
            >
              <Download size={20} color="#F5F5F5" />
            </button>
          )}
        </div>

        {/* Desktop arrows */}
        {currentIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-auto"
            onClick={() => onNavigate(currentIndex - 1)}
            style={{ minWidth: 44, minHeight: 44, opacity: 0.3 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.3")}
            aria-label="Previous photo"
          >
            <ChevronLeft size={28} color="#F5F5F5" />
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-auto"
            onClick={() => onNavigate(currentIndex + 1)}
            style={{ minWidth: 44, minHeight: 44, opacity: 0.3 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.3")}
            aria-label="Next photo"
          >
            <ChevronRight size={28} color="#F5F5F5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Favorites Drawer ─── */
function FavoritesDrawer({
  photos,
  favs,
  onToggleFav,
  onClose,
  onOpenViewer,
  allPhotos,
}: {
  photos: Photo[];
  favs: Set<string>;
  onToggleFav: (id: string) => void;
  onClose: () => void;
  onOpenViewer: (globalIndex: number) => void;
  allPhotos: Photo[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const favPhotos = photos.filter((p) => favs.has(p.id));
  const touchStartY = useRef(0);

  const handleSubmit = () => {
    setSubmitted(true);
    toast("Selections submitted to photographer");
  };

  const handleDownloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    toast("Preparing download...");

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let i = 0; i < favPhotos.length; i++) {
        const res = await fetch(favPhotos[i].url);
        const blob = await res.blob();
        zip.file(favPhotos[i].file_name || `photo-${i + 1}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const { saveAs } = await import("file-saver");
      saveAs(content, "favorites.zip");
      toast("Photos downloaded");
    } catch {
      toast("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Drawer */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: "#FFFFFF",
          maxHeight: "85vh",
          borderTop: "1px solid #E8E6E1",
          animation: "galleryDrawerUp 0.2s ease forwards",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (dy > 80) onClose();
        }}
      >
        {/* Handle */}
        <div className="flex justify-center" style={{ padding: "12px 0" }}>
          <div
            style={{
              width: 32,
              height: 4,
              background: "#E8E6E1",
              borderRadius: 2,
            }}
          />
        </div>

        <div style={{ padding: "0 24px 24px" }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: 300,
              color: "#1A1917",
            }}
          >
            Selections
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "#94918B",
              marginTop: 4,
            }}
          >
            {favPhotos.length} photos
          </p>

          {/* Thumbnail grid */}
          <div
            className="grid grid-cols-4"
            style={{ gap: 3, marginTop: 24 }}
          >
            {favPhotos.map((p) => {
              const globalIdx = allPhotos.findIndex((ap) => ap.id === p.id);
              return (
                <div
                  key={p.id}
                  className="relative aspect-square cursor-pointer group"
                  style={{ overflow: "hidden" }}
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenViewer(globalIdx), 200);
                  }}
                >
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFav(p.id);
                    }}
                    aria-label="Remove from favorites"
                  >
                    <X size={12} color="#F5F5F5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ marginTop: 24 }}>
            <button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitted}
              style={{
                background: "#1A1917",
                color: "#FAFAF8",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "14px 0",
                border: "none",
                cursor: submitted ? "default" : "pointer",
                opacity: submitted ? 0.5 : 1,
              }}
            >
              {submitted ? "Selections Submitted ✓" : "Submit Selections"}
            </button>

            <button
              className="w-full"
              onClick={handleDownloadAll}
              disabled={downloading}
              style={{
                marginTop: 12,
                background: "transparent",
                color: "#1A1917",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "14px 0",
                border: "1px solid #1A1917",
                cursor: "pointer",
              }}
            >
              {downloading ? "Downloading…" : "Download All"}
            </button>
          </div>
        </div>

        {/* Safe area */}
        <div style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </div>
  );
}

/* ─── Favorites Pill ─── */
function FavoritesPill({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed z-[100] left-1/2 -translate-x-1/2 flex items-center gap-2"
      style={{
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        background: "#FFFFFF",
        border: "1px solid #E8E6E1",
        borderRadius: 24,
        padding: "10px 20px",
        cursor: "pointer",
        animation: "galleryPillUp 0.2s ease forwards",
      }}
      aria-label={`${count} favorites`}
    >
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 14,
          color: "#1A1917",
        }}
      >
        {count} favorite{count !== 1 ? "s" : ""}
      </span>
    </button>
  );
}

/* ─── Gallery Footer ─── */
function GalleryFooter({
  studioName,
  studioLogoUrl,
}: {
  studioName?: string;
  studioLogoUrl?: string | null;
}) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ padding: "64px 24px 40px", background: "#FFFFFF" }}
    >
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 20,
          fontWeight: 300,
          color: "#1A1917",
        }}
      >
        Thank you
      </h3>
      {studioName && (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#94918B",
            marginTop: 8,
          }}
        >
          {studioName}
        </p>
      )}
      {/* Logo removed for minimal feel */}

      <div style={{ marginTop: 48 }}>
        <a
          href="https://mirrorai.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#D4D1CB",
            textDecoration: "none",
          }}
        >
          Powered by MirrorAI
        </a>
      </div>
    </div>
  );
}

/* ─── CSS Keyframes ─── */
const galleryStyles = `
@keyframes galleryShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
}
@keyframes galleryBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
@keyframes galleryHeartPop {
  0% { transform: scale(0.5); opacity: 1; }
  50% { transform: scale(1.2); opacity: 1; }
  70% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}
@keyframes galleryDrawerUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes galleryPillUp {
  from { transform: translate(-50%, 10px); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
@keyframes galleryLoadBar {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}
`;

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ClientGalleryExperience() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<EventData | null>(null);
  const [studioProfile, setStudioProfile] = useState<StudioProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [passwordLocked, setPasswordLocked] = useState(false);
  const [useMock, setUseMock] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);

  const galleryContentRef = useRef<HTMLDivElement>(null);

  // Inject keyframes
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = galleryStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch event data
  useEffect(() => {
    if (!slug) return;

    (async () => {
      const { data } = await (
        supabase.from("events").select("*") as any
      )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (!data) {
        // Use mock data for demo
        setUseMock(true);
        const mockChapters = generateMockPhotos();
        setChapters(mockChapters);
        setPhotos(mockChapters.flatMap((c) => c.photos));
        setEvent({
          id: "mock",
          name: "Emma & James",
          slug: slug || "emma-james",
          event_date: "2026-06-14",
          cover_url: "https://picsum.photos/seed/mirroraicover/1920/1280",
          gallery_pin: null,
          gallery_password: null,
          downloads_enabled: true,
          is_published: true,
          user_id: "mock",
        });
        setLoading(false);
        return;
      }

      const ev = data as unknown as EventData;
      setEvent(ev);
      document.title = `${ev.name} — Gallery`;

      // Check password
      if (ev.gallery_password) {
        const verified = localStorage.getItem(`mirrorai_gallery_pw_verified_${ev.id}`);
        if (verified !== "true") {
          setPasswordLocked(true);
          setLoading(false);
          return;
        }
      }

      // Fetch studio profile
      const { data: profile } = await (
        supabase
          .from("profiles")
          .select("studio_name, studio_logo_url") as any
      )
        .eq("user_id", ev.user_id)
        .maybeSingle();
      if (profile) setStudioProfile(profile as unknown as StudioProfile);

      // Fetch photos
      let allPhotos: Photo[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data: photoData } = await (
          supabase
            .from("photos")
            .select("id, url, file_name, section, sort_order") as any
        )
          .eq("event_id", ev.id)
          .order("sort_order", { ascending: true, nullsFirst: false })
          .range(from, from + PAGE - 1);
        if (!photoData || photoData.length === 0) break;
        allPhotos = allPhotos.concat(photoData as unknown as Photo[]);
        if (photoData.length < PAGE) break;
        from += PAGE;
      }
      setPhotos(allPhotos);

      // Organize into chapters by section
      const sectionMap = new Map<string, Photo[]>();
      allPhotos.forEach((p) => {
        const sec = p.section || "Gallery";
        if (!sectionMap.has(sec)) sectionMap.set(sec, []);
        sectionMap.get(sec)!.push(p);
      });
      const chaps: Chapter[] = [];
      sectionMap.forEach((photos, name) => {
        chaps.push({ name, photos });
      });
      if (chaps.length === 0 && allPhotos.length > 0) {
        chaps.push({ name: "Gallery", photos: allPhotos });
      }
      setChapters(chaps);
      setLoading(false);
    })();
  }, [slug]);

  const { favs, toggle: toggleFav, count: favCount } = useFavorites(event?.id);

  // Track active chapter on scroll
  useEffect(() => {
    if (chapters.length === 0) return;
    const handler = () => {
      for (let i = chapters.length - 1; i >= 0; i--) {
        const el = document.getElementById(`chapter-${i}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            setActiveChapter(i);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [chapters]);

  const scrollToChapter = (index: number) => {
    const el = document.getElementById(`chapter-${index}`);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToGallery = () => {
    galleryContentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const openViewer = (globalIndex: number) => {
    setViewerIndex(globalIndex);
    setViewerOpen(true);
  };

  // Loading
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#FAFAF8" }}
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "#B8953F",
            animation: "galleryLoadBar 1.5s ease infinite",
            overflow: "hidden",
          }}
        >
        </div>
      </div>
    );
  }

  // Not found (shouldn't happen with mock fallback)
  if (notFound || !event) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#FAFAF8" }}
      >
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
            fontWeight: 300,
            color: "#94918B",
          }}
        >
          Gallery not found
        </p>
      </div>
    );
  }

  // Password gate
  if (passwordLocked) {
    return (
      <PasswordGate
        eventName={event.name}
        eventDate={event.event_date}
        onUnlock={() => setPasswordLocked(false)}
      />
    );
  }

  const heroUrl =
    event.cover_url || (photos.length > 0 ? photos[0].url : null);

  return (
    <div style={{ background: "#FFFFFF" }}>
      {/* Hero */}
      {heroUrl && (
        <HeroSection
          coverUrl={heroUrl}
          eventName={event.name}
          eventDate={event.event_date}
          onScrollDown={scrollToGallery}
        />
      )}

      {/* Gallery Content */}
      <div ref={galleryContentRef}>
        <EditorialGrid
          chapters={chapters}
          favs={favs}
          onToggleFav={toggleFav}
          onOpenViewer={openViewer}
          allPhotos={photos}
        />

        <GalleryFooter
          studioName={studioProfile?.studio_name}
          studioLogoUrl={studioProfile?.studio_logo_url}
        />
      </div>

      {/* Chapter Nav */}
      {chapters.length > 1 && (
        <ChapterNav
          chapters={chapters}
          activeIndex={activeChapter}
          onSelect={scrollToChapter}
        />
      )}

      {/* Favorites Pill */}
      {!drawerOpen && !viewerOpen && (
        <FavoritesPill count={favCount} onClick={() => setDrawerOpen(true)} />
      )}

      {/* Favorites Drawer */}
      {drawerOpen && (
        <FavoritesDrawer
          photos={photos}
          favs={favs}
          onToggleFav={toggleFav}
          onClose={() => setDrawerOpen(false)}
          onOpenViewer={openViewer}
          allPhotos={photos}
        />
      )}

      {/* Image Viewer */}
      {viewerOpen && (
        <ImageViewer
          photos={photos}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onNavigate={setViewerIndex}
          favs={favs}
          onToggleFav={toggleFav}
          downloadsEnabled={event.downloads_enabled}
        />
      )}
    </div>
  );
}
