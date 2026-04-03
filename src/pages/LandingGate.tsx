import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { fonts } from "@/styles/design-tokens";

/* ── Types ── */
interface FeedPost {
  id: string;
  title: string;
  caption: string | null;
  content: string | null;
  imageUrl: string | null;
  location: string | null;
  contentType: "post" | "blog";
  galleryImages: string[];
  date: string;
}

type FeedFilter = "all" | "photos" | "blog";

/* ── Masonry photo tile ── */
function MasonryPhoto({ url, index, mob, onOpen }: { url: string; index: number; mob: boolean; onOpen: (i: number) => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ breakInside: "avoid", marginBottom: mob ? 6 : 8 }}>
      <div
        onClick={() => onOpen(index)}
        style={{ overflow: "hidden", cursor: "pointer", background: "#F5F5F5", minHeight: 120, position: "relative" }}
      >
        {!loaded && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(110deg, #F5F5F5 30%, #ECECEC 50%, #F5F5F5 70%)",
            backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite",
          }} />
        )}
        <img src={url} alt="" loading={index < 4 ? "eager" : "lazy"} decoding="async"
          onLoad={() => setLoaded(true)}
          style={{ width: "100%", height: "auto", display: "block", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}
        />
      </div>
    </div>
  );
}

/* ── Blog card in feed ── */
function BlogCard({ post, mob, onRead, onEdit }: { post: FeedPost; mob: boolean; onRead: () => void; onEdit: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const excerpt = post.caption || (post.content ? post.content.slice(0, 140) + "…" : "");
  const dateStr = new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      style={{
        background: "#FFFFFF", border: "1px solid #F0F0F0",
        borderRadius: 0, overflow: "hidden", cursor: "pointer",
        transition: "box-shadow 0.3s ease",
        marginBottom: mob ? 16 : 24,
      }}
      onClick={onRead}
    >
      {post.imageUrl && (
        <div style={{ position: "relative", background: "#F5F5F5", minHeight: mob ? 200 : 280 }}>
          {!imgLoaded && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(110deg, #F5F5F5 30%, #ECECEC 50%, #F5F5F5 70%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite",
            }} />
          )}
          <img src={post.imageUrl} alt={post.title} loading="lazy" decoding="async"
            onLoad={() => setImgLoaded(true)}
            style={{ width: "100%", height: mob ? 200 : 280, objectFit: "cover", display: "block", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
          />
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "#1A1A1A", color: "white",
            padding: "4px 10px", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            fontFamily: fonts.body,
          }}>
            BLOG
          </div>
        </div>
      )}
      <div style={{ padding: mob ? "16px" : "20px 24px" }}>
        <p style={{ fontFamily: fonts.body, fontSize: 11, color: "#999999", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {dateStr}{post.location ? ` • ${post.location}` : ""}
        </p>
        <h3 style={{ fontFamily: fonts.display, fontSize: mob ? 20 : 24, fontWeight: 400, color: "#1A1A1A", marginBottom: 8, lineHeight: 1.3 }}>
          {post.title}
        </h3>
        {excerpt && (
          <p style={{ fontFamily: fonts.body, fontSize: 14, color: "#666666", lineHeight: 1.6, marginBottom: 12 }}>
            {excerpt}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: "#1A1A1A", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Read Story →
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 14, color: "#999999" }}
            title="Edit"
          >✏️</button>
        </div>
      </div>
    </div>
  );
}

/* ── Blog reader overlay ── */
function BlogReader({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const dateStr = new Date(post.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const paragraphs = (post.content || "").split("\n").filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "white", overflowY: "auto" }}>
      {/* Close bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, background: "white",
        padding: "12px 16px", borderBottom: "1px solid #F0F0F0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontFamily: fonts.body, color: "#666666", display: "flex", alignItems: "center", gap: 6 }}>
          ← Back
        </button>
        <span style={{ fontFamily: fonts.body, fontSize: 11, color: "#999999", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          BLOG
        </span>
      </div>

      {/* Hero cover */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "auto", maxHeight: "60vh", objectFit: "cover", display: "block" }} />
      )}

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
        <p style={{ fontFamily: fonts.body, fontSize: 12, color: "#999999", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {dateStr}{post.location ? ` • ${post.location}` : ""}
        </p>
        <h1 style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 400, color: "#1A1A1A", lineHeight: 1.25, marginBottom: 16 }}>
          {post.title}
        </h1>
        {post.caption && (
          <p style={{ fontFamily: fonts.body, fontSize: 16, color: "#666666", fontStyle: "italic", lineHeight: 1.6, marginBottom: 28, borderLeft: "3px solid #EEEEEE", paddingLeft: 16 }}>
            {post.caption}
          </p>
        )}

        {/* Body text */}
        {paragraphs.map((para, i) => (
          <p key={i} style={{ fontFamily: fonts.body, fontSize: 16, color: "#333333", lineHeight: 1.9, marginBottom: 20 }}>
            {para}
          </p>
        ))}

        {/* Gallery images interspersed */}
        {post.galleryImages.length > 0 && (
          <div style={{ margin: "32px 0" }}>
            {post.galleryImages.map((url, i) => (
              <img key={i} src={url} alt="" loading="lazy"
                style={{ width: "100%", height: "auto", display: "block", marginBottom: 16, objectFit: "cover" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [photos, setPhotos] = useState<string[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("MIRROR AI");
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [mob, setMob] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  const [filter, setFilter] = useState<FeedFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [readingPost, setReadingPost] = useState<FeedPost | null>(null);
  const [showFeedMenu, setShowFeedMenu] = useState(false);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Profile + slug
    const { data: prof } = await (supabase.from("profiles").select("studio_name, username") as any)
      .eq("user_id", user.id).maybeSingle();
    if (prof?.studio_name) setProfileName(prof.studio_name);
    let slug = prof?.username || null;
    if (!slug) {
      const { data: dom } = await (supabase.from("domains").select("subdomain") as any)
        .eq("user_id", user.id).maybeSingle();
      slug = dom?.subdomain || null;
    }
    setFeedSlug(slug);

    // Feed posts
    const { data: postsData } = await (supabase.from("feed_posts")
      .select("id, title, caption, content, image_url, location, content_type, gallery_images, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) as any);

    const posts: FeedPost[] = (postsData || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      caption: p.caption,
      content: p.content,
      imageUrl: p.image_url,
      location: p.location,
      contentType: p.content_type || "post",
      galleryImages: p.gallery_images || [],
      date: p.created_at,
    }));
    setFeedPosts(posts);

    // Photos from events
    const { data: events } = await supabase
      .from("events").select("id, cover_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(30);

    const evtIds = (events || []).map((e: any) => e.id);
    const allUrls: string[] = [];
    for (const evt of events || []) { if (evt.cover_url) allUrls.push(evt.cover_url); }
    if (evtIds.length > 0) {
      const { data: photoData } = await supabase
        .from("photos").select("url")
        .in("event_id", evtIds)
        .order("created_at", { ascending: false }).limit(100);
      for (const p of photoData || []) {
        if (p.url && !allUrls.includes(p.url)) allUrls.push(p.url);
      }
    }
    setPhotos(allUrls);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const nextPhoto = () => setLightboxIdx((i) => (i + 1) % photos.length);
  const prevPhoto = () => setLightboxIdx((i) => (i - 1 + photos.length) % photos.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, photos.length]);

  const handleShare = async () => {
    const baseUrl = window.location.origin;
    const feedUrl = feedSlug ? `${baseUrl}/feed/${feedSlug}` : baseUrl;
    if (navigator.share) {
      try { await navigator.share({ title: profileName, text: `Check out ${profileName}'s photography`, url: feedUrl }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(feedUrl); toast.success("Feed link copied"); } catch { toast.error("Could not copy link"); }
    }
  };

  const handlePreviewFeed = () => {
    if (feedSlug) window.open(`/feed/${feedSlug}`, "_blank");
    else toast("Set up your username in Settings → Profile to get your public feed link");
  };

  const blogPosts = feedPosts.filter((p) => p.contentType === "blog");
  const normalPosts = feedPosts.filter((p) => p.contentType === "post");
  const hasBlogs = blogPosts.length > 0;
  const hasContent = photos.length > 0 || feedPosts.length > 0;

  const FILTERS: { key: FeedFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "photos", label: `Photos${photos.length ? ` (${photos.length})` : ""}` },
    { key: "blog", label: `Blog${blogPosts.length ? ` (${blogPosts.length})` : ""}` },
  ];

  // Blog reader
  if (readingPost) {
    return <BlogReader post={readingPost} onClose={() => setReadingPost(null)} />;
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF" }}>
      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, background: "white",
        borderBottom: "1px solid #f0f0f0", padding: mob ? "14px 16px" : "18px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={drawer.toggle} style={{ background: "none", border: "none", fontSize: 24, padding: 4, cursor: "pointer", color: "#1A1A1A" }}>☰</button>
          <h1 style={{ fontFamily: fonts.display, fontSize: mob ? 18 : 24, fontWeight: 300, letterSpacing: "0.1em", color: "#1A1A1A" }}>
            {profileName.toUpperCase()}
          </h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={handleShare} title="Share" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowFeedMenu(!showFeedMenu)} title="Feed options" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1A1A">
                  <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                </svg>
              </button>
              {showFeedMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setShowFeedMenu(false)} />
                  <div style={{
                    position: "absolute", right: 0, top: 36, zIndex: 60, background: "white",
                    borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #EEEEEE", minWidth: 200, overflow: "hidden",
                  }}>
                    <button onClick={() => { setShowFeedMenu(false); setCreateOpen(true); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>➕</span><span>Create New Post</span>
                    </button>
                    <div style={{ height: 1, background: "#F0F0F0" }} />
                    <button onClick={() => { setShowFeedMenu(false); handleShare(); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>🔗</span><span>Copy Feed Link</span>
                    </button>
                    <button onClick={() => { setShowFeedMenu(false); handlePreviewFeed(); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>👁</span><span>Preview Public Feed</span>
                    </button>
                    <div style={{ height: 1, background: "#F0F0F0" }} />
                    <button onClick={() => { setShowFeedMenu(false); navigate("/dashboard/website-editor"); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>✏️</span><span>Edit Feed & Portfolio</span>
                    </button>
                    <button onClick={() => { setShowFeedMenu(false); navigate("/dashboard/branding"); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>🎨</span><span>Brand & Style</span>
                    </button>
                    <div style={{ height: 1, background: "#F0F0F0" }} />
                    <button onClick={() => { setShowFeedMenu(false); navigate("/dashboard/events"); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>📸</span><span>Manage Events</span>
                    </button>
                    <button onClick={() => { setShowFeedMenu(false); navigate("/dashboard/profile"); }} style={menuItemStyle}>
                      <span style={{ fontSize: 16, width: 24 }}>⚙️</span><span>Feed Settings</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Feed info bar + filters ── */}
      {!loading && hasContent && (
        <div style={{ borderBottom: "1px solid #F5F5F5" }}>
          <div style={{
            padding: mob ? "12px 16px 0" : "16px 24px 0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontFamily: fonts.display, fontSize: mob ? 20 : 26, fontWeight: 300, color: "#1A1A1A", lineHeight: 1.2 }}>
                Your Feed
              </p>
              <p style={{ fontFamily: fonts.body, fontSize: 12, color: "#999999", marginTop: 2 }}>
                {photos.length} photos{blogPosts.length > 0 ? ` • ${blogPosts.length} blog${blogPosts.length > 1 ? "s" : ""}` : ""}
                {" • "}{feedSlug ? "Public" : "Set username to go public"}
              </p>
            </div>
            <button onClick={() => setCreateOpen(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "#1A1A1A", color: "white",
              border: "none", borderRadius: 20, cursor: "pointer",
              fontFamily: fonts.body, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
            }}>
              + CREATE
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{
            display: "flex", gap: 0, padding: mob ? "12px 16px 0" : "14px 24px 0",
          }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "8px 16px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  background: "none", border: "none", cursor: "pointer",
                  color: filter === f.key ? "#1A1A1A" : "#BBBBBB",
                  borderBottom: filter === f.key ? "2px solid #1A1A1A" : "2px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: mob ? "16px 8px" : "24px 24px" }}>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <p style={{ fontFamily: fonts.display, fontSize: 18, color: "#CCCCCC", fontStyle: "italic" }}>Loading…</p>
            </div>
          ) : !hasContent ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p style={{ fontFamily: fonts.display, fontSize: 24, color: "#999999" }}>Your feed is empty</p>
              <p style={{ fontFamily: fonts.body, fontSize: 14, color: "#AAAAAA", marginTop: 8 }}>
                Create a photo post or blog story to get started
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                <button onClick={() => setCreateOpen(true)} style={ctaBtnStyle}>
                  ✍️ Create Post
                </button>
                <button onClick={() => navigate("/dashboard/events")} style={{ ...ctaBtnStyle, background: "white", color: "#1A1A1A", border: "1px solid #DDDDDD" }}>
                  📸 Create Event
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Blog stories section (if filter is all or blog) */}
              {(filter === "all" || filter === "blog") && blogPosts.length > 0 && (
                <div style={{ marginBottom: filter === "all" ? 32 : 0 }}>
                  {filter === "all" && (
                    <p style={{
                      fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.15em", textTransform: "uppercase", color: "#BBBBBB",
                      marginBottom: 16, paddingLeft: mob ? 4 : 0,
                    }}>
                      BLOG STORIES
                    </p>
                  )}
                  {blogPosts.map((post) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      mob={mob}
                      onRead={() => setReadingPost(post)}
                      onEdit={() => { setEditPost(post); setEditOpen(true); }}
                    />
                  ))}
                </div>
              )}

              {/* Normal posts in feed */}
              {(filter === "all" || filter === "blog") && normalPosts.length > 0 && (
                <div style={{ marginBottom: filter === "all" ? 32 : 0 }}>
                  {filter === "all" && blogPosts.length > 0 && (
                    <p style={{
                      fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.15em", textTransform: "uppercase", color: "#BBBBBB",
                      marginBottom: 16, paddingLeft: mob ? 4 : 0,
                    }}>
                      POSTS
                    </p>
                  )}
                  {filter !== "photos" && normalPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        background: "#FFFFFF", border: "1px solid #F0F0F0",
                        marginBottom: 12, overflow: "hidden",
                        display: "flex", alignItems: "center", gap: 12,
                        cursor: "pointer", padding: 12,
                      }}
                      onClick={() => { setEditPost(post); setEditOpen(true); }}
                    >
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="" style={{ width: 64, height: 64, objectFit: "cover", flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 500, color: "#1A1A1A", marginBottom: 2 }}>
                          {post.title}
                        </h4>
                        {post.caption && (
                          <p style={{ fontFamily: fonts.body, fontSize: 12, color: "#999999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {post.caption}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 14, color: "#CCCCCC", flexShrink: 0 }}>✏️</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo gallery (if filter is all or photos) */}
              {(filter === "all" || filter === "photos") && photos.length > 0 && (
                <div>
                  {filter === "all" && (blogPosts.length > 0 || normalPosts.length > 0) && (
                    <p style={{
                      fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.15em", textTransform: "uppercase", color: "#BBBBBB",
                      marginBottom: 16, paddingLeft: mob ? 4 : 0,
                    }}>
                      GALLERY
                    </p>
                  )}
                  <div style={{
                    columnCount: mob ? 2 : window.innerWidth >= 1024 ? 4 : 3,
                    columnGap: mob ? 6 : window.innerWidth >= 1024 ? 12 : 8,
                  }}>
                    {photos.map((url, i) => (
                      <MasonryPhoto key={i} url={url} index={i} mob={mob} onOpen={openLightbox} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.98)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <button onClick={closeLightbox}
            style={{ position: "fixed", top: 12, right: 16, zIndex: 310, width: 40, height: 40, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", color: "white", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
          <img src={photos[lightboxIdx]} alt="" style={{ maxHeight: "85vh", maxWidth: "95vw", objectFit: "contain" }} />
          <div style={{ position: "absolute", bottom: 32, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", zIndex: 310 }}>
            <button onClick={prevPhoto} style={lightboxBtnStyle}>‹</button>
            <span style={{ color: "white", fontSize: 14, background: "rgba(0,0,0,0.4)", padding: "4px 12px", borderRadius: 20, fontFamily: fonts.body }}>
              {lightboxIdx + 1} / {photos.length}
            </span>
            <button onClick={nextPhoto} style={lightboxBtnStyle}>›</button>
          </div>
        </div>
      )}

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <MobileBottomNav />

      <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadData()} />
      {editPost && (
        <EditFeedPostModal
          open={editOpen}
          onOpenChange={setEditOpen}
          post={editPost}
          onSaved={() => loadData()}
        />
      )}
    </div>
  );
}

/* ── Styles ── */
const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, width: "100%",
  padding: "12px 16px", background: "none", border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1A1A1A", textAlign: "left",
  transition: "background 0.15s ease",
};

const ctaBtnStyle: React.CSSProperties = {
  padding: "12px 24px", background: "#1A1A1A", color: "white",
  borderRadius: 24, fontWeight: 600, border: "none", cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
};

const lightboxBtnStyle: React.CSSProperties = {
  width: 40, height: 40, background: "rgba(255,255,255,0.2)", borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "white", fontSize: 18, border: "none", cursor: "pointer",
};
