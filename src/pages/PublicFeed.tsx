import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTemplate, type WebsiteTemplateConfig } from "@/lib/website-templates";
import { useWebsiteTemplates } from "@/hooks/use-website-templates";

/* ── Shared website components ── */
import { WebsiteHero } from "@/components/website/WebsiteHero";
import { WebsiteAbout } from "@/components/website/WebsiteAbout";
import { WebsiteContact } from "@/components/website/WebsiteContact";
import { WebsiteFooter } from "@/components/website/WebsiteFooter";
import { WebsiteTestimonials, type Testimonial } from "@/components/website/WebsiteTestimonials";
import { WebsiteServices, type ServiceItem } from "@/components/website/WebsiteServices";
import { WebsiteSocialBar } from "@/components/website/WebsiteSocialBar";
import { WebsitePortfolio } from "@/components/website/WebsitePortfolio";
import { WebsiteFeatured } from "@/components/website/WebsiteFeatured";
import { WebsiteAlbums, type PortfolioAlbum } from "@/components/website/WebsiteAlbums";

/* ── Types ── */
interface StudioInfo {
  studioName: string;
  userId: string;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  footerText: string | null;
  accentColor: string;
  heroButtonLabel: string | null;
  heroButtonUrl: string | null;
  portfolioLayout: string;
  templateValue: string;
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean>;
  testimonials: Testimonial[];
  services: ServiceItem[];
  featuredGalleryIds: string[];
  phone: string | null;
}

interface FeedEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
  event_type: string;
}

const DEFAULT_VIS: Record<string, boolean> = {
  hero: true, social: true, portfolio: true, about: true, contact: true, footer: true,
  featured: true, services: false, testimonials: false, albums: false,
};

const DEFAULT_ORDER = ['hero', 'social', 'portfolio', 'albums', 'about', 'featured', 'services', 'testimonials', 'contact'];

/* ── Lazy fade-in image (for masonry gallery) ── */
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
          src={src} alt={alt || ""} loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
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
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const diff = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(diff) > 60) {
          if (diff < 0 && index < images.length - 1) onNav(index + 1);
          if (diff > 0 && index > 0) onNav(index - 1);
        }
      }}
    >
      <img src={images[index]} alt="" style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain" }} />
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", padding: 8 }}>✕</button>
      <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#888", letterSpacing: "0.1em" }}>
        {index + 1} / {images.length}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PUBLIC FEED PAGE — TEMPLATE-AWARE
   ════════════════════════════════════════════════ */
export default function PublicFeed() {
  const { username } = useParams<{ username: string }>();
  const { data: templates = [] } = useWebsiteTemplates();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [info, setInfo] = useState<StudioInfo | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── Resolve user & load all data ──
  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      let userId: string | null = null;
      let studioData: any = null;
      let profileData: any = null;

      // Step 1: Resolve userId
      const { data: sp } = await (supabase.from("studio_profiles")
        .select("*") as any)
        .eq("username", username).maybeSingle();

      if (sp) {
        userId = sp.user_id;
        studioData = sp;
      } else {
        const { data: dom } = await (supabase.from("domains").select("user_id") as any)
          .eq("subdomain", username).maybeSingle();
        if (dom) {
          userId = dom.user_id;
        } else {
          const { data: allProfiles } = await (supabase.from("profiles").select("user_id, studio_name, email") as any);
          const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
          const match = (allProfiles || []).find((p: any) =>
            (p.studio_name && slugify(p.studio_name) === slugify(username)) ||
            (p.email && p.email.split("@")[0].toLowerCase() === username.toLowerCase())
          );
          if (!match) { setNotFound(true); setLoading(false); return; }
          userId = match.user_id;
        }
      }

      if (!userId) { setNotFound(true); setLoading(false); return; }

      // Step 2: Load profile + studio data in parallel
      const promises: Promise<any>[] = [];
      promises.push((supabase.from("profiles").select("studio_name, studio_logo_url, studio_accent_color, email") as any).eq("user_id", userId).maybeSingle());
      if (!studioData) {
        promises.push((supabase.from("studio_profiles").select("*") as any).eq("user_id", userId).maybeSingle());
      }
      promises.push(
        (supabase.from("events").select("id, name, slug, event_date, location, cover_url, photo_count, event_type") as any)
          .eq("user_id", userId).eq("is_published", true).eq("feed_visible", true)
          .order("event_date", { ascending: false }).limit(20)
      );
      promises.push(
        (supabase.from("portfolio_albums").select("id, title, description, cover_url, category, photo_urls") as any)
          .eq("user_id", userId).eq("is_visible", true)
          .order("sort_order", { ascending: true })
      );

      const results = await Promise.all(promises);
      if (cancelled) return;

      profileData = results[0].data;
      if (!studioData) studioData = results[1].data;
      const eventsData = (studioData ? results[1] : results[2]).data || [];
      const albumsData = (studioData ? results[2] : results[3]).data || [];

      // Fix: if studioData was already loaded, events/albums are at different indices
      const eventsList = studioData && results.length === 3 ? results[1].data || [] : studioData ? results[2].data || [] : results[2].data || [];
      const albumsList = studioData && results.length === 3 ? results[2].data || [] : studioData ? results[3].data || [] : results[3].data || [];

      const sVis = { ...DEFAULT_VIS, ...(studioData?.section_visibility || {}) };
      const sOrder = (studioData?.section_order as string[]) || DEFAULT_ORDER;

      setInfo({
        studioName: studioData?.display_name || profileData?.studio_name || username,
        userId: userId!,
        tagline: studioData?.display_name || null,
        bio: studioData?.bio || null,
        location: studioData?.location || null,
        coverUrl: studioData?.cover_url || null,
        logoUrl: profileData?.studio_logo_url || null,
        instagram: studioData?.instagram || null,
        whatsapp: studioData?.whatsapp || null,
        email: profileData?.email || null,
        website: studioData?.website || null,
        footerText: studioData?.footer_text || null,
        accentColor: profileData?.studio_accent_color || "#b08d57",
        heroButtonLabel: studioData?.hero_button_label || null,
        heroButtonUrl: studioData?.hero_button_url || null,
        portfolioLayout: studioData?.portfolio_layout || "grid",
        templateValue: studioData?.website_template || "vows-elegance",
        sectionOrder: sOrder,
        sectionVisibility: sVis,
        testimonials: (studioData?.testimonials_data || []) as Testimonial[],
        services: (studioData?.services_data || []) as ServiceItem[],
        featuredGalleryIds: (studioData?.featured_gallery_ids || []) as string[],
        phone: studioData?.phone || null,
      });

      const typedEvents = eventsList as unknown as FeedEvent[];
      setEvents(typedEvents);
      setAlbums(albumsList as unknown as PortfolioAlbum[]);

      // Featured events
      const featIds = (studioData?.featured_gallery_ids || []) as string[];
      if (featIds.length > 0) {
        const { data: fData } = await (supabase.from("events")
          .select("id, name, slug, event_date, location, cover_url, photo_count, event_type") as any)
          .in("id", featIds).eq("is_published", true);
        if (!cancelled) setFeaturedEvents((fData || []) as unknown as FeedEvent[]);
      }

      // Fallback covers + gallery photos for masonry
      const allPhotos: string[] = [];
      const noCover = typedEvents.filter(e => !e.cover_url);
      const photos: Record<string, string> = {};
      for (const ev of typedEvents) {
        const { data: p } = await supabase.from("photos").select("url").eq("event_id", ev.id).limit(12);
        if (p) {
          if (!ev.cover_url && p[0]?.url) photos[ev.id] = p[0].url;
          p.forEach(ph => { if (ph.url) allPhotos.push(ph.url); });
        }
      }
      if (!cancelled) {
        setCoverPhotos(photos);
        setGalleryPhotos(allPhotos);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [username]);

  // ── Load Google Font for template ──
  useEffect(() => {
    if (!info) return;
    const tmpl = getTemplate(info.templateValue);
    const fontFamilies = [tmpl.fontFamily, tmpl.uiFontFamily]
      .filter(f => f && !['serif', 'sans-serif', 'monospace'].includes(f))
      .map(f => f.replace(/'/g, ''));
    if (fontFamilies.length === 0) return;
    
    const id = 'public-feed-font';
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700`).join('&')}&display=swap`;
      document.head.appendChild(link);
    }
  }, [info?.templateValue]);

  // ── SEO ──
  useEffect(() => {
    if (!info) return;
    document.title = `${info.studioName} — Photography`;
    return () => { document.title = "MirrorAI — Reflections of Your Moments"; };
  }, [info?.studioName]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-light tracking-widest text-foreground uppercase">Not Found</h1>
          <p className="text-sm text-muted-foreground mt-3 tracking-wider">This portfolio doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (loading || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xs text-muted-foreground tracking-widest uppercase animate-pulse">Loading...</p>
      </div>
    );
  }

  const tmpl = getTemplate(info.templateValue);
  const vis = info.sectionVisibility;

  // Build branding object for shared components
  const branding = {
    studio_name: info.studioName,
    studio_logo_url: info.logoUrl,
    studio_accent_color: info.accentColor,
    bio: info.bio || "",
    display_name: info.tagline || info.studioName,
    instagram: info.instagram || "",
    website: info.website || "",
    whatsapp: info.whatsapp || "",
    email: info.email || "",
    footer_text: info.footerText || "",
    cover_url: info.coverUrl,
    hero_button_label: info.heroButtonLabel || "",
    hero_button_url: info.heroButtonUrl || "",
  };

  // Render sections in order
  const renderSection = (sectionId: string) => {
    if (!vis[sectionId]) return null;

    switch (sectionId) {
      case 'hero':
        return <WebsiteHero key="hero" branding={branding} id="hero" />;
      case 'social':
        return (
          <WebsiteSocialBar key="social" id="social"
            instagram={info.instagram || ""} website={info.website || ""}
            whatsapp={info.whatsapp || ""} email={info.email || ""}
            accent={info.accentColor} template={info.templateValue}
          />
        );
      case 'portfolio':
        return (
          <WebsitePortfolio key="portfolio" id="portfolio"
            events={events} coverPhotos={coverPhotos} accent={info.accentColor}
            layout={info.portfolioLayout as 'grid' | 'masonry' | 'large'}
            onNavigate={() => {}} template={info.templateValue}
          />
        );
      case 'albums':
        return albums.length > 0 ? (
          <WebsiteAlbums key="albums" id="albums" albums={albums} accent={info.accentColor} template={info.templateValue} />
        ) : null;
      case 'about':
        return info.bio ? (
          <WebsiteAbout key="about" id="about" template={info.templateValue} branding={branding} />
        ) : null;
      case 'featured':
        return featuredEvents.length > 0 ? (
          <WebsiteFeatured key="featured" id="featured"
            events={featuredEvents} coverPhotos={coverPhotos}
            accent={info.accentColor} onNavigate={() => {}} template={info.templateValue}
          />
        ) : null;
      case 'services':
        return info.services.length > 0 ? (
          <WebsiteServices key="services" id="services" services={info.services} accent={info.accentColor} template={info.templateValue} />
        ) : null;
      case 'testimonials':
        return info.testimonials.length > 0 ? (
          <WebsiteTestimonials key="testimonials" id="testimonials" testimonials={info.testimonials} accent={info.accentColor} template={info.templateValue} />
        ) : null;
      case 'contact':
        return (
          <WebsiteContact key="contact" id="contact" template={info.templateValue} branding={branding} photographerId={info.userId} />
        );
      default:
        return null;
    }
  };

  // Nav items based on visible sections
  const navLabels: Record<string, string> = {
    hero: "HOME", portfolio: "PORTFOLIO", about: "ABOUT", contact: "ENQUIRE",
    services: "SERVICES", testimonials: "REVIEWS", albums: "ALBUMS", featured: "FEATURED",
  };
  const visibleNavItems = info.sectionOrder
    .filter(id => vis[id] && navLabels[id])
    .map(id => ({ id, label: navLabels[id] }));

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
      
      {/* ═══ TEMPLATE-STYLED NAV BAR ═══ */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: mob ? 60 : 70,
          backgroundColor: tmpl.navBg,
          borderBottom: `1px solid ${tmpl.navBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: mob ? "0 20px" : "0 40px",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{
          fontFamily: tmpl.fontFamily, fontSize: mob ? 14 : 16, fontWeight: 300,
          letterSpacing: "0.25em", textTransform: "uppercase", color: tmpl.text,
        }}>
          {info.studioName}
        </div>

        {!mob && (
          <div style={{ display: "flex", gap: 32 }}>
            {visibleNavItems.map(n => (
              <button key={n.id} onClick={() => scrollTo(n.id === 'hero' ? 'hero' : n.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: tmpl.uiFontFamily, fontSize: 11, fontWeight: 400,
                letterSpacing: "0.2em", textTransform: "uppercase", color: tmpl.textSecondary,
                transition: "color 0.3s ease",
              }}
                onMouseEnter={e => (e.currentTarget.style.color = tmpl.text)}
                onMouseLeave={e => (e.currentTarget.style.color = tmpl.textSecondary)}
              >{n.label}</button>
            ))}
          </div>
        )}

        {mob && (
          <MobileMenu
            items={visibleNavItems}
            tmpl={tmpl}
            onNavigate={(id) => scrollTo(id === 'hero' ? 'hero' : id)}
          />
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div style={{ height: mob ? 60 : 70 }} />

      {/* ═══ SECTIONS (template-styled) ═══ */}
      {info.sectionOrder.map(sectionId => renderSection(sectionId))}

      {/* ═══ FOOTER ═══ */}
      <WebsiteFooter template={info.templateValue} branding={branding} />

      {/* ═══ LIGHTBOX ═══ */}
      {lightboxIdx !== null && (
        <Lightbox
          images={galleryPhotos}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={(i) => setLightboxIdx(i)}
        />
      )}
    </div>
  );
}

/* ── Mobile Menu Component ── */
function MobileMenu({ items, tmpl, onNavigate }: {
  items: { id: string; label: string }[];
  tmpl: WebsiteTemplateConfig;
  onNavigate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: "none", cursor: "pointer", padding: 8,
        display: "flex", flexDirection: "column", gap: 5,
      }}>
        <div style={{ width: 22, height: 1, background: tmpl.text, transition: "all 0.3s", transform: open ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
        <div style={{ width: 22, height: 1, background: tmpl.text, transition: "all 0.3s", opacity: open ? 0 : 1 }} />
        <div style={{ width: 22, height: 1, background: tmpl.text, transition: "all 0.3s", transform: open ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99, backgroundColor: tmpl.bg,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40,
        }}>
          {items.map(n => (
            <button key={n.id} onClick={() => { setOpen(false); onNavigate(n.id); }} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: tmpl.uiFontFamily, fontSize: 18, fontWeight: 400,
              letterSpacing: "0.2em", textTransform: "uppercase", color: tmpl.text,
            }}>{n.label}</button>
          ))}
        </div>
      )}
    </>
  );
}
