import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { toast } from "sonner";

const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

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

const warmGrad = "linear-gradient(135deg, #f5f0ea, #e8e0d4, #f5f0ea)";
const coolGrad = "linear-gradient(135deg, #eae4dc, #d4ccc0, #eae4dc)";

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("Photographer");
  const [createOpen, setCreateOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<FeedItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("feed-fonts")) {
      const link = document.createElement("link");
      link.id = "feed-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@400;500;600;700&display=swap";
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

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    } catch { return d; }
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
    toast.success("Event hidden from feed");
  };

  const handleEditPost = (item: FeedItem) => {
    setEditPost(item);
    setEditOpen(true);
    setMenuOpenId(null);
  };

  const HeartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,232,0.35)" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const DotsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(240,237,232,0.35)">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  );

  const menuBtnStyle: React.CSSProperties = {
    width: "100%", padding: "10px 16px", fontFamily: dm, fontSize: 12,
    color: "#F0EDE8", background: "transparent", border: "none",
    textAlign: "left" as const, cursor: "pointer",
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#080808", overflowY: "auto" as const }}>
      {/* Top Bar */}
      <div style={{
        position: "sticky" as const, top: 0, zIndex: 100, height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", background: "rgba(8,8,8,0.92)",
        backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(240,237,232,0.06)",
      }}>
        <button onClick={drawer.toggle} style={{
          background: "none", border: "none", fontFamily: dm, fontSize: 10,
          fontWeight: 600, color: "rgba(240,237,232,0.4)", letterSpacing: "0.2em",
          cursor: "pointer", textTransform: "uppercase" as const,
        }}>MENU</button>
        <span style={{ fontFamily: cormorant, fontSize: 16, fontWeight: 400, color: "#F0EDE8", letterSpacing: "0.06em" }}>
          {profileName}
        </span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8C97A" }} />
      </div>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* Quick access */}
      <div style={{ display: "flex", gap: 10, padding: "16px 20px", borderBottom: "1px solid rgba(240,237,232,0.04)" }}>
        <button onClick={() => navigate("/dashboard")} style={{
          flex: 1, padding: "10px 0", fontFamily: dm, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#E8C97A",
          background: "transparent", border: "1px solid rgba(232,201,122,0.2)", cursor: "pointer",
        }}>Workspace</button>
        <button onClick={() => navigate("/art-gallery")} style={{
          flex: 1, padding: "10px 0", fontFamily: dm, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "rgba(240,237,232,0.4)",
          background: "transparent", border: "1px solid rgba(240,237,232,0.06)", cursor: "pointer",
        }}>Art Gallery</button>
      </div>

      {/* Feed Header */}
      <div style={{ padding: "32px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: dm, fontSize: 9, color: "#E8C97A", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
            YOUR FEED
          </div>
          <h1 style={{ fontFamily: cormorant, fontSize: isMobile ? 26 : 32, fontWeight: 300, color: "#F0EDE8", marginTop: 4, letterSpacing: "0.02em" }}>
            Moments
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {shareSlug && (
            <button onClick={() => {
              const url = `${window.location.origin}/feed/${shareSlug}`;
              navigator.clipboard.writeText(url);
              toast.success("Feed link copied!");
            }} style={{
              fontFamily: dm, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase" as const, color: "#E8C97A",
              background: "transparent", border: "1px solid rgba(232,201,122,0.25)",
              padding: "10px 16px", cursor: "pointer",
            }}>Share</button>
          )}
          <button onClick={() => setCreateOpen(true)} style={{
            fontFamily: dm, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em",
            textTransform: "uppercase" as const, color: "#080808", background: "#E8C97A",
            border: "none", padding: "10px 20px", cursor: "pointer",
          }}>+ Post</button>
        </div>
      </div>

      <div style={{ width: 32, height: 1, background: "#E8C97A", margin: "0 20px 24px" }} />

      {/* Feed */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "0 0 80px" }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: dm, fontSize: 12, color: "rgba(240,237,232,0.3)" }}>Loading your feed...</div>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: cormorant, fontSize: 22, color: "rgba(240,237,232,0.5)", fontStyle: "italic" }}>
              Your feed is empty
            </div>
            <div style={{ fontFamily: dm, fontSize: 13, color: "rgba(240,237,232,0.25)", marginTop: 12, lineHeight: 1.7 }}>
              Create events or write posts — they'll appear here automatically.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
              <button onClick={() => navigate("/dashboard/events")} style={{
                fontFamily: dm, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase" as const, color: "#E8C97A",
                border: "1px solid rgba(232,201,122,0.3)", background: "transparent",
                padding: "10px 24px", cursor: "pointer",
              }}>Create Event</button>
              <button onClick={() => setCreateOpen(true)} style={{
                fontFamily: dm, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase" as const, color: "#080808", background: "#E8C97A",
                border: "none", padding: "10px 24px", cursor: "pointer",
              }}>Write Post</button>
            </div>
          </div>
        ) : (
          feed.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: isMobile ? 40 : 56, position: "relative" as const }}>
              {/* ··· Menu Button */}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                style={{
                  position: "absolute" as const, top: item.imageUrl ? 12 : 12, right: 12, zIndex: 10,
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", background: "rgba(8,8,8,0.6)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(240,237,232,0.1)", cursor: "pointer",
                }}
              >
                <DotsIcon />
              </button>

              {/* Dropdown Menu */}
              {menuOpenId === item.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute" as const, top: item.imageUrl ? 48 : 48, right: 12, zIndex: 20,
                    background: "#1A1A1A", border: "1px solid rgba(240,237,232,0.1)",
                    minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {item.type === "post" && (
                    <>
                      <button
                        onClick={() => handleEditPost(item)}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,237,232,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={menuBtnStyle}
                      >✏️ Edit Post</button>
                      <button
                        onClick={() => handleDeletePost(item.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,237,232,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={{ ...menuBtnStyle, color: "#E85C5C" }}
                      >🗑 Delete Post</button>
                    </>
                  )}
                  {item.type === "event" && (
                    <>
                      <button
                        onClick={() => { navigate(`/dashboard/events/${item.id}`); setMenuOpenId(null); }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,237,232,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={menuBtnStyle}
                      >📂 Open Event</button>
                      <button
                        onClick={() => handleHideEvent(item.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,237,232,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        style={menuBtnStyle}
                      >👁 Hide from Feed</button>
                    </>
                  )}
                  {shareSlug && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/feed/${shareSlug}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copied!");
                        setMenuOpenId(null);
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(240,237,232,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      style={menuBtnStyle}
                    >🔗 Copy Share Link</button>
                  )}
                </div>
              )}

              {/* Card content — click navigates for events */}
              <div
                style={{ cursor: item.type === "event" ? "pointer" : "default" }}
                onClick={() => item.type === "event" && navigate(`/dashboard/events/${item.id}`)}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title}
                    style={{ width: "100%", height: "auto", objectFit: "cover" as const, display: "block" }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ width: "100%", height: isMobile ? "65vw" : 420, background: idx % 2 === 0 ? warmGrad : coolGrad }} />
                )}

                <div style={{ padding: "16px 20px 0" }}>
                  <div style={{
                    fontFamily: dm, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const,
                    color: item.type === "event" ? "#E8C97A" : "rgba(240,237,232,0.3)", marginBottom: 8,
                  }}>
                    {item.type === "event" ? "EVENT" : "POST"}
                  </div>

                  <h2 style={{
                    fontFamily: cormorant, fontSize: isMobile ? 20 : 24, fontWeight: 400,
                    color: "#F0EDE8", letterSpacing: "0.04em",
                  }}>{item.title}</h2>

                  <div style={{ fontFamily: dm, fontSize: 12, color: "rgba(240,237,232,0.35)", marginTop: 6 }}>
                    {formatDate(item.date)}{item.location ? ` · ${item.location}` : ""}
                  </div>

                  {item.caption && (
                    <p style={{ fontFamily: dm, fontSize: 13, color: "rgba(240,237,232,0.45)", lineHeight: 1.7, marginTop: 12 }}>
                      {item.caption}
                    </p>
                  )}

                  {item.type === "event" && item.photoCount !== undefined && item.photoCount > 0 && (
                    <div style={{ fontFamily: dm, fontSize: 11, color: "rgba(240,237,232,0.2)", marginTop: 10 }}>
                      {item.photoCount} photos
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <HeartIcon />
                      <span style={{ fontFamily: dm, fontSize: 11, color: "rgba(240,237,232,0.25)" }}>
                        {Math.floor(Math.random() * 200 + 10)}
                      </span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(240,237,232,0.04)", marginTop: 20 }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "24px 20px 40px", textAlign: "center" as const, borderTop: "1px solid rgba(240,237,232,0.04)" }}>
        <div style={{ fontFamily: dm, fontSize: 10, color: "rgba(240,237,232,0.15)", letterSpacing: "0.1em" }}>
          © MirrorAI · Real Intelligence
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#E8C97A", margin: "12px auto 0" }} />
      </div>

      <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={loadFeed} />
      <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={loadFeed} />

      {/* Close menu on outside click */}
      {menuOpenId && (
        <div onClick={() => setMenuOpenId(null)} style={{
          position: "fixed" as const, inset: 0, zIndex: 5,
        }} />
      )}
    </div>
  );
}
