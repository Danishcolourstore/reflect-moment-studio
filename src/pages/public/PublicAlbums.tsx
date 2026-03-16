import { useEffect, useState } from "react";
import { useSiteContext } from "@/lib/SiteContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicAlbums() {
  const { siteOwnerId } = useSiteContext();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteOwnerId) return;
    (supabase.from("albums").select("id, name, size, page_count, created_at, share_token")
      .eq("user_id", siteOwnerId).not("share_token", "is", null)
      .order("created_at", { ascending: false }) as any)
      .then(({ data }: any) => { setAlbums(data || []); setLoading(false); });
  }, [siteOwnerId]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl text-[#1A1A1A] text-center mb-12" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Albums</h1>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : albums.length === 0 ? (
          <p className="text-center text-[#1A1A1A]/50" style={{ fontFamily: "Inter, sans-serif" }}>No albums shared yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map(a => (
              <a key={a.id} href={`/album-preview/${a.share_token}`}
                className="block p-6 rounded-lg border border-[#E8E0D4] bg-white hover:shadow-md transition-shadow">
                <h3 className="text-lg text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{a.name}</h3>
                <p className="text-xs text-[#1A1A1A]/50 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>{a.size} · {a.page_count} pages</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
