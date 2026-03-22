import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Naman Verma style: warm cream, editorial serif, uppercase spaced labels
const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';
const cream = "#F5F0EA";
const ink = "#1A1A1A";
const gold = "#C8A060";
const dimText = "#8A8A8A";

interface FeedItem {
  id: string;
  type: "event" | "post";
  title: string;
  caption: string | null;
  imageUrl: string | null;
  location: string | null;
  date: string;
  photoCount?: number;
  hashtag?: string;
}

interface StudioInfo {
  studioName: string;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
  sectionVisibility: Record<string, boolean>;
  testimonials: { name: string; text: string; event: string; imageUrl?: string }[];
}

const DEFAULT_VIS: Record<string, boolean> = {
  hero: true, galleries: true, stories: true, testimonials: false, about: true, enquire: true,
};

export default function PublicFeed() {
  const { username } = useParams<{ username: string }>();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [info, setInfo] = useState<StudioInfo>({
    studioName: "", tagline: null, bio: null, location: null, coverUrl: null, logoUrl: null,
    instagram: null, whatsapp: null, email: null,
    sectionVisibility: DEFAULT_VIS, testimonials: [],
  });
  const [heroIdx, setHeroIdx] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [enquiry, setEnquiry] = useState({ firstName: "", lastName: "", email: "", subject: "", details: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("pf-nv-fonts")) {
      const link = document.createElement("link");
      link.id = "pf-nv-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Hero auto-slide
  useEffect(() => {
    if (galleryPhotos.length <= 1) return;
    const heroImages = galleryPhotos.slice(0, 5);
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 4000);
    return () => clearInterval(timer);
  }, [galleryPhotos]);

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);
      let userId: string | null = null;

      // 1. Try studio_profiles.username
      const { data: sp } = await (supabase.from("studio_profiles")
        .select("user_id, display_name, bio, location, cover_url, instagram, whatsapp, section_visibility, testimonials_data") as any)
        .eq("username", username).maybeSingle();

      if (sp) {
        userId = sp.user_id;
        const { data: prof } = await (supabase.from("profiles").select("studio_name, studio_logo_url, email") as any)
          .eq("user_id", userId).maybeSingle();
        setInfo({
          studioName: sp.display_name || prof?.studio_name || username,
          tagline: null, bio: sp.bio || null, location: sp.location || null,
          coverUrl: sp.cover_url || null, logoUrl: prof?.studio_logo_url || null,
          instagram: sp.instagram || null, whatsapp: sp.whatsapp || null, email: prof?.email || null,
          sectionVisibility: { ...DEFAULT_VIS, ...(sp.section_visibility || {}) },
          testimonials: (sp.testimonials_data || []).map((t: any) => ({
            name: t.name || t.author || "", text: t.text || t.quote || "",
            event: t.event || t.role || "", imageUrl: t.imageUrl || t.image_url || undefined,
          })),
        });
      } else {
        // 2. Try domains.subdomain
        const { data: dom } = await (supabase.from("domains").select("user_id") as any)
          .eq("subdomain", username).maybeSingle();
        if (dom) {
          userId = dom.user_id;
        } else {
          // 3. Fallback: match slugified profiles.studio_name
          const { data: allProfiles } = await (supabase.from("profiles").select("user_id, studio_name, studio_logo_url, email") as any);
          const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
          const match = (allProfiles || []).find((p: any) => p.studio_name && slugify(p.studio_name) === slugify(username));
          if (!match) { setNotFound(true); setLoading(false); return; }
          userId = match.user_id;
        }

        // Load profile + studio_profiles info for this userId
        const { data: prof } = await (supabase.from("profiles").select("studio_name, studio_logo_url, email") as any)
          .eq("user_id", userId).maybeSingle();
        const { data: sp2 } = await (supabase.from("studio_profiles")
          .select("display_name, bio, location, cover_url, instagram, whatsapp, section_visibility, testimonials_data") as any)
          .eq("user_id", userId).maybeSingle();
        setInfo({
          studioName: sp2?.display_name || prof?.studio_name || username,
          tagline: null, bio: sp2?.bio || null, location: sp2?.location || null,
          coverUrl: sp2?.cover_url || null, logoUrl: prof?.studio_logo_url || null,
          instagram: sp2?.instagram || null, whatsapp: sp2?.whatsapp || null, email: prof?.email || null,
          sectionVisibility: { ...DEFAULT_VIS, ...(sp2?.section_visibility || {}) },
          testimonials: (sp2?.testimonials_data || []).map((t: any) => ({
            name: t.name || t.author || "", text: t.text || t.quote || "",
            event: t.event || t.role || "", imageUrl: t.imageUrl || t.image_url || undefined,
          })),
        });
      }

      if (!userId) { setNotFound(true); setLoading(false); return; }

      // Events
      const { data: events } = await (supabase.from("events")
        .select("id, name, event_date, location, cover_url, photo_count") as any)
        .eq("user_id", userId).eq("is_published", true)
        .order("created_at", { ascending: false }).limit(20);

      const eventItems: FeedItem[] = [];
      const allPhotos: string[] = [];

      for (const evt of events || []) {
        let img = evt.cover_url || null;
        const { data: ep } = await supabase.from("photos").select("url").eq("event_id", evt.id).limit(8);
        if (!img && ep?.[0]) img = ep[0].url || null;
        (ep || []).forEach(p => { if (p.url) allPhotos.push(p.url); });
        eventItems.push({
          id: evt.id, type: "event", title: evt.name || "Untitled",
          caption: null, imageUrl: img, location: evt.location,
          date: evt.event_date || new Date().toISOString(), photoCount: evt.photo_count ?? 0,
        });
      }

      // Posts
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

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return d; }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEnquiry = async () => {
    if (!enquiry.firstName || !enquiry.email || !enquiry.details) { toast.error("Fill required fields"); return; }
    setSending(true);
    const { data: sp } = await (supabase.from("studio_profiles").select("user_id") as any)
      .eq("username", username).maybeSingle();
    if (sp?.user_id) {
      await supabase.from("contact_submissions").insert({
        site_owner_id: sp.user_id,
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
  const navItems = ["HOME", "GALLERIES", "STORIES", "TESTIMONIALS", "ABOUT", "ENQUIRE"];
  const heroImages = galleryPhotos.slice(0, 5);
  const currentHero = heroImages[heroIdx] || info.coverUrl || feed.find(f => f.imageUrl)?.imageUrl;

  if (notFound) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: cream, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: playfair, fontSize: 28, color: ink }}>Not Found</div>
          <div style={{ fontFamily: mont, fontSize: 13, color: dimText, marginTop: 8 }}>This portfolio doesn't exist.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: cream, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: mont, fontSize: 13, color: dimText }}>Loading...</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 0", fontFamily: mont, fontSize: 13,
    color: ink, background: "transparent", border: "none",
    borderBottom: "1px solid #D0C8BC", outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: mont, fontSize: 11, color: dimText, letterSpacing: "0.05em",
    marginBottom: 4, display: "block",
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: cream }}>
      {/* ── HEADER / LOGO + NAV ── */}
      <header style={{
        position: "sticky" as const, top: 0, zIndex: 100,
        background: cream, borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: mob ? "16px 16px 0" : "24px 40px 0",
        textAlign: "center" as const,
      }}>
        {/* Logo / Studio Name */}
        {info.logoUrl ? (
          <img src={info.logoUrl} alt={info.studioName} style={{ height: mob ? 48 : 64, objectFit: "contain" as const, margin: "0 auto", display: "block" }} />
        ) : (
          <div style={{ fontFamily: playfair, fontSize: mob ? 20 : 28, fontWeight: 700, color: ink, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            {info.studioName}
          </div>
        )}
        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "center", gap: mob ? 14 : 28,
          marginTop: mob ? 12 : 16, paddingBottom: mob ? 10 : 14,
          overflowX: "auto" as const,
        }}>
          {navItems.map(n => {
            const sectionId = n.toLowerCase();
            const isVisible = sectionId === "home" || vis[sectionId] !== false;
            if (!isVisible) return null;
            return (
              <button key={n} onClick={() => scrollTo(sectionId === "home" ? "hero" : sectionId)} style={{
                background: "none", border: "none", fontFamily: mont,
                fontSize: mob ? 9 : 11, fontWeight: 500, letterSpacing: "0.15em",
                color: ink, cursor: "pointer", whiteSpace: "nowrap" as const,
                textTransform: "uppercase" as const, padding: 0,
              }}>{n}</button>
            );
          })}
        </nav>
      </header>

      {/* ── HERO SLIDER ── */}
      {vis.hero && (
        <section id="hero" style={{ position: "relative" as const, margin: mob ? "0 12px" : "0 32px" }}>
          <div style={{ position: "relative" as const, overflow: "hidden" }}>
            {currentHero ? (
              <img src={currentHero} alt={info.studioName} style={{
                width: "100%", height: mob ? "55vw" : "70vh", objectFit: "cover" as const, display: "block",
                transition: "opacity 0.6s ease",
              }} />
            ) : (
              <div style={{ width: "100%", height: mob ? "55vw" : "70vh", background: "linear-gradient(135deg, #e8e0d4, #d4ccc0)" }} />
            )}
            {/* Slider arrows */}
            {heroImages.length > 1 && (
              <>
                <button onClick={() => setHeroIdx(i => (i - 1 + heroImages.length) % heroImages.length)} style={{
                  position: "absolute" as const, left: 16, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.5)", border: "none", width: 36, height: 36,
                  borderRadius: "50%", fontSize: 18, cursor: "pointer", color: ink, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>‹</button>
                <button onClick={() => setHeroIdx(i => (i + 1) % heroImages.length)} style={{
                  position: "absolute" as const, right: 16, top: "50%", transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.5)", border: "none", width: 36, height: 36,
                  borderRadius: "50%", fontSize: 18, cursor: "pointer", color: ink, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>›</button>
              </>
            )}
          </div>

          {/* Tagline below hero */}
          <div style={{ textAlign: "center" as const, padding: mob ? "28px 16px" : "48px 40px" }}>
            <h2 style={{
              fontFamily: playfair, fontSize: mob ? 16 : 22, fontWeight: 400,
              color: ink, letterSpacing: "0.2em", textTransform: "uppercase" as const,
            }}>
              "{info.tagline || "You Feel. I Focus. We Frame."}"
            </h2>
            {info.bio && (
              <p style={{
                fontFamily: mont, fontSize: mob ? 12 : 14, color: dimText,
                lineHeight: 1.8, marginTop: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto",
              }}>
                {info.bio}
              </p>
            )}
            <div style={{
              fontFamily: mont, fontSize: mob ? 9 : 10, fontWeight: 600, color: ink,
              letterSpacing: "0.25em", textTransform: "uppercase" as const, marginTop: 20,
            }}>
              WE ARE CREATING FICTION OUT OF REALITY.
            </div>
          </div>
        </section>
      )}

      {/* ── PHOTO MOSAIC GRID ── */}
      {vis.galleries && galleryPhotos.length > 0 && (
        <section id="galleries" style={{ padding: mob ? "0 4px" : "0 32px", marginBottom: mob ? 32 : 56 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: mob ? "repeat(4, 1fr)" : "repeat(6, 1fr)",
            gap: mob ? 2 : 4,
          }}>
            {galleryPhotos.slice(0, mob ? 16 : 24).map((url, i) => (
              <div key={i} onClick={() => setLightbox(url)} style={{
                cursor: "pointer", overflow: "hidden", aspectRatio: "1",
              }}>
                <img src={url} alt="" loading="lazy" style={{
                  width: "100%", height: "100%", objectFit: "cover" as const, display: "block",
                  transition: "transform 0.3s ease",
                }}
                  onMouseEnter={e => { if (!mob) (e.target as HTMLImageElement).style.transform = "scale(1.05)"; }}
                  onMouseLeave={e => { if (!mob) (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── STORIES / REAL LOVE STORIES ── */}
      {vis.stories && feed.length > 0 && (
        <section id="stories" style={{ padding: mob ? "32px 0" : "56px 0" }}>
          <div style={{ textAlign: "center" as const, marginBottom: mob ? 24 : 40 }}>
            <h2 style={{
              fontFamily: playfair, fontSize: mob ? 20 : 28, fontWeight: 400,
              color: ink, letterSpacing: "0.18em", textTransform: "uppercase" as const,
            }}>Real Love Stories</h2>
            <p style={{
              fontFamily: mont, fontSize: mob ? 11 : 13, color: dimText,
              marginTop: 8, letterSpacing: "0.05em",
            }}>Like a river flows surely to the sea, so it goes some things are meant to be.</p>
          </div>

          <div style={{ maxWidth: 900, margin: "0 auto", padding: mob ? "0 12px" : "0 32px" }}>
            {feed.map((item) => (
              <div key={item.id} style={{ marginBottom: mob ? 40 : 56 }}>
                {/* Cover image */}
                {item.imageUrl ? (
                  <div style={{ position: "relative" as const, overflow: "hidden" }}>
                    <img src={item.imageUrl} alt={item.title} loading="lazy" style={{
                      width: "100%", height: "auto", display: "block", borderRadius: 0,
                    }} />
                    {/* Overlay title on image */}
                    <div style={{
                      position: "absolute" as const, bottom: 0, left: 0, right: 0,
                      padding: mob ? "16px" : "24px",
                      background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)",
                    }}>
                      <div style={{
                        fontFamily: playfair, fontSize: mob ? 16 : 22, fontWeight: 700,
                        color: "#FFF", letterSpacing: "0.12em", textTransform: "uppercase" as const,
                      }}>{item.title}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: "100%", height: mob ? "55vw" : 400,
                    background: "linear-gradient(135deg, #e2ddd5, #d4ccc0)",
                  }} />
                )}

                {/* Meta below image */}
                <div style={{ padding: mob ? "12px 0" : "16px 0" }}>
                  <h3 style={{
                    fontFamily: playfair, fontSize: mob ? 16 : 20, fontWeight: 400,
                    color: ink, letterSpacing: "0.12em", textTransform: "uppercase" as const,
                  }}>{item.title}</h3>
                  <div style={{ fontFamily: mont, fontSize: 11, color: dimText, marginTop: 4 }}>
                    {fmt(item.date)}
                  </div>
                  {item.caption && (
                    <p style={{ fontFamily: mont, fontSize: 13, color: "#666", lineHeight: 1.7, marginTop: 10 }}>
                      {item.caption}
                    </p>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontFamily: mont, fontSize: 11, color: dimText }}>Read More</span>
                      {item.type === "event" && item.photoCount && item.photoCount > 0 && (
                        <span style={{ fontFamily: mont, fontSize: 11, color: dimText }}>{item.photoCount} photos</span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={gold} stroke="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span style={{ fontFamily: mont, fontSize: 11, color: dimText }}>
                        {Math.floor(Math.random() * 200 + 20)} Likes
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: "#E0D8CC", marginTop: 16 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {vis.testimonials && info.testimonials.length > 0 && (
        <section id="testimonials" style={{ padding: mob ? "40px 0" : "64px 0" }}>
          <div style={{
            background: "#B0A494", padding: mob ? "40px 16px" : "64px 40px",
            textAlign: "center" as const, position: "relative" as const,
          }}>
            <h2 style={{
              fontFamily: playfair, fontSize: mob ? 36 : 64, fontWeight: 400,
              color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em",
              textTransform: "lowercase" as const,
            }}>testimonials.</h2>
          </div>
          {info.testimonials.map((t, i) => (
            <div key={i} style={{
              background: `hsl(${15 + i * 5}, 20%, ${72 - i * 3}%)`,
              display: mob ? "block" : "flex", overflow: "hidden",
            }}>
              {t.imageUrl && (
                <div style={{ flex: mob ? undefined : "0 0 35%", position: "relative" as const }}>
                  <img src={t.imageUrl} alt={t.name} style={{
                    width: "100%", height: mob ? "60vw" : "100%", objectFit: "cover" as const, display: "block",
                  }} />
                  <div style={{
                    position: "absolute" as const, bottom: 0, left: 0, right: 0,
                    fontFamily: playfair, fontSize: mob ? 18 : 24, fontWeight: 700,
                    color: "#FFF", padding: 20, lineHeight: 1.2,
                    writingMode: mob ? "horizontal-tb" as const : "vertical-lr" as const,
                  }}>{t.name}</div>
                </div>
              )}
              <div style={{
                flex: 1, padding: mob ? "28px 20px" : "48px 40px",
                display: "flex", flexDirection: "column" as const, justifyContent: "center",
              }}>
                <div style={{
                  fontFamily: playfair, fontSize: mob ? 16 : 20, fontWeight: 700,
                  color: "#FFF", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 20,
                }}>{t.name}</div>
                <p style={{
                  fontFamily: mont, fontSize: mob ? 12 : 14, color: "rgba(255,255,255,0.85)",
                  lineHeight: 1.9, whiteSpace: "pre-line" as const,
                }}>{t.text}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── ABOUT ── */}
      {vis.about && (
        <section id="about" style={{ padding: mob ? "48px 16px" : "80px 60px", background: cream }}>
          <div style={{
            maxWidth: 900, margin: "0 auto",
            display: mob ? "block" : "flex", gap: 48, alignItems: "flex-start",
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: playfair, fontSize: mob ? 22 : 32, fontWeight: 400,
                color: ink, letterSpacing: "0.12em", textTransform: "uppercase" as const,
              }}>{info.studioName}.</h2>
              <div style={{
                fontFamily: mont, fontSize: mob ? 11 : 12, color: dimText,
                letterSpacing: "0.05em", marginTop: 8,
              }}>Moment. Memory. Miracle.</div>
              {info.bio && (
                <p style={{
                  fontFamily: mont, fontSize: mob ? 12 : 14, color: "#555",
                  lineHeight: 1.9, marginTop: 20,
                }}>{info.bio}</p>
              )}
              <div style={{
                fontFamily: mont, fontSize: 12, fontWeight: 600, color: ink,
                letterSpacing: "0.1em", marginTop: 20,
              }}>People. Photographs. Perfection.</div>
            </div>
            {info.logoUrl && (
              <div style={{ flex: "0 0 auto", marginTop: mob ? 24 : 0 }}>
                <img src={info.logoUrl} alt={info.studioName} style={{
                  width: mob ? "100%" : 260, height: mob ? "auto" : 360,
                  objectFit: "cover" as const, display: "block",
                }} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── ENQUIRE ── */}
      {vis.enquire && (
        <section id="enquire" style={{ padding: mob ? "40px 16px" : "64px 60px", background: cream }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            {/* Enquire hero image */}
            {info.coverUrl && (
              <div style={{ position: "relative" as const, marginBottom: 32, textAlign: "center" as const }}>
                <img src={info.coverUrl} alt="Let's create magic" style={{
                  width: mob ? "100%" : "80%", height: "auto", display: "block", margin: "0 auto",
                }} />
                <div style={{
                  position: "absolute" as const, bottom: 20, left: 0, right: 0,
                  fontFamily: playfair, fontSize: mob ? 28 : 40, fontWeight: 700,
                  color: "#FFF", textAlign: "center" as const,
                  textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                }}>
                  <div style={{ fontFamily: mont, fontSize: 10, letterSpacing: "0.2em", fontWeight: 400 }}>LET'S CREATE</div>
                  MAGIC
                </div>
              </div>
            )}

            {/* Email display */}
            {info.email && (
              <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
                <div style={{
                  fontFamily: mont, fontSize: 12, fontWeight: 600, color: ink,
                  letterSpacing: "0.15em", textTransform: "uppercase" as const,
                }}>EMAIL: {info.email.toUpperCase()}</div>
                <p style={{ fontFamily: mont, fontSize: 13, color: dimText, marginTop: 8, lineHeight: 1.7 }}>
                  You can draft an email to us on the above mentioned address,<br />
                  or can send us the details by filling the form below.
                </p>
                <p style={{ fontFamily: mont, fontSize: 13, color: dimText, marginTop: 8 }}>Thank you!</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" as const, gap: 20, marginTop: 24 }}>
              <div>
                <span style={labelStyle}>Name</span>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ ...labelStyle, fontSize: 10 }}>First Name <span style={{ color: "#C00" }}>(required)</span></span>
                    <input value={enquiry.firstName} onChange={e => setEnquiry({ ...enquiry, firstName: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ ...labelStyle, fontSize: 10 }}>Last Name <span style={{ color: "#C00" }}>(required)</span></span>
                    <input value={enquiry.lastName} onChange={e => setEnquiry({ ...enquiry, lastName: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div>
                <span style={labelStyle}>Email Address <span style={{ color: "#C00" }}>(required)</span></span>
                <input value={enquiry.email} onChange={e => setEnquiry({ ...enquiry, email: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>Subject <span style={{ color: "#C00" }}>(required)</span></span>
                <input value={enquiry.subject} onChange={e => setEnquiry({ ...enquiry, subject: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <span style={labelStyle}>Event Dates / Details <span style={{ color: "#C00" }}>(required)</span></span>
                <textarea value={enquiry.details} onChange={e => setEnquiry({ ...enquiry, details: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" as const }} />
              </div>
              <div style={{ textAlign: "center" as const, marginTop: 8 }}>
                <button onClick={handleEnquiry} disabled={sending} style={{
                  fontFamily: mont, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em",
                  textTransform: "uppercase" as const, background: ink, color: "#FFF",
                  border: "none", padding: "14px 40px", cursor: sending ? "wait" : "pointer",
                  opacity: sending ? 0.6 : 1,
                }}>
                  {sending ? "Sending..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        padding: mob ? "24px 16px" : "32px 40px", textAlign: "right" as const,
        borderTop: "1px solid #E0D8CC",
      }}>
        <div style={{
          fontFamily: mont, fontSize: 10, color: dimText,
          letterSpacing: "0.1em", textTransform: "uppercase" as const,
        }}>©{info.studioName.toUpperCase()}</div>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed" as const, inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: "94vw", maxHeight: "92vh", objectFit: "contain" as const }} />
          <button onClick={() => setLightbox(null)} style={{
            position: "absolute" as const, top: 20, right: 20, background: "none",
            border: "none", color: "#FFF", fontSize: 28, cursor: "pointer",
          }}>✕</button>
        </div>
      )}
    </div>
  );
}
