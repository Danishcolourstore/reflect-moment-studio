import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { toast } from "sonner";
import { LayoutGrid } from "lucide-react";
import { HomeDashboardHub } from "@/components/HomeDashboardHub";
import { useBusinessSuite } from "@/hooks/use-business-suite";
import { colors, fonts } from "@/styles/design-tokens";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { LazyImage } from "@/components/LazyImage";
import { FeedItemSkeleton } from "@/components/Skeletons";

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
  const [activeTab, setActiveTab] = useState<"feed" | "dashboard">("feed");
  const { insights, leads, bookings } = useBusinessSuite();

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
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap";
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

  const DotsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#999999">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  );

  const menuBtn: React.CSSProperties = {
    width: "100%", padding: "10px 16px", fontFamily: fonts.body, fontSize: 12,
    color: "#1A1A1A", background: "transparent", border: "none",
    textAlign: "left" as const, cursor: "pointer",
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF", overflowY: "auto" as const }}>
      {/* ── Top Bar ── */}
      <div style={{
        position: "sticky" as const, top: 0, zIndex: 100, height: mob ? 52 : 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)", borderBottom: "1px solid #EEEEEE",
      }}>
        <button onClick={drawer.toggle} style={{
          background: "none", border: "none", fontFamily: fonts.body, fontSize: 10,
          fontWeight: 600, color: "#999999", letterSpacing: "0.2em",
          cursor: "pointer", textTransform: "uppercase" as const,
        }}>MENU</button>
        <span style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 500, color: "#1A1A1A", letterSpacing: "0.08em" }}>
          MirrorAI
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => navigate("/dashboard/events")} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36,
          }}>
            <LayoutGrid className="h-[18px] w-[18px]" style={{ color: "#999999" }} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", borderBottom: "1px solid #EEEEEE",
      }}>
        <div style={{ display: "flex", gap: 24 }}>
          {(["feed", "dashboard"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              fontFamily: fonts.body, fontSize: 12, fontWeight: 500, letterSpacing: "0.15em",
              textTransform: "uppercase" as const, background: "none", border: "none",
              padding: "14px 0", cursor: "pointer", position: "relative" as const,
              color: activeTab === tab ? "#1A1A1A" : "#AAAAAA",
              transition: "color 0.2s",
            }}>
              {tab === "feed" ? "Feed" : "Dashboard"}
              {activeTab === tab && (
                <span style={{
                  position: "absolute" as const, bottom: 0, left: 0, right: 0, height: 2,
                  background: colors.gold,
                }} />
              )}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {shareSlug && (
            <button onClick={() => {
              const url = `${window.location.origin}/feed/${shareSlug}`;
              navigator.clipboard.writeText(url);
              toast.success("Public feed link copied!");
            }} style={{
              fontFamily: fonts.body, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase" as const, color: "#1A1A1A",
              background: "transparent", border: "1px solid #DDDDDD",
              padding: "8px 14px", borderRadius: 6, cursor: "pointer",
            }}>Share Feed</button>
          )}
          {activeTab === "feed" && (
            <button onClick={() => setCreateOpen(true)} style={{
              fontFamily: fonts.body, fontSize: 9, fontWeight: 600, letterSpacing: "0.15em",
              textTransform: "uppercase" as const, color: colors.gold,
              background: "transparent", border: `1px solid ${colors.gold}`,
              padding: "8px 16px", borderRadius: 6, cursor: "pointer",
            }}>+ New Post</button>
          )}
        </div>
      </div>

      {/* ── Feed Content ── */}
      {activeTab === "feed" && (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: mob ? "20px 0 120px" : "32px 0 100px" }}>
          {loading ? (
            <div style={{ padding: "20px 20px" }}>
              {[1, 2, 3].map((i) => <FeedItemSkeleton key={i} />)}
            </div>
          ) : feed.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
              <div style={{ fontFamily: fonts.display, fontSize: 24, color: "#1A1A1A", fontStyle: "italic" }}>
                Your feed is empty
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 13, color: "#999999", marginTop: 12, lineHeight: 1.7 }}>
                Create events or write posts — they'll appear here automatically.
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
                <button onClick={() => navigate("/dashboard/events")} style={{
                  fontFamily: fonts.body, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase" as const, color: "#1A1A1A",
                  border: "1px solid #DDDDDD", background: "transparent",
                  padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                }}>Create Event</button>
                <button onClick={() => setCreateOpen(true)} style={{
                  fontFamily: fonts.body, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase" as const, color: colors.gold,
                  border: `1px solid ${colors.gold}`, background: "transparent",
                  padding: "10px 24px", borderRadius: 8, cursor: "pointer",
                }}>Write Post</button>
              </div>
            </div>
          ) : (
            feed.map((item, idx) => (
              <div key={item.id} style={{ marginBottom: mob ? 40 : 56, position: "relative" as const }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                  style={{
                    position: "absolute" as const, top: 12, right: mob ? 12 : 16, zIndex: 10,
                    width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                    border: "1px solid #EEEEEE", cursor: "pointer",
                  }}
                ><DotsIcon /></button>

                {menuOpenId === item.id && (
                  <div onClick={(e) => e.stopPropagation()} style={{
                    position: "absolute" as const, top: 48, right: mob ? 12 : 16, zIndex: 20,
                    background: "#FFFFFF", border: "1px solid #EEEEEE",
                    minWidth: 170, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", borderRadius: 8,
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
                      background: idx % 2 === 0 ? "linear-gradient(135deg, #F8F8F8, #EEEEEE)" : "linear-gradient(135deg, #EEEEEE, #F8F8F8)",
                    }} />
                  )}

                  <div style={{ padding: mob ? "14px 16px 0" : "16px 24px 0" }}>
                    <div style={{
                      fontFamily: fonts.body, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase" as const,
                      color: item.type === "event" ? colors.gold : "#999999", marginBottom: 8, fontWeight: 600,
                    }}>
                      {item.type === "event" ? "EVENT" : "POST"}
                    </div>

                    <h2 style={{
                      fontFamily: fonts.display, fontSize: mob ? 18 : 22, fontWeight: 500,
                      color: "#1A1A1A", letterSpacing: "0.02em",
                    }}>{item.title}</h2>

                    <div style={{ fontFamily: fonts.body, fontSize: 12, color: "#999999", marginTop: 6 }}>
                      {fmt(item.date)}{item.location ? ` · ${item.location}` : ""}
                    </div>

                    {item.caption && (
                      <p style={{ fontFamily: fonts.body, fontSize: 13, color: "#666666", lineHeight: 1.7, marginTop: 12 }}>
                        {item.caption}
                      </p>
                    )}

                    {item.type === "event" && item.photoCount !== undefined && item.photoCount > 0 && (
                      <div style={{ fontFamily: fonts.body, fontSize: 11, color: "#999999", marginTop: 10 }}>
                        {item.photoCount} photos
                      </div>
                    )}

                    <div style={{ height: 1, background: "#EEEEEE", marginTop: 20 }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Dashboard Content ── */}
      {activeTab === "dashboard" && (
        <div style={{ padding: mob ? "12px 16px 120px" : "20px 24px 100px" }}>
          <HomeDashboardHub insights={insights} leads={leads} bookings={bookings} />
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ padding: "24px 20px 40px", textAlign: "center" as const, borderTop: "1px solid #EEEEEE" }}>
        <div style={{ fontFamily: fonts.body, fontSize: 10, color: "#AAAAAA", letterSpacing: "0.1em" }}>
          © MirrorAI · Real Intelligence
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: colors.gold, margin: "12px auto 0" }} />
      </div>

      <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={loadFeed} />
      <EditFeedPostModal open={editOpen} onOpenChange={setEditOpen} post={editPost} onSaved={loadFeed} />

      {menuOpenId && (
        <div onClick={() => setMenuOpenId(null)} style={{ position: "fixed" as const, inset: 0, zIndex: 5 }} />
      )}

      <MobileBottomNav />
    </div>
  );
}
