import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsitePortfolio } from '@/components/website/WebsitePortfolio';
import { WebsiteFeatured } from '@/components/website/WebsiteFeatured';
import { WebsiteServices, type ServiceItem } from '@/components/website/WebsiteServices';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteSocialBar } from '@/components/website/WebsiteSocialBar';
import { Instagram, Globe, MessageCircle, Mail } from 'lucide-react';

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

const DEFAULT_ORDER = ['hero', 'social', 'portfolio', 'about', 'featured', 'services', 'contact'];
const DEFAULT_VISIBILITY: Record<string, boolean> = {
  hero: true, social: true, portfolio: true, about: true,
  featured: true, services: false, contact: true,
};

// ── Data Hook ──────────────────────────────────────────
function useFeedData(username: string | undefined) {
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
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

      const { data: profileData } = await (supabase
        .from('profiles')
        .select('studio_name, studio_logo_url, studio_accent_color, email') as any)
        .eq('user_id', sd.user_id)
        .maybeSingle();
      if (cancelled) return;
      if (profileData) setProfile(profileData as unknown as ProfileData);

      const { data: eventsData } = await (supabase
        .from('events')
        .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
        .eq('user_id', sd.user_id)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false });

      if (cancelled) return;
      const typedEvents = (eventsData || []) as unknown as FeedEvent[];
      setEvents(typedEvents);

      const featIds = sd.featured_gallery_ids || [];
      if (featIds.length > 0) {
        const { data: featData } = await (supabase
          .from('events')
          .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .in('id', featIds)
          .eq('is_published', true);
        if (!cancelled) setFeaturedEvents((featData || []) as unknown as FeedEvent[]);
      }

      // Fetch cover photos for events without covers
      const allEvs = [...typedEvents, ...((featIds.length > 0 ? (eventsData || []) : []) as FeedEvent[])];
      const noCover = allEvs.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const photos: Record<string, string> = {};
        for (const ev of noCover) {
          if (photos[ev.id]) continue;
          const { data: p } = await (supabase
            .from('photos')
            .select('url') as any)
            .eq('event_id', ev.id)
            .limit(1);
          if (p?.[0]?.url) photos[ev.id] = p[0].url;
        }
        if (!cancelled) setCoverPhotos(photos);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [username]);

  return { studio, profile, events, featuredEvents, coverPhotos, loading, notFound };
}

// ── Page Component ─────────────────────────────────────
const PhotographerFeed = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { studio, profile, events, featuredEvents, coverPhotos, loading, notFound } = useFeedData(username);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0A0906' }}>
        <Skeleton className="h-screen w-full rounded-none" />
      </div>
    );
  }

  if (notFound || !studio) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0906' }}>
        <div className="text-center px-6">
          <h1
            className="text-4xl font-light"
            style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
          >
            Not Found
          </h1>
          <p className="mt-4 text-sm" style={{ color: '#A6A197' }}>
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
          />
        );
      case 'portfolio':
        return (
          <WebsitePortfolio key="portfolio" id="portfolio"
            events={events} coverPhotos={coverPhotos} accent={accent}
            layout={portfolioLayout} onNavigate={handleNav}
          />
        );
      case 'about':
        return studio.bio ? (
          <WebsiteAbout key="about" id="about" template="dark-portfolio" branding={branding} />
        ) : null;
      case 'featured':
        return (
          <WebsiteFeatured key="featured" id="featured"
            events={featuredEvents} coverPhotos={coverPhotos}
            accent={accent} onNavigate={handleNav}
          />
        );
      case 'services':
        return (
          <WebsiteServices key="services" id="services" services={services} accent={accent} />
        );
      case 'contact':
        return (
          <WebsiteContact key="contact" id="contact" template="dark-portfolio" branding={branding} />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0A0906', color: '#EDEAE3', fontFamily: "'DM Sans', sans-serif" }}
    >
      {sectionOrder.map(renderSection)}

      {/* Premium footer */}
      <footer className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-lg mx-auto text-center space-y-5">
          {profile?.studio_logo_url ? (
            <img src={profile.studio_logo_url} alt="" className="h-8 mx-auto object-contain opacity-40" />
          ) : (
            <p
              className="text-[11px] tracking-[0.2em] uppercase"
              style={{ color: '#EDEAE3', opacity: 0.4 }}
            >
              {profile?.studio_name || 'Studio'}
            </p>
          )}

          {/* Footer social row */}
          <div className="flex items-center justify-center gap-5">
            {studio.instagram && (
              <a href={`https://instagram.com/${studio.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                className="opacity-30 hover:opacity-60 transition-opacity">
                <Instagram className="h-4 w-4" style={{ color: '#EDEAE3' }} />
              </a>
            )}
            {studio.website && (
              <a href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`} target="_blank" rel="noopener noreferrer"
                className="opacity-30 hover:opacity-60 transition-opacity">
                <Globe className="h-4 w-4" style={{ color: '#EDEAE3' }} />
              </a>
            )}
            {studio.whatsapp && (
              <a href={`https://wa.me/${studio.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="opacity-30 hover:opacity-60 transition-opacity">
                <MessageCircle className="h-4 w-4" style={{ color: '#EDEAE3' }} />
              </a>
            )}
            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="opacity-30 hover:opacity-60 transition-opacity">
                <Mail className="h-4 w-4" style={{ color: '#EDEAE3' }} />
              </a>
            )}
          </div>

          {studio.footer_text && (
            <p className="text-xs" style={{ color: '#A6A197', opacity: 0.4 }}>
              {studio.footer_text}
            </p>
          )}

          <div className="space-y-1 pt-2">
            <p className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#A6A197', opacity: 0.3 }}>
              © {new Date().getFullYear()} {profile?.studio_name || 'Studio'}
            </p>
            <p className="text-[8px] tracking-[0.14em] uppercase" style={{ color: '#A6A197', opacity: 0.15 }}>
              Powered by MirrorAI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PhotographerFeed;
