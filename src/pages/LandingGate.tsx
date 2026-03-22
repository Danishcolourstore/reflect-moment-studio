import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
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

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("My Studio");
  const [createOpen, setCreateOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<FeedItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("home-fonts")) {
      const link = document.createElement("link");
      link.id = "home-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: prof } = await (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id).maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);

    const { data: sp } = await (supabase.from("studio_profiles").select("username") as any)
      .eq("user_id", user.id).maybeSingle();
    if (sp?.username) {
      setShareSlug(sp.username);
    } else {
      const { data: dom } = await (supabase.from("domains").select("subdomain") as any)
        .eq("user_id", user.id).eq("is_primary", true).maybeSingle();
      if (dom?.subdomain) setShareSlug(dom.subdomain);
    }

    const { data: events } = await supabase
      .from("events")
      .select("id, name, event_date, location, cover_url, photo_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const eventItems: FeedItem[] = [];
    for (const evt of events || []) {
      let img = evt.cover_url || null;
      if (!img) {
        const { data: photos } = await supabase
          .from("photos").select("url").eq("event_id", evt.id).limit(1);
        img = photos?.[0]?.url || null;
      }
      eventItems.push({
        id: evt.id, type: "event", title: evt.name || "Untitled Event",
        caption: null, imageUrl: img, location: evt.location,
        date: evt.event_date || new Date().toISOString(), photoCount: evt.photo_count ?? 0,
      });
    }

    const { data: posts } = await (supabase.from("feed_posts").select("*") as any)
      .eq("user_id", user.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const postItems: FeedItem[] = (posts || []).map((p: any) => ({
      id: p.id, type: "post" as const, title: p.title, caption: p.caption,
      imageUrl: p.image_url, location: p.location, date: p.created_at,
    }));

    const merged = [...eventItems, ...postItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setFeed(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const fmt = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }); }
    catch { return d; }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await (supabase.from("feed_posts").delete() as any).eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Post deleted");
    setMenuOpenId(null);
    loadFeed();
  };

  const handleHideEvent = (id: string) => {
    setFeed(prev => prev.filter(f => f.id !== id));
    setMenuOpenId(null);
    toast.success("Hidden from feed");
  };

  const handleEditPost = (item: FeedItem) => {
    setEditPost(item);
    setEditOpen(true);
    setMenuOpenId(null);
  };

  // --- SVG Icons ---
  const HeartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
  const DotsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999999">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  );

  const menuBtn: React.CSSProperties = {
    width: "100%", padding: "10px 16px", fontFamily: mont, fontSize: 12,
    color: "#000000", background: "transparent", border: "none",
    textAlign: "left" as const, cursor: "pointer",
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "auto" as const }}>
      {/* ── Top Bar ── */}
      <div style={{
        position: "sticky" as const, top: 0, zIndex: 100, height: mob ? 52 : 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)", borderBottom: "1px solid #F2F2F2",
      }}>
        <button onClick={drawer.toggle} style={{
          background: "none", border: "none", fontFamily: mont, fontSize: 10,
          fontWeight: 600, color: "#999999", letterSpacing: "0.2em",
          cursor: "pointer", textTransform: "uppercase" as const,
        }}>MENU</button>
        <span style={{ fontFamily: playfair, fontSize: 16, fontWeight: 700, color: "#000000", letterSpacing: "0.02em" }}>
          {profileName}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => navigate("/dashboard")} style={{
            background: "none", border: "none", fontFamily: mont, fontSize: 9,
            fontWeight: 600, color: "#999999", letterSpacing: "0.15em",
            cursor: "pointer", textTransform: "uppercase" as const,
          }}>WORKSPACE</button>
        </div>
      </div>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* ── Sub Nav ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 20px", borderBottom: "1px solid #F2F2F2", overflowX: "auto" as const,
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {["FEED", "ART GALLERY"].map((label, i) => (
            <button key={label} onClick={() => i === 1 ? navigate("/art-gallery") : null} style={{
              background: "none", border: "none", fontFamily: mont, fontSize: 10,
              fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const,
              color: i === 0 ? "#000000" : "#999999", cursor: "pointer",
              borderBottom: i === 0 ? "2px solid #FFCC00" : "2px solid transparent",
              paddingBottom: 4,
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {shareSlug && (
            <button onClick={() => {
              const url = `${window.location.origin}/feed/${shareSlug}`;
              navigator.clipboard.writeText(url);
              toast.success("Public feed link copied!");
            }} style={{
              fontFamily: mont, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase" as const, color: "#000000",
              background: "transparent", border: "1px solid #E0E0E0",
              padding: "8px 14px", cursor: "pointer",
            }}>Share Feed</button>
          )}
          <button onClick={() => setCreateOpen(true)} style={{
            fontFamily: mont, fontSize: 9, fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase" as const, color: "#000000", background: "#FFCC00",
            border: "none", padding: "8px 16px", cursor: "pointer",
          }}>+ New Post</button>
        </div>
      </div>

      {/* ── Feed Header ── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: mob ? "28px 16px 0" : "40px 24px 0" }}>
        <div style={{ fontFamily: mont, fontSize: 10, color: "#FFCC00", letterSpacing: "0.2em", textTransform: "uppercase" as const, fontWeight: 600 }}>
          YOUR FEED
        </div>
        <h1 style={{ fontFamily: playfair, fontSize: mob ? 28 : 36, fontWeight: 700, color: "#000000", marginTop: 4 }}>
          Moments
        </h1>
        <div style={{ width: 36, height: 2, background: "#FFCC00", marginTop: 12, marginBottom: 28 }} />
      </div>

      {/* ── Feed Content ── */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: mob ? "0 0 80px" : "0 0 100px" }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: mont, fontSize: 13, color: "#999999" }}>Loading your feed...</div>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: playfair, fontSize: 24, color: "#000000", fontStyle: "italic" }}>
              Your feed is empty
            </div>
            <div style={{ fontFamily: mont, fontSize: 13, color: "#999999", marginTop: 12, lineHeight: 1.7 }}>
              Create events or write posts — they'll appear here automatically.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button onClick={() => navigate("/dashboard/events")} style={{
                fontFamily: mont, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase" as const, color: "#000000",
                border: "1px solid #E0E0E0", background: "transparent",
                padding: "10px 24px", cursor: "pointer",
              }}>Create Event</button>
              <button onClick={() => setCreateOpen(true)} style={{
                fontFamily: mont, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase" as const, color: "#000000", background: "#FFCC00",
                border: "none", padding: "10px 24px", cursor: "pointer",
              }}>Write Post</button>
            </div>
          </div>
        ) : (
          feed.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: mob ? 40 : 56, position: "relative" as const }}>
              {/* ··· Menu */}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                style={{
                  position: "absolute" as const, top: 12, right: mob ? 12 : 16, zIndex: 10,
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
                  border: "1px solid #F0F0F0", cursor: "pointer",
                }}
              ><DotsIcon /></button>

              {/* Dropdown */}
              {menuOpenId === item.id && (
                <div onClick={(e) => e.stopPropagation()} style={{
                  position: "absolute" as const, top: 48, right: mob ? 12 : 16, zIndex: 20,
                  background: "#FFFFFF", border: "1px solid #F0F0F0",
                  minWidth: 170, boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}>
                  {item.type === "post" && (
                    <>
                      <button onClick={() => handleEditPost(item)}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={menuBtn}>✏️ Edit Post</button>
                      <button onClick={() => handleDeletePost(item.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={{ ...menuBtn, color: "#CC3333" }}>🗑 Delete Post</button>
                    </>
                  )}
                  {item.type === "event" && (
                    <>
                      <button onClick={() => { navigate(`/dashboard/events/${item.id}`); setMenuOpenId(null); }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={menuBtn}>📂 Open Event</button>
                      <button onClick={() => handleHideEvent(item.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={menuBtn}>👁 Hide from Feed</button>
                    </>
                  )}
                  {shareSlug && (
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/feed/${shareSlug}`);
                      toast.success("Link copied!"); setMenuOpenId(null);
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      style={menuBtn}>🔗 Copy Share Link</button>
                  )}
                </div>
              )}

              {/* Card */}
              <div
                style={{ cursor: item.type === "event" ? "pointer" : "default" }}
                onClick={() => item.type === "event" && navigate(`/dashboard/events/${item.id}`)}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title}
                    style={{ width: "100%", height: "auto", objectFit: "cover" as const, display: "block", borderRadius: 0 }}
                    loading="lazy" />
                ) : (
                  <div style={{
                    width: "100%", height: mob ? "65vw" : 420,
                    background: idx % 2 === 0 ? "linear-gradient(135deg, #f5f0ea, #e8e0d4)" : "linear-gradient(135deg, #eae4dc, #d4ccc0)",
                  }} />
                )}

                <div style={{ padding: mob ? "14px 16px 0" : "16px 24px 0" }}>
                  <div style={{
                    fontFamily: mont, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const,
                    color: item.type === "event" ? "#FFCC00" : "#CCCCCC", marginBottom: 8, fontWeight: 600,
                  }}>
                    {item.type === "event" ? "EVENT" : "POST"}
                  </div>

                  <h2 style={{
                    fontFamily: playfair, fontSize: mob ? 18 : 22, fontWeight: 700,
                    color: "#000000", letterSpacing: "0.02em",
                  }}>{item.title}</h2>

                  <div style={{ fontFamily: mont, fontSize: 12, color: "#999999", marginTop: 6 }}>
                    {fmt(item.date)}{item.location ? ` · ${item.location}` : ""}
                  </div>

                  {item.caption && (
                    <p style={{ fontFamily: mont, fontSize: 13, color: "#666666", lineHeight: 1.7, marginTop: 12 }}>
                      {item.caption}
                    </p>
                  )}

                  {item.type === "event" && item.photoCount !== undefined && item.photoCount > 0 && (
                    <div style={{ fontFamily: mont, fontSize: 11, color: "#BBBBBB", marginTop: 10 }}>
                      {item.photoCount} photos
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <HeartIcon />
                      <span style={{ fontFamily: mont, fontSize: 11, color: "#CCCCCC" }}>
                        {Math.floor(Math.random() * 200 + 10)}
                      </span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "#F2F2F2", marginTop: 20 }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "24px 20px 40px", textAlign: "center" as const, borderTop: "1px solid #F2F2F2" }}>
        <div style={{ fontFamily: mont, fontSize: 10, color: "#CCCCCC", letterSpacing: "0.1em" }}>
          © MirrorAI · Real Intelligence
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FFCC00", margin: "12px auto 0" }} />
      </div>

      <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={loadFeed} />
      <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={loadFeed} />

      {menuOpenId && (
        <div onClick={() => setMenuOpenId(null)} style={{ position: "fixed" as const, inset: 0, zIndex: 5 }} />
      )}
    </div>
  );
}
