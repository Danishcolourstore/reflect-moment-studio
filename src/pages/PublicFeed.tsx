import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';
const warmGrad = "linear-gradient(135deg, #f5f0ea, #e8e0d4, #f5f0ea)";
const coolGrad = "linear-gradient(135deg, #eae4dc, #d4ccc0, #eae4dc)";

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

export default function PublicFeed() {
  const { username } = useParams<{ username: string }>();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studioName, setStudioName] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!document.getElementById("pfeed-fonts")) {
      const link = document.createElement("link");
      link.id = "pfeed-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    (async () => {
      setLoading(true);

      // Find user by username from studio_profiles or domains
      const { data: sp } = await (supabase
        .from("studio_profiles")
        .select("user_id, studio_name") as any)
        .eq("username", username)
        .maybeSingle();

      if (!sp) {
        // Try domains table subdomain
        const { data: dom } = await (supabase
          .from("domains")
          .select("user_id") as any)
          .eq("subdomain", username)
          .maybeSingle();

        if (!dom) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Get profile name
        const { data: prof } = await (supabase
          .from("profiles")
          .select("studio_name") as any)
          .eq("user_id", dom.user_id)
          .maybeSingle();

        setStudioName(prof?.studio_name || username);
        await loadFeed(dom.user_id);
      } else {
        setStudioName(sp.studio_name || username);
        await loadFeed(sp.user_id);
      }
    })();
  }, [username]);

  const loadFeed = async (userId: string) => {
    // Fetch published events
    const { data: events } = await (supabase
      .from("events")
      .select("id, name, event_date, location, cover_url, photo_count") as any)
      .eq("user_id", userId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const eventItems: FeedItem[] = [];
    for (const evt of events || []) {
      let img = evt.cover_url || null;
      if (!img) {
        const { data: photos } = await supabase
          .from("photos")
          .select("url")
          .eq("event_id", evt.id)
          .limit(1);
        img = photos?.[0]?.url || null;
      }
      eventItems.push({
        id: evt.id,
        type: "event",
        title: evt.name || "Untitled",
        caption: null,
        imageUrl: img,
        location: evt.location,
        date: evt.event_date || new Date().toISOString(),
        photoCount: evt.photo_count ?? 0,
      });
    }

    // Fetch published feed posts
    const { data: posts } = await (supabase
      .from("feed_posts")
      .select("*") as any)
      .eq("user_id", userId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const postItems: FeedItem[] = (posts || []).map((p: any) => ({
      id: p.id,
      type: "post" as const,
      title: p.title,
      caption: p.caption,
      imageUrl: p.image_url,
      location: p.location,
      date: p.created_at,
    }));

    const merged = [...eventItems, ...postItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setFeed(merged);
    setLoading(false);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    } catch { return d; }
  };

  if (notFound) {
    return (
      <div style={{ width: "100%", minHeight: "100vh", background: "#080808", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: cormorant, fontSize: 28, color: "#F0EDE8" }}>Not Found</div>
          <div style={{ fontFamily: dm, fontSize: 13, color: "rgba(240,237,232,0.35)", marginTop: 8 }}>This photographer feed doesn't exist.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#080808", overflowY: "auto" as const }}>
      {/* Header */}
      <div style={{
        position: "sticky" as const, top: 0, zIndex: 100,
        height: 52, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(8,8,8,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(240,237,232,0.06)",
      }}>
        <span style={{ fontFamily: cormorant, fontSize: 16, fontWeight: 400, color: "#F0EDE8", letterSpacing: "0.06em" }}>
          {studioName}
        </span>
      </div>

      {/* Feed label */}
      <div style={{ padding: "32px 20px 16px" }}>
        <div style={{ fontFamily: dm, fontSize: 9, color: "#E8C97A", letterSpacing: "0.2em", textTransform: "uppercase" as const }}>
          FEED
        </div>
        <h1 style={{ fontFamily: cormorant, fontSize: isMobile ? 26 : 32, fontWeight: 300, color: "#F0EDE8", marginTop: 4, letterSpacing: "0.02em" }}>
          {studioName}
        </h1>
        <div style={{ width: 32, height: 1, background: "#E8C97A", marginTop: 16 }} />
      </div>

      {/* Feed Content */}
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "16px 0 80px" }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: dm, fontSize: 12, color: "rgba(240,237,232,0.3)" }}>Loading...</div>
          </div>
        ) : feed.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" as const }}>
            <div style={{ fontFamily: cormorant, fontSize: 22, color: "rgba(240,237,232,0.5)", fontStyle: "italic" }}>
              No posts yet
            </div>
          </div>
        ) : (
          feed.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: isMobile ? 40 : 56 }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
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

                <h2 style={{ fontFamily: cormorant, fontSize: isMobile ? 20 : 24, fontWeight: 400, color: "#F0EDE8", letterSpacing: "0.04em" }}>
                  {item.title}
                </h2>

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

                <div style={{ height: 1, background: "rgba(240,237,232,0.04)", marginTop: 20 }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "24px 20px 40px", textAlign: "center" as const, borderTop: "1px solid rgba(240,237,232,0.04)" }}>
        <div style={{ fontFamily: dm, fontSize: 10, color: "rgba(240,237,232,0.15)", letterSpacing: "0.1em" }}>
          Powered by MirrorAI
        </div>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#E8C97A", margin: "12px auto 0" }} />
      </div>
    </div>
  );
}
