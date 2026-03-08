import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { getTemplate } from '@/lib/website-templates';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsitePortfolio } from '@/components/website/WebsitePortfolio';
import { WebsiteFeatured } from '@/components/website/WebsiteFeatured';
import { WebsiteServices, type ServiceItem } from '@/components/website/WebsiteServices';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteSocialBar } from '@/components/website/WebsiteSocialBar';
import { WebsiteTestimonials, type Testimonial } from '@/components/website/WebsiteTestimonials';
import { WebsiteAlbums, type PortfolioAlbum } from '@/components/website/WebsiteAlbums';
import { WebsitePortfolioImages } from '@/components/website/WebsitePortfolioImages';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';

// ── Types ──────────────────────────────────────────────
interface StudioData {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  instagram: string | null;
  website: string | null;
  whatsapp: string | null;
  cover_url: string | null;
  username: string | null;
  footer_text: string | null;
  section_order: string[] | null;
  section_visibility: Record<string, boolean> | null;
  services_data: ServiceItem[] | null;
  featured_gallery_ids: string[] | null;
  hero_button_label: string | null;
  hero_button_url: string | null;
  portfolio_layout: string | null;
  testimonials_data: Testimonial[] | null;
  location: string | null;
  phone: string | null;
  website_template: string | null;
}

interface ProfileData {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  email: string | null;
}

interface FeedEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
  event_type: string;
}

const DEFAULT_ORDER = ['hero', 'social', 'portfolio', 'albums', 'about', 'featured', 'services', 'testimonials', 'contact'];
const DEFAULT_VISIBILITY: Record<string, boolean> = {
  hero: true, social: true, portfolio: true, albums: false, about: true,
  featured: true, services: false, testimonials: false, contact: true,
};

// ── Data Hook ──────────────────────────────────────────
function useFeedData(username: string | undefined) {
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    (async () => {
      const { data: studioData } = await (supabase
        .from('studio_profiles')
        .select('*') as any)
        .eq('username', username)
        .maybeSingle();

      if (cancelled) return;
      if (!studioData) { setNotFound(true); setLoading(false); return; }

      const sd = studioData as unknown as StudioData;
      setStudio(sd);

      // Load portfolio photos
      const portfolioIds = (sd as any).portfolio_photo_ids as string[] || [];
      if (portfolioIds.length > 0) {
        const { data: pPhotos } = await (supabase.from('photos').select('id, url') as any)
          .in('id', portfolioIds);
        if (!cancelled && pPhotos) {
          // Preserve order from portfolioIds
          const photoMap = new Map((pPhotos as any[]).map(p => [p.id, p]));
          setPortfolioPhotos(portfolioIds.map(id => photoMap.get(id)).filter(Boolean) as { id: string; url: string }[]);
        }
      }

      const { data: profileData } = await (supabase
        .from('profiles')
        .select('studio_name, studio_logo_url, studio_accent_color, email') as any)
        .eq('user_id', sd.user_id)
        .maybeSingle();
      if (cancelled) return;
      if (profileData) setProfile(profileData as unknown as ProfileData);

      const [eventsResult, albumsResult] = await Promise.all([
        (supabase
          .from('events')
          .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .eq('user_id', sd.user_id)
          .eq('is_published', true)
          .eq('feed_visible', true)
          .order('event_date', { ascending: false }),
        (supabase
          .from('portfolio_albums')
          .select('id, title, description, cover_url, category, photo_urls') as any)
          .eq('user_id', sd.user_id)
          .eq('is_visible', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (cancelled) return;
      const typedEvents = (eventsResult.data || []) as unknown as FeedEvent[];
      setEvents(typedEvents);
      setAlbums((albumsResult.data || []) as unknown as PortfolioAlbum[]);

      const featIds = sd.featured_gallery_ids || [];
      if (featIds.length > 0) {
        const { data: featData } = await (supabase
          .from('events')
          .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .in('id', featIds)
          .eq('is_published', true);
        if (!cancelled) setFeaturedEvents((featData || []) as unknown as FeedEvent[]);
      }

      const noCover = typedEvents.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const photos: Record<string, string> = {};
        for (const ev of noCover) {
          if (photos[ev.id]) continue;
          const { data: p } = await (supabase.from('photos').select('url') as any).eq('event_id', ev.id).limit(1);
          if (p?.[0]?.url) photos[ev.id] = p[0].url;
        }
        if (!cancelled) setCoverPhotos(photos);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [username]);

  return { studio, profile, events, featuredEvents, coverPhotos, albums, portfolioPhotos, loading, notFound };
}

// ── Page Component ─────────────────────────────────────
const PhotographerFeed = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { studio, profile, events, featuredEvents, coverPhotos, albums, portfolioPhotos, loading, notFound } = useFeedData(username);

  const templateValue = studio?.website_template || 'dark-portfolio';
  const tmpl = getTemplate(templateValue);

  // ── Dynamic SEO meta tags ──
  useEffect(() => {
    if (!studio || !profile) return;
    const studioName = profile.studio_name || 'Photography Studio';
    const desc = studio.bio || studio.display_name || `${studioName} — Professional Photography Portfolio`;
    const coverImg = studio.cover_url || '';

    document.title = `${studioName} — Photography`;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', desc.slice(0, 160));
    setMeta('property', 'og:title', `${studioName} — Photography`);
    setMeta('property', 'og:description', desc.slice(0, 160));
    setMeta('property', 'og:type', 'website');
    if (coverImg) setMeta('property', 'og:image', coverImg);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', `${studioName} — Photography`);
    setMeta('name', 'twitter:description', desc.slice(0, 160));
    if (coverImg) setMeta('name', 'twitter:image', coverImg);

    return () => { document.title = 'MirrorAI — Reflections of Your Moments'; };
  }, [studio, profile]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: tmpl.bg }}>
        <Skeleton className="h-screen w-full rounded-none" />
      </div>
    );
  }

  if (notFound || !studio) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: tmpl.bg }}>
        <div className="text-center px-6">
          <h1 className="text-4xl font-light" style={{ fontFamily: tmpl.fontFamily, color: tmpl.text }}>
            Not Found
          </h1>
          <p className="mt-4 text-sm" style={{ color: tmpl.textSecondary }}>
            This portfolio link doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const accent = profile?.studio_accent_color || '#C6A77B';
  const sectionOrder = (studio.section_order as string[]) || DEFAULT_ORDER;
  const sectionVis = (studio.section_visibility as Record<string, boolean>) || DEFAULT_VISIBILITY;
  const services = (studio.services_data as ServiceItem[]) || [];
  const testimonials = (studio.testimonials_data as Testimonial[]) || [];
  const portfolioLayout = (studio.portfolio_layout || 'grid') as 'grid' | 'masonry' | 'large';

  const branding = {
    studio_name: profile?.studio_name || 'Photographer',
    studio_logo_url: profile?.studio_logo_url || null,
    studio_accent_color: accent,
    bio: studio.bio,
    display_name: studio.display_name,
    instagram: studio.instagram,
    website: studio.website,
    whatsapp: studio.whatsapp,
    email: profile?.email,
    footer_text: studio.footer_text,
    cover_url: studio.cover_url,
    hero_button_label: studio.hero_button_label,
    hero_button_url: studio.hero_button_url,
  };

  const handleNav = (slug: string) => navigate(`/event/${slug}`);

  const renderSection = (sectionId: string) => {
    if (!sectionVis[sectionId] && sectionVis[sectionId] !== undefined) return null;

    switch (sectionId) {
      case 'hero':
        return <WebsiteHero key="hero" branding={branding} id="hero" />;
      case 'social':
        return (
          <WebsiteSocialBar key="social" id="social"
            instagram={studio.instagram} website={studio.website}
            whatsapp={studio.whatsapp} email={profile?.email} accent={accent}
            template={templateValue}
          />
        );
      case 'portfolio':
        return (
          <WebsitePortfolio key="portfolio" id="portfolio"
            events={events} coverPhotos={coverPhotos} accent={accent}
            layout={portfolioLayout} onNavigate={handleNav} template={templateValue}
          />
        );
      case 'albums':
        return albums.length > 0 ? (
          <WebsiteAlbums key="albums" id="albums" albums={albums} accent={accent} template={templateValue} />
        ) : null;
      case 'about':
        return studio.bio ? (
          <WebsiteAbout key="about" id="about" template={templateValue} branding={branding} />
        ) : null;
      case 'featured':
        return (
          <WebsiteFeatured key="featured" id="featured"
            events={featuredEvents} coverPhotos={coverPhotos}
            accent={accent} onNavigate={handleNav} template={templateValue}
          />
        );
      case 'services':
        return (
          <WebsiteServices key="services" id="services" services={services} accent={accent} template={templateValue} />
        );
      case 'testimonials':
        return testimonials.length > 0 ? (
          <WebsiteTestimonials key="testimonials" id="testimonials" testimonials={testimonials} accent={accent} template={templateValue} />
        ) : null;
      case 'contact':
        return (
          <WebsiteContact key="contact" id="contact" template={templateValue} branding={branding} photographerId={studio.user_id} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
      {sectionOrder.map(renderSection)}
      <WebsiteFooter template={templateValue} branding={branding} />
    </div>
  );
};

export default PhotographerFeed;
