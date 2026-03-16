import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useSiteContext } from "@/lib/SiteContext";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, Instagram, Facebook, Globe } from "lucide-react";

const NAV_LINKS = [
  { label: "Portfolio", path: "/" },
  { label: "Galleries", path: "/galleries" },
  { label: "Albums", path: "/albums" },
  { label: "Contact", path: "/contact" },
];

export default function PublicSiteLayout() {
  const { siteOwnerId } = useSiteContext();
  const [profile, setProfile] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!siteOwnerId) return;
    (supabase.from("profiles").select("*").eq("user_id", siteOwnerId).maybeSingle() as any)
      .then(({ data }: any) => setProfile(data));
  }, [siteOwnerId]);

  const studioName = profile?.studio_name || "Studio";

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#E8E0D4]">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/" className="text-xl text-[#1A1A1A] tracking-wide" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {studioName}
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <Link key={l.path} to={l.path}
                className={`text-sm tracking-wide transition-colors ${location.pathname === l.path ? "text-[#C9A96E]" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}>
                {l.label}
              </Link>
            ))}
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E8E0D4] px-4 py-3 space-y-2">
            {NAV_LINKS.map(l => (
              <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)}
                className={`block py-2 text-sm ${location.pathname === l.path ? "text-[#C9A96E]" : "text-[#1A1A1A]/60"}`}
                style={{ fontFamily: "Inter, sans-serif" }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E0D4] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          {(profile?.instagram_url || profile?.facebook_url) && (
            <div className="flex gap-3">
              {profile?.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {profile?.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
          <p className="text-[10px] text-[#1A1A1A]/30" style={{ fontFamily: "Inter, sans-serif" }}>
            Powered by{" "}
            <a href="https://mirroraigallery.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A96E] transition-colors">
              MirrorAI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
