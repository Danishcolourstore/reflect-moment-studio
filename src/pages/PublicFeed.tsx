import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Design tokens — Naman Verma / pure-black editorial ── */
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS  = '"DM Sans", sans-serif';
const BG    = "#000000";
const WHITE = "#FFFFFF";
const DIM   = "#999999";
const MUTED = "#666666";
const LINE  = "#333333";

/* ── Types ── */
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

interface StudioInfo {
  studioName: string;
  userId: string;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  aboutImageUrl: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
  sectionVisibility: Record<string, boolean>;
  testimonials: { name: string; text: string; event: string }[];
}

const DEFAULT_VIS: Record<string, boolean> = {
  hero: true, galleries: true, stories: true, testimonials: false, about: true, enquire: true,
};

/* ── Row patterns for curated masonry ── */
type RowType = "A" | "B" | "C" | "D";
const ROW_SEQUENCE: RowType[] = ["A", "B", "D", "C", "B", "A", "D", "B", "C"];

function buildRows(images: string[], isMobile: boolean): { type: RowType; images: string[] }[] {
  const rows: { type: RowType; images: string[] }[] = [];
  let idx = 0;
  let seqIdx = 0;

  while (idx < images.length) {
    const type = ROW_SEQUENCE[seqIdx % ROW_SEQUENCE.length];
    const count = type === "A" ? 1 : type === "B" ? 2 : type === "C" ? 3 : 2;
    // On mobile, C and D become single-column
    const mobileCount = (isMobile && (type === "C" || type === "D")) ? 1 : count;
    const needed = isMobile ? mobileCount : count;

    if (idx + needed > images.length) {
      // Take whatever's left as full-width singles
      while (idx < images.length) {
        rows.push({ type: "A", images: [images[idx]] });
        idx++;
      }
      break;
    }

    if (isMobile && (type === "C" || type === "D")) {
      // Stack as individual full-width rows
      for (let i = 0; i < count && idx < images.length; i++) {
        rows.push({ type: "A", images: [images[idx]] });
        idx++;
      }
    } else {
      rows.push({ type, images: images.slice(idx, idx + count) });
      idx += count;
    }
    seqIdx++;
  }
  return rows;
}

/* ── Lazy fade-in image ── */
function LazyImage({ src, alt, style, className, onClick }: {
  src: string; alt?: string; style?: React.CSSProperties; className?: string; onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ background: "#111111", ...style }} className={className} onClick={onClick}>
      {visible && (
        <img
          src={src}
          alt={alt || ""}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease",
          }}
        />
      )}
    </div>
  );
}

/* ── Lightbox ── */
function Lightbox({ images, index, onClose, onNav }: {
  images: string[]; index: number; onClose: () => void; onNav: (i: number) => void;
}) {
  const touchStart = useRef(0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNav(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onNav(Math.min(images.length - 1, index + 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, images.length, onClose, onNav]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: BG,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const diff = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(diff) > 60) {
          if (diff < 0 && index < images.length - 1) onNav(index + 1);
          if (diff > 0 && index > 0) onNav(index - 1);
        }
      }}
    >
      <img
        src={images[index]}
        alt=""
        style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain", transition: "opacity 0.3s ease" }}
      />
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 20, right: 20, background: "none", border: "none",
          color: WHITE, fontSize: 24, cursor: "pointer", padding: 8,
          fontFamily: SANS, fontWeight: 300,
        }}
      >✕</button>
      {/* Counter */}
      <div style={{
        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.1em",
      }}>
        {index + 1} / {images.length}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PUBLIC FEED PAGE
   ════════════════════════════════════════════════ */
export default function PublicFeed() {
  const { username } = useParams<{ username: string }>();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [info, setInfo] = useState<StudioInfo>({
    studioName: "", userId: "", tagline: null, bio: null, location: null,
    coverUrl: null, logoUrl: null, aboutImageUrl: null,
    instagram: null, whatsapp: null, email: null,
    sectionVisibility: DEFAULT_VIS, testimonials: [],
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [enquiry, setEnquiry] = useState({ firstName: "", lastName: "", email: "", subject: "", details: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // Load fonts
  useEffect(() => {
    if (!document.getElementById("nv-fonts")) {
      const link = document.createElement("link");
      link.id = "nv-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Data loading
  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      let userId: string | null = null;

      const { data: sp } = await (supabase.from("studio_profiles")
        .select("user_id, display_name, bio, location, cover_url, instagram, whatsapp, section_visibility, testimonials_data") as any)
        .eq("username", username).maybeSingle();

      if (sp) {
        userId = sp.user_id;
        const { data: prof } = await (supabase.from("profiles").select("studio_name, studio_logo_url, email") as any)
          .eq("user_id", userId).maybeSingle();
        setInfo({
          studioName: sp.display_name || prof?.studio_name || username,
          userId: userId!,
          tagline: null, bio: sp.bio || null, location: sp.location || null,
          coverUrl: sp.cover_url || null, logoUrl: prof?.studio_logo_url || null,
          aboutImageUrl: sp.cover_url || null,
          instagram: sp.instagram || null, whatsapp: sp.whatsapp || null, email: prof?.email || null,
          sectionVisibility: { ...DEFAULT_VIS, ...(sp.section_visibility || {}) },
          testimonials: (sp.testimonials_data || []).map((t: any) => ({
            name: t.name || t.author || "", text: t.text || t.quote || "",
            event: t.event || t.role || "",
          })),
        });
      } else {
        const { data: dom } = await (supabase.from("domains").select("user_id") as any)
          .eq("subdomain", username).maybeSingle();
        if (dom) {
          userId = dom.user_id;
        } else {
          const { data: allProfiles } = await (supabase.from("profiles").select("user_id, studio_name, studio_logo_url, email") as any);
          const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
          const match = (allProfiles || []).find((p: any) => p.studio_name && slugify(p.studio_name) === slugify(username));
          if (!match) { setNotFound(true); setLoading(false); return; }
          userId = match.user_id;
        }
        const { data: prof } = await (supabase.from("profiles").select("studio_name, studio_logo_url, email") as any)
          .eq("user_id", userId).maybeSingle();
        const { data: sp2 } = await (supabase.from("studio_profiles")
          .select("display_name, bio, location, cover_url, instagram, whatsapp, section_visibility, testimonials_data") as any)
          .eq("user_id", userId).maybeSingle();
        setInfo({
          studioName: sp2?.display_name || prof?.studio_name || username,
          userId: userId!,
          tagline: null, bio: sp2?.bio || null, location: sp2?.location || null,
          coverUrl: sp2?.cover_url || null, logoUrl: prof?.studio_logo_url || null,
          aboutImageUrl: sp2?.cover_url || null,
          instagram: sp2?.instagram || null, whatsapp: sp2?.whatsapp || null, email: prof?.email || null,
          sectionVisibility: { ...DEFAULT_VIS, ...(sp2?.section_visibility || {}) },
          testimonials: (sp2?.testimonials_data || []).map((t: any) => ({
            name: t.name || t.author || "", text: t.text || t.quote || "",
            event: t.event || t.role || "",
          })),
        });
      }

      if (!userId) { setNotFound(true); setLoading(false); return; }

      const { data: events } = await (supabase.from("events")
        .select("id, name, event_date, location, cover_url, photo_count") as any)
        .eq("user_id", userId).eq("is_published", true)
        .order("created_at", { ascending: false }).limit(20);

      const eventItems: FeedItem[] = [];
      const allPhotos: string[] = [];

      for (const evt of events || []) {
        let img = evt.cover_url || null;
        const { data: ep } = await supabase.from("photos").select("url").eq("event_id", evt.id).limit(12);
        if (!img && ep?.[0]) img = ep[0].url || null;
        (ep || []).forEach(p => { if (p.url) allPhotos.push(p.url); });
        eventItems.push({
          id: evt.id, type: "event", title: evt.name || "Untitled",
          caption: null, imageUrl: img, location: evt.location,
          date: evt.event_date || new Date().toISOString(), photoCount: evt.photo_count ?? 0,
        });
      }

      const { data: posts } = await (supabase.from("feed_posts").select("*") as any)
        .eq("user_id", userId).eq("is_published", true)
        .order("created_at", { ascending: false }).limit(20);

      const postItems: FeedItem[] = (posts || []).map((p: any) => ({
        id: p.id, type: "post" as const, title: p.title, caption: p.caption,
        imageUrl: p.image_url, location: p.location, date: p.created_at,
      }));

      setFeed([...eventItems, ...postItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setGalleryPhotos(allPhotos);
      setLoading(false);
    })();
  }, [username]);

  // SEO
  useEffect(() => {
    if (!info.studioName) return;
    document.title = `${info.studioName} — Photography`;
    return () => { document.title = "MirrorAI — Reflections of Your Moments"; };
  }, [info.studioName]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEnquiry = async () => {
    if (!enquiry.firstName || !enquiry.email || !enquiry.details) { toast.error("Fill required fields"); return; }
    setSending(true);
    if (info.userId) {
      await supabase.from("contact_submissions").insert({
        site_owner_id: info.userId,
        name: `${enquiry.firstName} ${enquiry.lastName}`.trim(),
        email: enquiry.email,
        message: `${enquiry.subject ? enquiry.subject + "\n\n" : ""}${enquiry.details}`,
      });
    }
    setSending(false);
    toast.success("Enquiry sent!");
    setEnquiry({ firstName: "", lastName: "", email: "", subject: "", details: "" });
  };

  const vis = info.sectionVisibility;
  const rows = buildRows(galleryPhotos, mob);

  /* ── States ── */
  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 300, color: WHITE, letterSpacing: "0.3em", textTransform: "uppercase" }}>Not Found</h1>
          <p style={{ fontFamily: SANS, fontSize: 13, color: DIM, marginTop: 12, letterSpacing: "0.15em" }}>This portfolio doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.2em", textTransform: "uppercase" }}>Loading...</p>
      </div>
    );
  }

  const navItems = ["HOME", "GALLERIES", "STORIES", "ABOUT", "ENQUIRE"];
  const gap = mob ? 2 : 4;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: WHITE, overflowX: "hidden" }}>

      {/* ═══ FIXED NAV BAR ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: mob ? 60 : 70, background: BG,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: mob ? "0 20px" : "0 40px",
      }}>
        {/* Name */}
        <div style={{
          fontFamily: SERIF, fontSize: 16, fontWeight: 300,
          letterSpacing: "0.3em", textTransform: "uppercase", color: WHITE,
        }}>
          {info.studioName}
        </div>

        {/* Desktop links */}
        {!mob && (
          <div style={{ display: "flex", gap: 32 }}>
            {navItems.map(n => (
              <button key={n} onClick={() => scrollTo(n.toLowerCase() === "home" ? "hero" : n.toLowerCase())} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: SANS, fontSize: 11, fontWeight: 400,
                letterSpacing: "0.2em", textTransform: "uppercase", color: DIM,
                transition: "color 0.3s ease",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
                onMouseLeave={e => (e.currentTarget.style.color = DIM)}
              >{n}</button>
            ))}
          </div>
        )}

        {/* Mobile hamburger */}
        {mob && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 8,
            display: "flex", flexDirection: "column", gap: 5,
          }}>
            <div style={{ width: 22, height: 1, background: WHITE, transition: "all 0.3s", transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
            <div style={{ width: 22, height: 1, background: WHITE, transition: "all 0.3s", opacity: menuOpen ? 0 : 1 }} />
            <div style={{ width: 22, height: 1, background: WHITE, transition: "all 0.3s", transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
          </button>
        )}
      </nav>

      {/* Mobile full-screen menu */}
      {mob && menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99, background: BG,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 40,
        }}>
          {navItems.map(n => (
            <button key={n} onClick={() => scrollTo(n.toLowerCase() === "home" ? "hero" : n.toLowerCase())} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: SANS, fontSize: 18, fontWeight: 400,
              letterSpacing: "0.2em", textTransform: "uppercase", color: WHITE,
            }}>{n}</button>
          ))}
        </div>
      )}

      {/* Spacer for fixed nav */}
      <div style={{ height: mob ? 60 : 70 }} />

      {/* ═══ HERO — Full-bleed cover image ═══ */}
      {vis.hero && info.coverUrl && (
        <section id="hero">
          <LazyImage
            src={info.coverUrl}
            alt={info.studioName}
            style={{ width: "100%", height: mob ? "70vh" : "90vh", maxHeight: "90vh" }}
          />
        </section>
      )}

      {/* ═══ TAGLINE SECTION ═══ */}
      <section style={{
        padding: mob ? "80px 24px" : "120px 40px",
        textAlign: "center", maxWidth: 700, margin: "0 auto",
      }}>
        <p style={{
          fontFamily: SERIF, fontSize: mob ? 28 : 42, fontWeight: 300,
          lineHeight: 1.6, color: WHITE, letterSpacing: "0.02em",
        }}>
          {info.tagline || info.bio || "Every frame tells a story"}
        </p>
        <div style={{ width: 40, height: 1, background: LINE, margin: "30px auto" }} />
        <p style={{
          fontFamily: SANS, fontSize: 13, fontWeight: 300,
          letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED,
        }}>
          {info.location || info.studioName}
        </p>
      </section>

      {/* ═══ CURATED MASONRY GALLERY ═══ */}
      {vis.galleries && galleryPhotos.length > 0 && (
        <section id="galleries">
          <div style={{ display: "flex", flexDirection: "column", gap }}>
            {rows.map((row, ri) => {
              if (row.type === "A") {
                return (
                  <div key={ri}>
                    <LazyImage
                      src={row.images[0]}
                      onClick={() => setLightboxIdx(galleryPhotos.indexOf(row.images[0]))}
                      style={{
                        width: "100%", height: "auto", maxHeight: "90vh",
                        aspectRatio: "16/9", cursor: "pointer",
                      }}
                    />
                  </div>
                );
              }
              if (row.type === "B") {
                return (
                  <div key={ri} style={{ display: "flex", gap }}>
                    {row.images.map((img, i) => (
                      <LazyImage key={i} src={img}
                        onClick={() => setLightboxIdx(galleryPhotos.indexOf(img))}
                        style={{ flex: 1, aspectRatio: "4/5", cursor: "pointer" }}
                      />
                    ))}
                  </div>
                );
              }
              if (row.type === "C") {
                return (
                  <div key={ri} style={{ display: "flex", gap }}>
                    {row.images.map((img, i) => (
                      <LazyImage key={i} src={img}
                        onClick={() => setLightboxIdx(galleryPhotos.indexOf(img))}
                        style={{ flex: 1, aspectRatio: "3/4", cursor: "pointer" }}
                      />
                    ))}
                  </div>
                );
              }
              if (row.type === "D") {
                return (
                  <div key={ri} style={{ display: "flex", gap }}>
                    <LazyImage src={row.images[0]}
                      onClick={() => setLightboxIdx(galleryPhotos.indexOf(row.images[0]))}
                      style={{ flex: "0 0 65%", aspectRatio: "4/5", cursor: "pointer" }}
                    />
                    <LazyImage src={row.images[1]}
                      onClick={() => setLightboxIdx(galleryPhotos.indexOf(row.images[1]))}
                      style={{ flex: 1, aspectRatio: "4/5", cursor: "pointer" }}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* ═══ STORIES / WEDDING CARDS ═══ */}
      {vis.stories && feed.length > 0 && (
        <section id="stories" style={{ padding: mob ? "80px 0" : "120px 0" }}>
          <p style={{
            fontFamily: SERIF, fontSize: 14, fontWeight: 300,
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: MUTED, textAlign: "center", marginBottom: mob ? 40 : 60,
          }}>STORIES</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: mob ? "1fr" : "repeat(3, 1fr)",
            gap: 4,
          }}>
            {feed.filter(f => f.imageUrl).slice(0, 9).map((item) => (
              <div key={item.id} style={{ position: "relative", overflow: "hidden", aspectRatio: "3/4" }}>
                <LazyImage src={item.imageUrl!} alt={item.title}
                  style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                />
                {/* Overlay — always visible on mobile, hover on desktop */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: mob ? "20px 16px" : "24px 20px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                  opacity: mob ? 1 : undefined,
                  transition: "opacity 0.4s ease",
                }}
                  className={mob ? "" : "story-card-overlay"}
                >
                  <p style={{
                    fontFamily: SANS, fontSize: 12, fontWeight: 400,
                    letterSpacing: "0.15em", textTransform: "uppercase", color: WHITE,
                  }}>
                    {item.title} {item.location ? `// ${item.location} //` : "//"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ TESTIMONIALS ═══ */}
      {vis.testimonials && info.testimonials.length > 0 && (
        <section id="testimonials" style={{ padding: mob ? "80px 24px" : "120px 40px" }}>
          <p style={{
            fontFamily: SERIF, fontSize: 14, fontWeight: 300,
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: MUTED, textAlign: "center", marginBottom: mob ? 40 : 60,
          }}>TESTIMONIALS</p>

          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            {info.testimonials.map((t, i) => (
              <div key={i} style={{ textAlign: "center", marginBottom: mob ? 60 : 80 }}>
                <p style={{
                  fontFamily: SERIF, fontSize: mob ? 20 : 26, fontWeight: 300,
                  lineHeight: 1.8, color: WHITE, fontStyle: "italic",
                }}>
                  "{t.text}"
                </p>
                <div style={{ width: 40, height: 1, background: LINE, margin: "24px auto" }} />
                <p style={{
                  fontFamily: SANS, fontSize: 12, fontWeight: 400,
                  letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED,
                }}>
                  — {t.name}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ ABOUT ═══ */}
      {vis.about && info.bio && (
        <section id="about" style={{ padding: mob ? "80px 24px" : "120px 40px" }}>
          <div style={{
            maxWidth: 900, margin: "0 auto",
            display: mob ? "block" : "flex", gap: 60, alignItems: "center",
          }}>
            {info.aboutImageUrl && (
              <div style={{ flex: "0 0 40%", marginBottom: mob ? 40 : 0 }}>
                <LazyImage src={info.aboutImageUrl} alt={info.studioName}
                  style={{ width: "100%", aspectRatio: "3/4" }}
                />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: SERIF, fontSize: 14, fontWeight: 300,
                letterSpacing: "0.4em", textTransform: "uppercase",
                color: MUTED, marginBottom: 24,
              }}>ABOUT</p>
              <h2 style={{
                fontFamily: SERIF, fontSize: mob ? 28 : 36, fontWeight: 300,
                letterSpacing: "0.1em", color: WHITE, marginBottom: 24,
              }}>{info.studioName}</h2>
              <p style={{
                fontFamily: SANS, fontSize: 14, fontWeight: 300,
                lineHeight: 2, color: DIM, letterSpacing: "0.02em",
              }}>{info.bio}</p>
            </div>
          </div>
        </section>
      )}

      {/* ═══ ENQUIRE ═══ */}
      {vis.enquire && (
        <section id="enquire" style={{ padding: mob ? "80px 24px" : "120px 40px" }}>
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <p style={{
              fontFamily: SERIF, fontSize: 14, fontWeight: 300,
              letterSpacing: "0.4em", textTransform: "uppercase",
              color: MUTED, textAlign: "center", marginBottom: 16,
            }}>ENQUIRE</p>
            <h2 style={{
              fontFamily: SERIF, fontSize: mob ? 28 : 36, fontWeight: 300,
              letterSpacing: "0.1em", color: WHITE, textAlign: "center", marginBottom: 48,
            }}>Get in Touch</h2>

            {info.email && (
              <p style={{
                fontFamily: SANS, fontSize: 13, color: MUTED, textAlign: "center",
                letterSpacing: "0.15em", marginBottom: 40,
              }}>{info.email}</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>First Name *</label>
                  <input value={enquiry.firstName} onChange={e => setEnquiry({ ...enquiry, firstName: e.target.value })}
                    style={{
                      width: "100%", padding: "12px 0", fontFamily: SANS, fontSize: 14, fontWeight: 300,
                      color: WHITE, background: "transparent", border: "none",
                      borderBottom: `1px solid ${LINE}`, outline: "none", letterSpacing: "0.05em",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Last Name</label>
                  <input value={enquiry.lastName} onChange={e => setEnquiry({ ...enquiry, lastName: e.target.value })}
                    style={{
                      width: "100%", padding: "12px 0", fontFamily: SANS, fontSize: 14, fontWeight: 300,
                      color: WHITE, background: "transparent", border: "none",
                      borderBottom: `1px solid ${LINE}`, outline: "none", letterSpacing: "0.05em",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Email *</label>
                <input value={enquiry.email} onChange={e => setEnquiry({ ...enquiry, email: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 0", fontFamily: SANS, fontSize: 14, fontWeight: 300,
                    color: WHITE, background: "transparent", border: "none",
                    borderBottom: `1px solid ${LINE}`, outline: "none", letterSpacing: "0.05em",
                  }}
                />
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Subject</label>
                <input value={enquiry.subject} onChange={e => setEnquiry({ ...enquiry, subject: e.target.value })}
                  style={{
                    width: "100%", padding: "12px 0", fontFamily: SANS, fontSize: 14, fontWeight: 300,
                    color: WHITE, background: "transparent", border: "none",
                    borderBottom: `1px solid ${LINE}`, outline: "none", letterSpacing: "0.05em",
                  }}
                />
              </div>

              <div>
                <label style={{ fontFamily: SANS, fontSize: 11, color: MUTED, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Details *</label>
                <textarea value={enquiry.details} onChange={e => setEnquiry({ ...enquiry, details: e.target.value })}
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 0", fontFamily: SANS, fontSize: 14, fontWeight: 300,
                    color: WHITE, background: "transparent", border: "none",
                    borderBottom: `1px solid ${LINE}`, outline: "none", resize: "vertical",
                    letterSpacing: "0.05em",
                  }}
                />
              </div>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={handleEnquiry} disabled={sending} style={{
                  fontFamily: SANS, fontSize: 11, fontWeight: 400,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  background: "transparent", color: WHITE,
                  border: `1px solid ${LINE}`, padding: "16px 48px",
                  cursor: sending ? "wait" : "pointer",
                  opacity: sending ? 0.5 : 1, transition: "all 0.3s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = WHITE; e.currentTarget.style.color = BG; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = WHITE; }}
                >
                  {sending ? "Sending..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{
          fontFamily: SANS, fontSize: 11, fontWeight: 300,
          letterSpacing: "0.15em", color: "#444444",
        }}>
          © {info.studioName}
        </p>
      </footer>

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxIdx !== null && (
        <Lightbox
          images={galleryPhotos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={(i) => setLightboxIdx(i)}
        />
      )}

      {/* Hover styles for story cards (desktop only) */}
      <style>{`
        .story-card-overlay { opacity: 0; }
        .story-card-overlay:hover, div:hover > .story-card-overlay { opacity: 1; }
      `}</style>
    </div>
  );
}
