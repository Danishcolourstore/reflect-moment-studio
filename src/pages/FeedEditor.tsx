import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const CreateFeedPostModal = lazy(() => import("@/components/CreateFeedPostModal"));
const EditFeedPostModal = lazy(() => import("@/components/EditFeedPostModal"));
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Plus, Share, ArrowLeft } from "lucide-react";
import { resolveUsername } from "@/lib/studio-url";

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

export default function FeedEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [feedSlug, setFeedSlug] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    await (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id).maybeSingle();
    let slug: string | null = null;
    if (!slug) {
      const { data: dom } = await (supabase.from("domains").select("subdomain") as any)
        .eq("user_id", user.id).maybeSingle();
      slug = dom?.subdomain || null;
    }
    if (!slug) slug = resolveUsername(undefined, user.email);
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

  const handleShare = async () => {
    const feedUrl = feedSlug ? `${window.location.origin}/feed/${feedSlug}` : window.location.origin;
    if (navigator.share) {
      try { await navigator.share({ title: "Feed", url: feedUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(feedUrl);
      toast.success("Link copied");
    }
  };

  // Collect all images from posts for full-bleed grid
  const allImages = posts
    .flatMap(p => {
      const imgs: { url: string; postId: string }[] = [];
      if (p.imageUrl) imgs.push({ url: p.imageUrl, postId: p.id });
      p.galleryImages.forEach(gi => imgs.push({ url: gi, postId: p.id }));
      return imgs;
    });

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "hsl(45, 14%, 97%)" }}>
      {/* Minimal floating header */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 48,
          padding: "0 16px",
          background: "hsla(45, 14%, 97%, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => navigate("/home")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}
        >
          <ArrowLeft style={{ width: 18, height: 18, color: "hsl(48, 7%, 10%)" }} strokeWidth={1.5} />
        </button>

        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 400, fontStyle: "italic", color: "hsl(35, 4%, 56%)" }}>
          Feed
        </span>

        <button
          onClick={handleShare}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }}
        >
          <Share style={{ width: 16, height: 16, color: "hsl(35, 4%, 56%)" }} strokeWidth={1.5} />
        </button>
      </nav>

      {/* Full-bleed image grid — no tabs, continuous scroll */}
      <div style={{ paddingTop: 48, paddingBottom: 80 }}>
        {loading ? (
          <div style={{ columns: 2, columnGap: 6 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ breakInside: "avoid", marginBottom: 6, height: 180 + (i % 3) * 60, background: "hsl(40, 5%, 93%)" }} />
            ))}
          </div>
        ) : allImages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "120px 24px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: "italic", color: "hsl(37, 6%, 75%)", fontWeight: 300 }}>
              Add your first post
            </p>
          </div>
        ) : (
          <div style={{ columns: 2, columnGap: 6 }}>
            {allImages.map((img, i) => (
              <div
                key={`${img.postId}-${i}`}
                style={{ breakInside: "avoid", marginBottom: 6, overflow: "hidden", cursor: "pointer" }}
                onClick={() => {
                  const post = posts.find(p => p.id === img.postId);
                  if (post) { setEditPost(post); setEditOpen(true); }
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{ width: "100%", display: "block" }}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        style={{
          position: "fixed",
          bottom: 76,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "hsl(40, 52%, 48%)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px hsla(40, 52%, 48%, 0.3)",
          zIndex: 50,
        }}
      >
        <Plus style={{ width: 22, height: 22, color: "hsl(45, 14%, 97%)" }} strokeWidth={2} />
      </button>

      <MobileBottomNav />
      <Suspense fallback={null}>
        {createOpen && (
          <CreateFeedPostModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadPosts()} />
        )}
        {editPost && editOpen && (
          <EditFeedPostModal
            open={editOpen}
            onOpenChange={setEditOpen}
            post={editPost}
            onSaved={() => loadPosts()}
          />
        )}
      </Suspense>
    </div>
  );
}
