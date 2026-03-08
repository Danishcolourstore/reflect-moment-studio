import { useState, useRef, useEffect } from "react";
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Grid3X3, LayoutGrid } from "lucide-react";

const IG = {
  bg: "#000000",
  surface: "#121212",
  surface2: "#1C1C1C",
  border: "#262626",
  text: "#FAFAFA",
  textSecondary: "#A8A8A8",
  blue: "#0095F6",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;

interface InstagramPreviewProps {
  photos: string[];
  username?: string;
  caption?: string;
  onClose: () => void;
}

export default function InstagramPreview({
  photos,
  username = "photographer",
  caption = "",
  onClose,
}: InstagramPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<"post" | "grid">("post");
  const [viewVisible, setViewVisible] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const swipeStarted = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [detectedRatio, setDetectedRatio] = useState("4/5");

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // IMPROVEMENT 2: Reset to slide 1 whenever a new photo set is loaded
  useEffect(() => {
    setCurrentSlide(0);
  }, [photos]);

  // Detect aspect ratio from first image
  useEffect(() => {
    if (!photos.length) return;
    const img = new window.Image();
    img.onload = () => {
      const r = img.naturalWidth / img.naturalHeight;
      if (r <= 0.85) setDetectedRatio("4/5");
      else if (r >= 1.3) setDetectedRatio("1.91/1");
      else setDetectedRatio("1/1");
    };
    img.src = photos[0];
  }, [photos]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentSlide > 0) goTo(currentSlide - 1);
      if (e.key === "ArrowRight" && currentSlide < photos.length - 1) goTo(currentSlide + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentSlide, photos.length]);

  const goTo = (idx: number) => {
    setIsTransitioning(true);
    setCurrentSlide(idx);
    setSwipeOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const switchViewMode = (mode: "post" | "grid") => {
    if (mode === viewMode) return;
    setViewVisible(false);
    setTimeout(() => {
      setViewMode(mode);
      setViewVisible(true);
    }, 150);
  };

  const handleDoubleTap = () => {
    setLiked(true);
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
    swipeStarted.current = false;
    setIsTransitioning(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientX - touchStartX.current;
    if (!swipeStarted.current) {
      if (Math.abs(delta) < 10) return;
      swipeStarted.current = true;
    }
    // IMPROVEMENT 1: Prevent vertical page scroll during horizontal swipe
    e.preventDefault();
    touchDelta.current = delta;
    if ((currentSlide === 0 && delta > 0) || (currentSlide === photos.length - 1 && delta < 0)) {
      setSwipeOffset(delta * 0.3);
    } else {
      setSwipeOffset(delta);
    }
  };

  const onTouchEnd = () => {
    const threshold = 60;
    if (touchDelta.current < -threshold && currentSlide < photos.length - 1) {
      goTo(currentSlide + 1);
    } else if (touchDelta.current > threshold && currentSlide > 0) {
      goTo(currentSlide - 1);
    } else {
      setIsTransitioning(true);
      setSwipeOffset(0);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  if (photos.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.95)", fontFamily: IG.font }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[60] h-9 w-9 rounded-full flex items-center justify-center transition-all"
        style={{ background: "rgba(250,250,250,0.1)", color: IG.textSecondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(250,250,250,0.2)";
          e.currentTarget.style.color = IG.text;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(250,250,250,0.1)";
          e.currentTarget.style.color = IG.textSecondary;
        }}
      >
        <X className="h-4 w-4" />
      </button>

      {/* Mode toggle */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex rounded-full p-0.5"
        style={{ background: IG.surface2 }}
      >
        <button
          onClick={() => switchViewMode("post")}
          className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
          style={{
            background: viewMode === "post" ? IG.text : "transparent",
            color: viewMode === "post" ? IG.bg : IG.textSecondary,
            fontFamily: IG.font,
          }}
        >
          Post
        </button>
        <button
          onClick={() => switchViewMode("grid")}
          className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all"
          style={{
            background: viewMode === "grid" ? IG.text : "transparent",
            color: viewMode === "grid" ? IG.bg : IG.textSecondary,
            fontFamily: IG.font,
          }}
        >
          Grid
        </button>
      </div>

      {/* Fade wrapper */}
      <div
        className="w-full flex justify-center mx-4 transition-opacity duration-150"
        style={{ opacity: viewVisible ? 1 : 0 }}
      >
        {viewMode === "post" ? (
          /* ─── Post View ─── */
          <div
            className="w-full max-w-[375px] rounded-[2.5rem] overflow-hidden shadow-2xl"
            style={{ background: IG.bg, border: `1px solid ${IG.border}`, maxHeight: "90vh" }}
          >
            {/* Notch */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-32 h-5 rounded-full" style={{ background: IG.surface2 }} />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 28px)", scrollbarWidth: "none" }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div
                  className="h-8 w-8 rounded-full p-[2px]"
                  style={{ background: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)" }}
                >
                  <div
                    className="h-full w-full rounded-full flex items-center justify-center"
                    style={{ background: IG.bg }}
                  >
                    <span style={{ color: IG.text, fontSize: "9px", fontWeight: 700, fontFamily: IG.font }}>
                      {username[0]?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="truncate"
                    style={{ color: IG.text, fontSize: "14px", fontWeight: 600, fontFamily: IG.font }}
                  >
                    {username}
                  </p>
                </div>
                <MoreHorizontal className="h-5 w-5" style={{ color: IG.text }} />
              </div>

              {/* Carousel */}
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "4/5", background: IG.surface }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onDoubleClick={handleDoubleTap}
              >
                <div
                  className="flex h-full"
                  style={{
                    transform: `translateX(calc(-${currentSlide * 100}% + ${swipeOffset}px))`,
                    transition: isTransitioning ? "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)" : "none",
                    willChange: "transform",
                  }}
                >
                  {photos.map((url, i) => (
                    <div key={i} className="w-full h-full shrink-0 flex items-center justify-center">
                      <img src={url} alt="" className="max-w-full max-h-full object-contain" draggable={false} />
                    </div>
                  ))}
                </div>

                {/* Double-tap heart animation */}
                {showHeart && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Heart
                      className="fill-white text-white drop-shadow-lg"
                      style={{ width: 80, height: 80, animation: "heartPop 0.9s ease-out forwards" }}
                    />
                  </div>
                )}

                {/* Carousel dots */}
                {photos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === currentSlide ? 6 : 5,
                          height: i === currentSlide ? 6 : 5,
                          background: i === currentSlide ? IG.text : "rgba(250,250,250,0.4)",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Slide counter */}
                {photos.length > 1 && (
                  <div
                    className="absolute top-3 right-3 rounded-full px-2.5 py-0.5"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                  >
                    <span style={{ color: IG.text, fontSize: "12px", fontWeight: 500, fontFamily: IG.font }}>
                      {currentSlide + 1}/{photos.length}
                    </span>
                  </div>
                )}

                {/* Desktop nav arrows */}
                {currentSlide > 0 && (
                  <button
                    onClick={() => goTo(currentSlide - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full items-center justify-center transition-all hidden md:flex"
                    style={{ background: "rgba(250,250,250,0.9)", color: "rgba(0,0,0,0.7)" }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {currentSlide < photos.length - 1 && (
                  <button
                    onClick={() => goTo(currentSlide + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full items-center justify-center transition-all hidden md:flex"
                    style={{ background: "rgba(250,250,250,0.9)", color: "rgba(0,0,0,0.7)" }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center px-3 pt-2.5 pb-1">
                <div className="flex items-center gap-4 flex-1">
                  <button onClick={() => setLiked(!liked)} className="transition-transform active:scale-125">
                    <Heart
                      className={`h-6 w-6 transition-colors ${liked ? "fill-red-500 text-red-500" : ""}`}
                      style={liked ? {} : { color: IG.text }}
                    />
                  </button>
                  <MessageCircle className="h-6 w-6" style={{ color: IG.text, transform: "scaleX(-1)" }} />
                  <Send className="h-5 w-5 -rotate-12" style={{ color: IG.text }} />
                </div>
                <button onClick={() => setSaved(!saved)} className="transition-transform active:scale-110">
                  <Bookmark
                    className={`h-6 w-6 transition-colors ${saved ? "fill-white" : ""}`}
                    style={{ color: IG.text }}
                  />
                </button>
              </div>

              {/* Likes */}
              <div className="px-3 pt-1">
                <p style={{ color: IG.text, fontSize: "14px", fontWeight: 600, fontFamily: IG.font }}>
                  {liked ? "1 like" : "0 likes"}
                </p>
              </div>

              {/* Caption */}
              {caption && (
                <div className="px-3 pt-1 pb-4">
                  <p style={{ color: IG.text, fontSize: "14px", lineHeight: "18px", fontFamily: IG.font }}>
                    <span style={{ fontWeight: 600, marginRight: 6 }}>{username}</span>
                    {caption}
                  </p>
                </div>
              )}

              {/* Home indicator */}
              <div className="flex justify-center pb-2 pt-1">
                <div className="w-28 h-1 rounded-full" style={{ background: "rgba(250,250,250,0.3)" }} />
              </div>
            </div>
          </div>
        ) : (
          /* ─── Grid View ─── */
          <div
            className="w-full max-w-[375px] rounded-[2.5rem] overflow-hidden shadow-2xl"
            style={{ background: IG.bg, border: `1px solid ${IG.border}`, maxHeight: "90vh" }}
          >
            {/* Notch */}
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-32 h-5 rounded-full" style={{ background: IG.surface2 }} />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 28px)", scrollbarWidth: "none" }}>
              {/* Profile header */}
              <div className="px-4 pt-2 pb-3">
                <div className="flex items-center gap-6 mb-3">
                  <div
                    className="h-20 w-20 rounded-full shrink-0 p-[3px]"
                    style={{ background: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)" }}
                  >
                    <div
                      className="h-full w-full rounded-full flex items-center justify-center"
                      style={{ background: IG.bg }}
                    >
                      <span style={{ color: IG.text, fontSize: "24px", fontWeight: 700, fontFamily: IG.font }}>
                        {username[0]?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-6 flex-1 justify-center">
                    {[
                      { v: String(photos.length), l: "posts" },
                      { v: "2.4k", l: "followers" },
                      { v: "186", l: "following" },
                    ].map((s) => (
                      <div key={s.l} className="text-center">
                        <p style={{ color: IG.text, fontSize: "16px", fontWeight: 700, fontFamily: IG.font }}>{s.v}</p>
                        <p style={{ color: IG.textSecondary, fontSize: "13px", fontFamily: IG.font }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ color: IG.text, fontSize: "14px", fontWeight: 600, fontFamily: IG.font }}>{username}</p>
                <p style={{ color: IG.textSecondary, fontSize: "14px", fontFamily: IG.font, marginTop: 2 }}>
                  Photographer ✦ Visual Stories
                </p>

                <div className="flex gap-1.5 mt-3">
                  <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: IG.surface2 }}>
                    <span style={{ color: IG.text, fontSize: "13px", fontWeight: 600, fontFamily: IG.font }}>
                      Edit profile
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg py-1.5 text-center" style={{ background: IG.surface2 }}>
                    <span style={{ color: IG.text, fontSize: "13px", fontWeight: 600, fontFamily: IG.font }}>
                      Share profile
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid tabs */}
              <div className="flex" style={{ borderTop: `1px solid ${IG.border}` }}>
                <div className="flex-1 py-2.5 flex justify-center" style={{ borderBottom: `2px solid ${IG.text}` }}>
                  <Grid3X3 className="h-5 w-5" style={{ color: IG.text }} />
                </div>
                <div className="flex-1 py-2.5 flex justify-center">
                  <LayoutGrid className="h-5 w-5" style={{ color: "rgba(250,250,250,0.3)" }} />
                </div>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3" style={{ gap: "2px" }}>
                <div className="relative aspect-square">
                  <img src={photos[0]} alt="" className="h-full w-full object-cover" />
                  {photos.length > 1 && (
                    <div className="absolute top-1.5 right-1.5">
                      <svg
                        className="h-4 w-4 drop-shadow-lg"
                        style={{ color: IG.text }}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="15"
                          height="15"
                          rx="2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <rect
                          x="6"
                          y="6"
                          width="15"
                          height="15"
                          rx="2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square" style={{ background: IG.surface2 }} />
                ))}
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pb-2 pt-3">
                <div className="w-28 h-1 rounded-full" style={{ background: "rgba(250,250,250,0.3)" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Heart pop keyframe */}
      <style>{`
        @keyframes heartPop {
          0%   { transform: scale(0);   opacity: 1; }
          15%  { transform: scale(1.3); opacity: 1; }
          30%  { transform: scale(1.0); opacity: 1; }
          80%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
