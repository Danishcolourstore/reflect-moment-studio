import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

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
  bio: string | null;
  location: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  instagram: string | null;
  whatsapp: string | null;
  email: string | null;
  phone: string | null;
  sectionVisibility: Record<string, boolean>;
  testimonials: { name: string; text: string; event: string }[];
}

const DEFAULT_VIS: Record<string, boolean> = {
  hero: true, galleries: true, stories: true, testimonials: false, about: true, enquire: true,
};

export default function PublicFeed() {
  const { username } = useParams<{ username: string }>();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<{ url: string; eventName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [info, setInfo] = useState<StudioInfo>({
    studioName: "", bio: null, location: null, coverUrl: null, logoUrl: null,
    instagram: null, whatsapp: null, email: null, phone: null,
    sectionVisibility: DEFAULT_VIS, testimonials: [],
  });
  const [activeNav, setActiveNav] = useState("home");
  const [enquiry, setEnquiry] = useState({ name: "", email: "", phone: "", eventType: "", message: "" });
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("pf-fonts")) {
      const link = document.createElement("link");
      link.id = "pf-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);

      // Find user
      let userId: string | null = null;
      const { data: sp } = await (supabase.from("studio_profiles").select("user_id, display_name, bio, location, cover_url, instagram, whatsapp, section_visibility, testimonials_data") as any)
        .eq("username", username).maybeSingle();

      if (sp) {
        userId = sp.user_id;
        const { data: prof } = await (supabase.from("profiles").select("studio_name, studio_logo_url, email") as any)
          .eq("user_id", userId).maybeSingle();
        setInfo({
          studioName: sp.display_name || prof?.studio_name || username,
          bio: sp.bio || null,
          location: sp.location || null,
          coverUrl: sp.cover_url || null,
          logoUrl: prof?.studio_logo_url || null,
          instagram: sp.instagram || null,
          whatsapp: sp.whatsapp || null,
          email: prof?.email || null,
          phone: null,
          sectionVisibility: { ...DEFAULT_VIS, ...(sp.section_visibility || {}) },
          testimonials: (sp.testimonials_data || []).map((t: any) => ({ name: t.name || t.author || "", text: t.text || t.quote || "", event: t.event || t.role || "" })),
        });
      } else {
        const { data: dom } = await (supabase.from("domains").select("user_id") as any)
          .eq("subdomain", username).maybeSingle();
        if (!dom) { setNotFound(true); setLoading(false); return; }
        userId = dom.user_id;
        const { data: prof } = await (supabase.from("profiles").select("studio_name, studio_logo_url, email") as any)
          .eq("user_id", userId).maybeSingle();
        setInfo(prev => ({ ...prev, studioName: prof?.studio_name || username, logoUrl: prof?.studio_logo_url || null, email: prof?.email || null }));
      }

      if (!userId) { setNotFound(true); setLoading(false); return; }

      // Fetch events
      const { data: events } = await (supabase.from("events")
        .select("id, name, event_date, location, cover_url, photo_count") as any)
        .eq("user_id", userId).eq("is_published", true)
        .order("created_at", { ascending: false }).limit(20);

      const eventItems: FeedItem[] = [];
      const photos: { url: string; eventName: string }[] = [];

      for (const evt of events || []) {
        let img = evt.cover_url || null;
        const { data: ep } = await supabase.from("photos").select("url, thumbnail_url").eq("event_id", evt.id).limit(6);
        if (!img && ep?.[0]) img = ep[0].url || ep[0].thumbnail_url || null;
        (ep || []).forEach((p: any) => photos.push({ url: p.url || p.thumbnail_url, eventName: evt.name }));

        eventItems.push({
          id: evt.id, type: "event", title: evt.name || "Untitled",
          caption: null, imageUrl: img, location: evt.location,
          date: evt.event_date || new Date().toISOString(), photoCount: evt.photo_count ?? 0,
        });
      }

      // Feed posts
      const { data: posts } = await (supabase.from("feed_posts").select("*") as any)
        .eq("user_id", userId).eq("is_published", true)
        .order("created_at", { ascending: false }).limit(20);

      const postItems: FeedItem[] = (posts || []).map((p: any) => ({
        id: p.id, type: "post" as const, title: p.title, caption: p.caption,
        imageUrl: p.image_url, location: p.location, date: p.created_at,
      }));

      setFeed([...eventItems, ...postItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setGalleryPhotos(photos);
      setLoading(false);
    })();
  }, [username]);

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return d; }
  };

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const vis = info.sectionVisibility;
  const navItems = [
    { id: "home", label: "Home" },
    vis.galleries && { id: "galleries", label: "Galleries" },
    vis.stories && { id: "stories", label: "Stories" },
    vis.testimonials && info.testimonials.length > 0 && { id: "testimonials", label: "Testimonials" },
    vis.about && { id: "about", label: "About" },
    vis.enquire && { id: "enquire", label: "Enquire" },
  ].filter(Boolean) as { id: string; label: string }[];

  const handleEnquiry = async () => {
    if (!enquiry.name || !enquiry.email || !enquiry.message) { toast.error("Please fill required fields"); return; }
    setSending(true);
    // Try to save to contact_submissions
    const { data: sp } = await (supabase.from("studio_profiles").select("user_id") as any)
      .eq("username", username).maybeSingle();
    if (sp?.user_id) {
      await supabase.from("contact_submissions").insert({
        site_owner_id: sp.user_id, name: enquiry.name, email: enquiry.email,
        phone: enquiry.phone || null, event_type: enquiry.eventType || null, message: enquiry.message,
      });
    }
    setSending(false);
    toast.success("Enquiry sent! They'll get back to you soon.");
    setEnquiry({ name: "", email: "", phone: "", eventType: "", message: "" });
  };

  if (notFound) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: playfair, fontSize: 28, color: "#000" }}>Not Found</div>
          <div style={{ fontFamily: mont, fontSize: 13, color: "#999", marginTop: 8 }}>This photographer portfolio doesn't exist.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: mont, fontSize: 13, color: "#999" }}>Loading portfolio...</div>
      </div>
    );
  }

  const heroImage = info.coverUrl || feed.find(f => f.imageUrl)?.imageUrl || null;
  const stories = feed.filter(f => f.type === "post" && f.caption);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px", fontFamily: mont, fontSize: 13,
    color: "#000", background: "#FAFAFA", border: "1px solid #E8E8E8",
    outline: "none", borderRadius: 0,
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF" }}>
      {/* ── NAV ── */}
      <nav style={{
        position: "sticky" as const, top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: mob ? 52 : 60, padding: "0 24px",
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #F2F2F2",
      }}>
        <div style={{ fontFamily: playfair, fontSize: mob ? 16 : 18, fontWeight: 700, color: "#000" }}>
          {info.studioName}
        </div>
        <div style={{
          display: "flex", gap: mob ? 12 : 20, overflowX: "auto" as const,
          msOverflowStyle: "none" as any, scrollbarWidth: "none" as any,
        }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => scrollTo(n.id)} style={{
              background: "none", border: "none", fontFamily: mont, fontSize: mob ? 9 : 11,
              fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const,
              color: activeNav === n.id ? "#000" : "#999", cursor: "pointer", whiteSpace: "nowrap" as const,
              borderBottom: activeNav === n.id ? "2px solid #000" : "2px solid transparent",
              paddingBottom: 2,
            }}>{n.label}</button>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{
        position: "relative" as const, width: "100%",
        height: mob ? "70vh" : "90vh", overflow: "hidden",
      }}>
        {heroImage ? (
          <img src={heroImage} alt={info.studioName} style={{
            width: "100%", height: "100%", objectFit: "cover" as const, display: "block",
          }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #f0ebe3, #e2ddd5)" }} />
        )}
        <div style={{
          position: "absolute" as const, inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
          display: "flex", flexDirection: "column" as const, justifyContent: "flex-end",
          padding: mob ? "0 20px 40px" : "0 60px 80px",
        }}>
          <h1 style={{
            fontFamily: playfair, fontSize: mob ? 32 : 56, fontWeight: 700,
            color: "#FFF", lineHeight: 1.1, maxWidth: 600,
          }}>
            {info.studioName}
          </h1>
          {info.location && (
            <div style={{ fontFamily: mont, fontSize: mob ? 11 : 13, color: "rgba(255,255,255,0.7)", marginTop: 12, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
              {info.location}
            </div>
          )}
          {vis.enquire && (
            <button onClick={() => scrollTo("enquire")} style={{
              marginTop: 24, fontFamily: mont, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.15em", textTransform: "uppercase" as const,
              background: "#FFF", color: "#000", border: "none",
              padding: "14px 32px", cursor: "pointer", alignSelf: "flex-start",
            }}>Get in Touch</button>
          )}
        </div>
      </section>

      {/* ── GALLERIES (Masonry Grid) ── */}
      {vis.galleries && galleryPhotos.length > 0 && (
        <section id="galleries" style={{ padding: mob ? "48px 0" : "80px 0" }}>
          <div style={{ textAlign: "center" as const, marginBottom: mob ? 28 : 48 }}>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>PORTFOLIO</div>
            <h2 style={{ fontFamily: playfair, fontSize: mob ? 26 : 40, fontWeight: 700, color: "#000", marginTop: 8 }}>Galleries</h2>
            <div style={{ width: 36, height: 2, background: "#000", margin: "16px auto 0" }} />
          </div>
          <div style={{
            columns: mob ? 2 : 3, columnGap: mob ? 4 : 8,
            padding: mob ? "0 4px" : "0 40px", maxWidth: 1200, margin: "0 auto",
          }}>
            {galleryPhotos.slice(0, mob ? 12 : 18).map((p, i) => (
              <div key={i} onClick={() => setLightbox(p.url)} style={{
                breakInside: "avoid" as const, marginBottom: mob ? 4 : 8, cursor: "pointer",
                overflow: "hidden", position: "relative" as const,
              }}>
                <img src={p.url} alt={p.eventName} loading="lazy" style={{
                  width: "100%", height: "auto", display: "block", borderRadius: 0,
                  transition: "transform 0.4s ease",
                }}
                  onMouseEnter={e => { if (!mob) (e.target as HTMLImageElement).style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { if (!mob) (e.target as HTMLImageElement).style.transform = "scale(1)"; }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── STORIES ── */}
      {vis.stories && stories.length > 0 && (
        <section id="stories" style={{ padding: mob ? "48px 16px" : "80px 40px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center" as const, marginBottom: mob ? 32 : 56 }}>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>JOURNAL</div>
            <h2 style={{ fontFamily: playfair, fontSize: mob ? 26 : 40, fontWeight: 700, color: "#000", marginTop: 8 }}>Stories</h2>
            <div style={{ width: 36, height: 2, background: "#000", margin: "16px auto 0" }} />
          </div>
          {stories.map((s, i) => (
            <div key={s.id} style={{
              display: mob ? "block" : "flex",
              flexDirection: i % 2 === 0 ? "row" : "row-reverse" as any,
              gap: 40, marginBottom: mob ? 48 : 72, alignItems: "center",
            }}>
              {s.imageUrl && (
                <div style={{ flex: mob ? undefined : "0 0 50%", marginBottom: mob ? 16 : 0 }}>
                  <img src={s.imageUrl} alt={s.title} style={{ width: "100%", height: "auto", display: "block", borderRadius: 0 }} loading="lazy" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                  {fmt(s.date)}{s.location ? ` · ${s.location}` : ""}
                </div>
                <h3 style={{ fontFamily: playfair, fontSize: mob ? 20 : 26, fontWeight: 700, color: "#000", lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ fontFamily: mont, fontSize: 14, color: "#555", lineHeight: 1.8, marginTop: 16 }}>{s.caption}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {vis.testimonials && info.testimonials.length > 0 && (
        <section id="testimonials" style={{ padding: mob ? "48px 20px" : "80px 40px", background: "#FAFAFA" }}>
          <div style={{ textAlign: "center" as const, marginBottom: mob ? 32 : 56 }}>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>WORDS</div>
            <h2 style={{ fontFamily: playfair, fontSize: mob ? 26 : 40, fontWeight: 700, color: "#000", marginTop: 8 }}>Testimonials</h2>
            <div style={{ width: 36, height: 2, background: "#000", margin: "16px auto 0" }} />
          </div>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column" as const, gap: mob ? 32 : 48 }}>
            {info.testimonials.map((t, i) => (
              <div key={i} style={{ textAlign: "center" as const, padding: mob ? "20px" : "40px" }}>
                <div style={{ fontFamily: playfair, fontSize: 48, color: "#E0E0E0", lineHeight: 1 }}>"</div>
                <p style={{ fontFamily: playfair, fontSize: mob ? 16 : 20, fontWeight: 400, fontStyle: "italic", color: "#333", lineHeight: 1.7, marginTop: -16 }}>
                  {t.text}
                </p>
                <div style={{ fontFamily: mont, fontSize: 12, fontWeight: 600, color: "#000", marginTop: 20, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                  {t.name}
                </div>
                {t.event && (
                  <div style={{ fontFamily: mont, fontSize: 11, color: "#999", marginTop: 4 }}>{t.event}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {vis.about && (
        <section id="about" style={{ padding: mob ? "48px 20px" : "80px 60px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{
            display: mob ? "block" : "flex", gap: 48, alignItems: "center",
          }}>
            {info.logoUrl && (
              <div style={{ flex: "0 0 200px", marginBottom: mob ? 24 : 0, textAlign: "center" as const }}>
                <img src={info.logoUrl} alt={info.studioName} style={{ width: mob ? 120 : 180, height: mob ? 120 : 180, objectFit: "cover" as const, borderRadius: "50%" }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>ABOUT</div>
              <h2 style={{ fontFamily: playfair, fontSize: mob ? 26 : 36, fontWeight: 700, color: "#000", marginTop: 8 }}>{info.studioName}</h2>
              {info.bio && (
                <p style={{ fontFamily: mont, fontSize: 14, color: "#555", lineHeight: 1.8, marginTop: 20 }}>{info.bio}</p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 20, marginTop: 24 }}>
                {info.location && (
                  <div style={{ fontFamily: mont, fontSize: 12, color: "#777" }}>📍 {info.location}</div>
                )}
                {info.email && (
                  <a href={`mailto:${info.email}`} style={{ fontFamily: mont, fontSize: 12, color: "#777", textDecoration: "none" }}>✉ {info.email}</a>
                )}
                {info.instagram && (
                  <a href={info.instagram} target="_blank" rel="noopener noreferrer" style={{ fontFamily: mont, fontSize: 12, color: "#777", textDecoration: "none" }}>📷 Instagram</a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ENQUIRE ── */}
      {vis.enquire && (
        <section id="enquire" style={{ padding: mob ? "48px 20px" : "80px 60px", background: "#FAFAFA" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ textAlign: "center" as const, marginBottom: mob ? 28 : 48 }}>
              <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>CONTACT</div>
              <h2 style={{ fontFamily: playfair, fontSize: mob ? 26 : 40, fontWeight: 700, color: "#000", marginTop: 8 }}>Let's Work Together</h2>
              <div style={{ width: 36, height: 2, background: "#000", margin: "16px auto 0" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              <input placeholder="Your Name *" value={enquiry.name} onChange={e => setEnquiry({ ...enquiry, name: e.target.value })} style={inputStyle} />
              <input placeholder="Email Address *" value={enquiry.email} onChange={e => setEnquiry({ ...enquiry, email: e.target.value })} style={inputStyle} />
              <input placeholder="Phone Number" value={enquiry.phone} onChange={e => setEnquiry({ ...enquiry, phone: e.target.value })} style={inputStyle} />
              <input placeholder="Event Type (e.g. Wedding, Pre-Wedding)" value={enquiry.eventType} onChange={e => setEnquiry({ ...enquiry, eventType: e.target.value })} style={inputStyle} />
              <textarea placeholder="Tell us about your event... *" value={enquiry.message} onChange={e => setEnquiry({ ...enquiry, message: e.target.value })} rows={5} style={{ ...inputStyle, resize: "vertical" as const }} />
              <button onClick={handleEnquiry} disabled={sending} style={{
                width: "100%", padding: "16px", fontFamily: mont, fontSize: 12, fontWeight: 600,
                letterSpacing: "0.15em", textTransform: "uppercase" as const,
                background: "#000", color: "#FFF", border: "none",
                cursor: sending ? "wait" : "pointer", opacity: sending ? 0.6 : 1,
              }}>
                {sending ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Recent Work (Feed) ── */}
      {feed.filter(f => f.type === "event").length > 0 && (
        <section style={{ padding: mob ? "48px 0" : "80px 0" }}>
          <div style={{ textAlign: "center" as const, marginBottom: mob ? 28 : 48 }}>
            <div style={{ fontFamily: mont, fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>RECENT</div>
            <h2 style={{ fontFamily: playfair, fontSize: mob ? 26 : 40, fontWeight: 700, color: "#000", marginTop: 8 }}>Latest Work</h2>
            <div style={{ width: 36, height: 2, background: "#000", margin: "16px auto 0" }} />
          </div>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: mob ? "0" : "0 40px" }}>
            {feed.filter(f => f.type === "event").slice(0, 6).map((item) => (
              <div key={item.id} style={{ marginBottom: mob ? 40 : 56 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "auto", display: "block", borderRadius: 0 }} loading="lazy" />
                ) : (
                  <div style={{ width: "100%", height: mob ? "60vw" : 400, background: "linear-gradient(135deg, #f0ebe3, #e2ddd5)" }} />
                )}
                <div style={{ padding: mob ? "14px 16px 0" : "16px 0 0" }}>
                  <h3 style={{ fontFamily: playfair, fontSize: mob ? 18 : 24, fontWeight: 700, color: "#000" }}>{item.title}</h3>
                  <div style={{ fontFamily: mont, fontSize: 12, color: "#999", marginTop: 4 }}>
                    {fmt(item.date)}{item.location ? ` · ${item.location}` : ""}
                  </div>
                  {item.photoCount !== undefined && item.photoCount > 0 && (
                    <div style={{ fontFamily: mont, fontSize: 11, color: "#BBB", marginTop: 6 }}>{item.photoCount} photos</div>
                  )}
                  <div style={{ height: 1, background: "#F0F0F0", marginTop: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ padding: mob ? "32px 20px" : "48px 40px", textAlign: "center" as const, borderTop: "1px solid #F0F0F0" }}>
        <div style={{ fontFamily: playfair, fontSize: 18, fontWeight: 700, color: "#000" }}>{info.studioName}</div>
        {info.location && <div style={{ fontFamily: mont, fontSize: 11, color: "#999", marginTop: 6 }}>{info.location}</div>}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16 }}>
          {info.instagram && <a href={info.instagram} target="_blank" rel="noopener noreferrer" style={{ fontFamily: mont, fontSize: 10, color: "#999", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Instagram</a>}
          {info.email && <a href={`mailto:${info.email}`} style={{ fontFamily: mont, fontSize: 10, color: "#999", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Email</a>}
          {info.whatsapp && <a href={`https://wa.me/${info.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: mont, fontSize: 10, color: "#999", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>WhatsApp</a>}
        </div>
        <div style={{ fontFamily: mont, fontSize: 9, color: "#CCC", marginTop: 20, letterSpacing: "0.1em" }}>
          Powered by MirrorAI
        </div>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed" as const, inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: "92vw", maxHeight: "90vh", objectFit: "contain" as const }} />
          <button onClick={() => setLightbox(null)} style={{
            position: "absolute" as const, top: 20, right: 20, background: "none",
            border: "none", color: "#FFF", fontSize: 24, cursor: "pointer",
          }}>✕</button>
        </div>
      )}
    </div>
  );
}
