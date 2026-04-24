import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContext } from "@/lib/SiteContext";

interface SiteProfileContextValue {
  profile: any | null;
  primaryDomain: string | null;
  isCurrentPrimary: boolean;
  loading: boolean;
}

const SiteProfileContext = createContext<SiteProfileContextValue>({
  profile: null, primaryDomain: null, isCurrentPrimary: true, loading: true,
});

export const useSiteProfile = () => useContext(SiteProfileContext);

export function SiteProfileProvider({ children }: { children: ReactNode }) {
  const { siteOwnerId, siteSubdomain } = useSiteContext();
  const [profile, setProfile] = useState<any>(null);
  const [primaryDomain, setPrimaryDomain] = useState<string | null>(null);
  const [isCurrentPrimary, setIsCurrentPrimary] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteOwnerId) { setLoading(false); return; }

    const load = async () => {
      const [profileRes, domainsRes] = await Promise.all([
        (supabase.rpc as any)("get_public_profile_watermark", { p_user_id: siteOwnerId }),
        (supabase.from("domains").select("*").eq("user_id", siteOwnerId) as any),
      ]);

      setProfile(Array.isArray(profileRes.data) ? profileRes.data[0] ?? null : null);

      const allDomains = (domainsRes.data || []) as any[];
      const primaryRow = allDomains.find((d: any) => d.is_primary);
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
