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

  // Structured data for LocalBusiness
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": name,
    "description": finalDescription,
    "url": canonicalUrl,
    ...(finalOgImage && { "image": finalOgImage }),
    ...(profile?.location && { "address": { "@type": "PostalAddress", "addressLocality": profile.location } }),
    ...(profile?.email && { "email": profile.email }),
    ...(profile?.phone && { "telephone": profile.phone }),
    "priceRange": "$$",
    "@id": canonicalUrl,
  };

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />

      {/* Open Graph */}
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={name} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      {finalOgImage && <meta name="twitter:image" content={finalOgImage} />}

      <link rel="canonical" href={canonicalUrl} />

      {!isCurrentPrimary ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
