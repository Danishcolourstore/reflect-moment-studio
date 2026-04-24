import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContext } from "@/lib/SiteContext";

interface SiteProfileContextValue {
  profile: PublicProfile | null;
  primaryDomain: string | null;
  isCurrentPrimary: boolean;
  loading: boolean;
}

type PublicProfile = {
  user_id: string;
  studio_name: string | null;
  avatar_url: string | null;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  watermark_text: string | null;
  watermark_opacity: number | null;
  watermark_position: string | null;
};

type DomainRow = { is_primary?: boolean; custom_domain?: string | null; subdomain?: string | null };

const getPublicProfileWatermark = supabase.rpc as unknown as (
  fn: "get_public_profile_watermark",
  args: { p_user_id: string },
) => Promise<{ data: PublicProfile[] | null }>;

const SiteProfileContext = createContext<SiteProfileContextValue>({
  profile: null, primaryDomain: null, isCurrentPrimary: true, loading: true,
});

export const useSiteProfile = () => useContext(SiteProfileContext);

export function SiteProfileProvider({ children }: { children: ReactNode }) {
  const { siteOwnerId, siteSubdomain } = useSiteContext();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [isCurrentPrimary, setIsCurrentPrimary] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteOwnerId) { setLoading(false); return; }

    const load = async () => {
      const [profileRes, domainsRes] = await Promise.all([
        getPublicProfileWatermark("get_public_profile_watermark", { p_user_id: siteOwnerId }),
        supabase.from("domains").select("*").eq("user_id", siteOwnerId),
      ]);

      setProfile(Array.isArray(profileRes.data) ? profileRes.data[0] ?? null : null);

      const allDomains = (domainsRes.data || []) as DomainRow[];
      const primaryRow = allDomains.find((d) => d.is_primary);
      const hostname = window.location.hostname;

      if (primaryRow) {
        const pDomain = primaryRow.custom_domain
          ? primaryRow.custom_domain
          : `${primaryRow.subdomain}.mirroraigallery.com`;
        setPrimaryDomain(pDomain);
        setIsCurrentPrimary(hostname === pDomain);
      } else {
        // fallback: subdomain is primary
        const fallback = siteSubdomain ? `${siteSubdomain}.mirroraigallery.com` : hostname;
        setPrimaryDomain(fallback);
        setIsCurrentPrimary(true);
      }

      setLoading(false);
    };

    load();
  }, [siteOwnerId, siteSubdomain]);

  return (
    <SiteProfileContext.Provider value={{ profile, primaryDomain, isCurrentPrimary, loading }}>
      {children}
    </SiteProfileContext.Provider>
  );
}
