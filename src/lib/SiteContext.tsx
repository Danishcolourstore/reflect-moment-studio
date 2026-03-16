import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteContextValue {
  siteOwnerId: string | null;
  siteSubdomain: string | null;
  siteCustomDomain: string | null;
  isPrimaryCustomDomain: boolean;
  isLoading: boolean;
  isPublicSite: boolean;
}

const SiteContext = createContext<SiteContextValue>({
  siteOwnerId: null, siteSubdomain: null, siteCustomDomain: null,
  isPrimaryCustomDomain: false, isLoading: true, isPublicSite: false,
});

export const useSiteContext = () => useContext(SiteContext);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteContextValue>({
    siteOwnerId: null, siteSubdomain: null, siteCustomDomain: null,
    isPrimaryCustomDomain: false, isLoading: true, isPublicSite: false,
  });

  useEffect(() => {
    const resolve = async () => {
      const hostname = window.location.hostname;

      // Localhost / dev
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("lovable.app")) {
        setState(s => ({ ...s, isLoading: false, isPublicSite: false }));
        return;
      }

      // Main site (no subdomain)
      if (hostname === "mirroraigallery.com" || hostname === "www.mirroraigallery.com") {
        setState(s => ({ ...s, isLoading: false, isPublicSite: false }));
        return;
      }

      // Subdomain match
      const subMatch = hostname.match(/^([a-z0-9-]+)\.mirroraigallery\.com$/);
      if (subMatch) {
        const sub = subMatch[1];
        const { data } = await (supabase.from("domains").select("*").eq("subdomain", sub).limit(1).maybeSingle() as any);
        if (data) {
          setState({
            siteOwnerId: data.user_id, siteSubdomain: sub, siteCustomDomain: data.custom_domain,
            isPrimaryCustomDomain: false, isLoading: false, isPublicSite: true,
          });
          return;
        }
        setState(s => ({ ...s, isLoading: false, isPublicSite: true }));
        return;
      }

      // Custom domain match
      const { data } = await (supabase.from("domains").select("*").eq("custom_domain", hostname).eq("verification_status", "verified").limit(1).maybeSingle() as any);
      if (data) {
        setState({
          siteOwnerId: data.user_id, siteSubdomain: data.subdomain, siteCustomDomain: hostname,
          isPrimaryCustomDomain: data.is_primary, isLoading: false, isPublicSite: true,
        });
        return;
      }

      setState(s => ({ ...s, isLoading: false, isPublicSite: true }));
    };

    resolve();
  }, []);

  return <SiteContext.Provider value={state}>{children}</SiteContext.Provider>;
}
