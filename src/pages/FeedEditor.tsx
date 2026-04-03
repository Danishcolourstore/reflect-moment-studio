import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fonts } from "@/styles/design-tokens";
import CreateFeedPostModal from "@/components/CreateFeedPostModal";
import EditFeedPostModal from "@/components/EditFeedPostModal";
import { MobileBottomNav } from "@/components/MobileBottomNav";

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
  pinned?: boolean;
}

type Tab = "all" | "post" | "blog";

export default function FeedEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [feedSlug, setFeedSlug] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("My Feed");
  const mob = typeof window !== "undefined" && window.innerWidth < 768;

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

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

    const { data } = await (supabase.from("feed_posts")
      .select("id, title, caption, content, image_url, location, content_type, gallery_images, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100) as any);

    setPosts((data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      caption: p.caption,
      content: p.content,
      imageUrl: p.image_url,
      location: p.location,
      contentType: p.content_type || "post",
      galleryImages: p.gallery_images || [],
      date: p.created_at,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const filtered = tab === "all" ? posts : posts.filter((p) => p.contentType === tab);
  const blogCount = posts.filter((p) => p.contentType === "blog").length;
  const postCount = posts.filter((p) => p.contentType === "post").length;

  const handleShare = async () => {
    const feedUrl = feedSlug ? `${window.location.origin}/feed/${feedSlug}` : window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ title: profileName, url: feedUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Feed link copied!");
    }
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: posts.length },
    { key: "post", label: "Photos", count: postCount },
    { key: "blog", label: "Blogs", count: blogCount },
  ];

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF" }}>
      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, background: "white",
        borderBottom: "1px solid #F0F0F0",
        padding: mob ? "12px 16px" : "16px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/home")} style={iconBtnStyle} title="Back to Feed">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: fonts.display, fontSize: mob ? 18 : 22, fontWeight: 400, color: "#1A1A1A", lineHeight: 1.2 }}>
              Feed Editor
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 11, color: "#999999", marginTop: 1 }}>
              {posts.length} post{posts.length !== 1 ? "s" : ""} • {feedSlug ? "Public" : "Set username to go public"}
            </p>
          </div>
          <button onClick={handleShare} style={iconBtnStyle} title="Share feed">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs + Create ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: mob ? "10px 16px" : "12px 24px",
        borderBottom: "1px solid #F5F5F5",
      }}>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "8px 14px", fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
                letterSpacing: "0.05em", textTransform: "uppercase" as const,
                background: "none", border: "none", cursor: "pointer",
                color: tab === t.key ? "#1A1A1A" : "#BBBBBB",
                borderBottom: tab === t.key ? "2px solid #1A1A1A" : "2px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <button onClick={() => setCreateOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", background: "#1A1A1A", color: "white",
          border: "none", borderRadius: 20, cursor: "pointer",
          fontFamily: fonts.body, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
        }}>
          + NEW
        </button>
      </div>

      {/* ── Posts List ── */}
      <div style={{ padding: mob ? "12px 12px 80px" : "16px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ fontFamily: fonts.body, fontSize: 14, color: "#CCCCCC" }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontFamily: fonts.display, fontSize: 22, color: "#999999" }}>
              {tab === "all" ? "No posts yet" : `No ${tab === "blog" ? "blog stories" : "photo posts"} yet`}
            </p>
            <p style={{ fontFamily: fonts.body, fontSize: 13, color: "#BBBBBB", marginTop: 8 }}>
              Tap "+ NEW" to create your first {tab === "blog" ? "blog story" : "post"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                mob={mob}
                onEdit={() => { setEditPost(post); setEditOpen(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <MobileBottomNav />
      <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadPosts()} />
      {editPost && (
        <EditFeedPostModal
          open={editOpen}
          onOpenChange={setEditOpen}
          post={editPost}
          onSaved={() => loadPosts()}
        />
      )}
    </div>
  );
}

/* ── Post row card ── */
function PostRow({ post, mob, onEdit }: { post: FeedPost; mob: boolean; onEdit: () => void }) {
  const dateStr = new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const isBlog = post.contentType === "blog";

  return (
    <div
      onClick={onEdit}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: 12, background: "#FAFAFA", border: "1px solid #F0F0F0",
        borderRadius: 8, cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      {/* Thumbnail */}
      {post.imageUrl ? (
        <img src={post.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 56, height: 56, borderRadius: 6, flexShrink: 0,
          background: "#EEEEEE", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {isBlog ? "✍️" : "📸"}
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            fontFamily: fonts.body, fontSize: 9, fontWeight: 700,
            padding: "2px 6px", borderRadius: 3,
            background: isBlog ? "#1A1A1A" : "#EEEEEE",
            color: isBlog ? "white" : "#666666",
            letterSpacing: "0.1em", textTransform: "uppercase" as const,
          }}>
            {isBlog ? "BLOG" : "POST"}
          </span>
          <span style={{ fontFamily: fonts.body, fontSize: 11, color: "#BBBBBB" }}>{dateStr}</span>
        </div>
        <h4 style={{
          fontFamily: fonts.display, fontSize: mob ? 14 : 15, fontWeight: 500, color: "#1A1A1A",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
        }}>
          {post.title}
        </h4>
        {post.caption && (
          <p style={{
            fontFamily: fonts.body, fontSize: 12, color: "#999999", marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
          }}>
            {post.caption}
          </p>
        )}
        {post.location && (
          <p style={{ fontFamily: fonts.body, fontSize: 11, color: "#BBBBBB", marginTop: 2 }}>
            📍 {post.location}
          </p>
        )}
      </div>

      {/* Edit arrow */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 6,
  display: "flex", alignItems: "center", justifyContent: "center",
};
