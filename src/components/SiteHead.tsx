import { Helmet } from "react-helmet-async";
import { useSiteProfile } from "@/lib/SiteProfileContext";
import { useLocation } from "react-router-dom";

interface SiteHeadProps {
  /** Override title — used by child pages like gallery or contact */
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export function SiteHead({ title, description, ogTitle, ogDescription, ogImage }: SiteHeadProps) {
  const { profile, primaryDomain, isCurrentPrimary } = useSiteProfile();
  const location = useLocation();

  const name = profile?.studio_name || "Photography Studio";
  const bio = profile?.bio || `${name} — Professional Photography`;
  const truncatedBio = bio.length > 160 ? bio.slice(0, 157) + "..." : bio;
  const coverImage = profile?.cover_url || "";

  const currentHostname = window.location.hostname;
  const protocol = "https://";
  const currentUrl = `${protocol}${currentHostname}${location.pathname}`;
  const canonicalUrl = primaryDomain
    ? `${protocol}${primaryDomain}${location.pathname}`
    : currentUrl;

  const finalTitle = title || `${name} | Wedding Photographer`;
  const finalDescription = description || truncatedBio;
  const finalOgTitle = ogTitle || `${name} — Portfolio`;
  const finalOgDescription = ogDescription || truncatedBio;
  const finalOgImage = ogImage || coverImage;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />

      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />

      <link rel="canonical" href={canonicalUrl} />

      {!isCurrentPrimary ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
    </Helmet>
  );
}
