import { useEffect, useState } from "react";
import { useSiteContext } from "@/lib/SiteContext";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { SiteHead } from "@/components/SiteHead";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 12;

export default function PublicGalleries() {
  const { siteOwnerId } = useSiteContext();
  const { profile } = useSiteProfile();
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!siteOwnerId) return;
    (supabase.from("events").select("id, name, cover_url, event_date, event_type, photo_count")
      .eq("user_id", siteOwnerId).eq("is_published", true).eq("feed_visible", true)
      .order("event_date", { ascending: false }) as any)
      .then(({ data }: any) => { setGalleries(data || []); setLoading(false); });
  }, [siteOwnerId]);

  const visible = galleries.slice(0, visibleCount);
  const hasMore = visibleCount < galleries.length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 sm:px-6 py-12 sm:py-16">
      <SiteHead
        title={`Galleries | ${profile?.studio_name || "Photography"}`}
        ogTitle={`Galleries — ${profile?.studio_name || "Photography"}`}
      />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl text-[#1A1A1A] text-center mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Galleries
        </h1>
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mb-5 break-inside-avoid">
                <Skeleton className="rounded-lg" style={{ height: `${260 + (i % 3) * 60}px` }} />
              </div>
            ))}
          </div>
        ) : galleries.length === 0 ? (
          <p className="text-center text-[#1A1A1A]/50" style={{ fontFamily: "Inter, sans-serif" }}>No galleries yet</p>
        ) : (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
              {visible.map(g => (
                <Link
                  key={g.id}
                  to={`/gallery/${g.id}`}
                  className="block mb-5 break-inside-avoid group"
                >
                  <div className="relative rounded-lg overflow-hidden bg-[#E8E0D4] shadow-sm transition-shadow duration-300 ease-out group-hover:shadow-lg">
                    {g.cover_url ? (
                      <img
                        src={g.cover_url}
                        alt={g.name}
                        loading="lazy"
                        className="w-full block transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                        style={{ backgroundColor: "#E8E0D4" }}
                      />
                    ) : (
                      <div className="aspect-[4/5]" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 ease-out flex items-center justify-center">
                      <span
                        className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out tracking-wide"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        View Gallery
                      </span>
                    </div>
                  </div>
                  {/* Title & count */}
                  <div className="mt-2.5 px-1">
                    <h3 className="text-[#1A1A1A] text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {g.name}
                    </h3>
                    <p className="text-[#1A1A1A]/40 text-xs mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                      {g.photo_count} photos
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  className="px-8 py-3 rounded-full border border-[#E8E0D4] text-[#1A1A1A]/70 text-sm hover:bg-[#E8E0D4]/30 transition-colors duration-300 ease-out"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
