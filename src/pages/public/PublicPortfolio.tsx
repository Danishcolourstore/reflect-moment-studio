import { useEffect, useState } from "react";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface GalleryItem {
  id: string;
  name: string;
  cover_url: string | null;
  event_date: string;
}

export default function PublicPortfolio() {
  const { siteOwnerId } = useSiteContext();
  const { profile: siteProfile } = useSiteProfile();
  const [profile, setProfile] = useState<any>(null);
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteOwnerId) return;
    const load = async () => {
      const [profileRes, galleriesRes] = await Promise.all([
        (supabase.from("profiles").select("studio_name, studio_logo_url, studio_accent_color, email").eq("user_id", siteOwnerId).maybeSingle() as any),
        (supabase.from("events").select("id, name, cover_url, event_date").eq("user_id", siteOwnerId).eq("is_published", true).eq("feed_visible", true).order("event_date", { ascending: false }).limit(12) as any),
      ]);
      setProfile(profileRes.data);
      setGalleries(galleriesRes.data || []);
      setLoading(false);
    };
    load();
  }, [siteOwnerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Skeleton className="h-[60vh] w-full" />
        <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const studioName = profile?.studio_name || "Photography Studio";
  const coverUrl = profile?.cover_url || galleries[0]?.cover_url;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SiteHead
        title={`${studioName} | Wedding Photographer`}
        ogTitle={`${studioName} — Portfolio`}
        ogImage={coverUrl}
      />
      {/* Hero */}
      <div className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        {coverUrl && (
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl text-white font-light tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {studioName}
          </h1>
        </div>
      </div>

      {/* Featured Galleries */}
      {galleries.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl text-[#1A1A1A] mb-8 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Featured Galleries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map(g => (
              <Link key={g.id} to={`/gallery/${g.id}`} className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-[#E8E0D4]">
                {g.cover_url && (
                  <img src={g.cover_url} alt={g.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm tracking-widest uppercase" style={{ fontFamily: "Inter, sans-serif" }}>
                    View Gallery
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 className="text-white text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{g.name}</h3>
                  <p className="text-white/70 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                    {new Date(g.event_date).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
