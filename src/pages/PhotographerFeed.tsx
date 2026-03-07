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
import { WebsiteFooter } from '@/components/website/WebsiteFooter';

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

const PhotographerFeed = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [studio, setStudio] = useState<StudioData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data: studioData } = await (supabase
        .from('studio_profiles')
        .select('*') as any)
        .eq('username', username)
        .maybeSingle();

      if (!studioData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const sd = studioData as unknown as StudioData;
      setStudio(sd);

      const { data: profileData } = await (supabase
        .from('profiles')
        .select('studio_name, studio_logo_url, studio_accent_color, email') as any)
        .eq('user_id', sd.user_id)
        .maybeSingle();
      if (profileData) setProfile(profileData as unknown as ProfileData);

      // Fetch feed-visible published events
      const { data: eventsData } = await (supabase
        .from('events')
        .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
        .eq('user_id', sd.user_id)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false });

      const typedEvents = (eventsData || []) as unknown as FeedEvent[];
      setEvents(typedEvents);

      // Fetch featured events
      const featIds = sd.featured_gallery_ids || [];
      if (featIds.length > 0) {
        const { data: featData } = await (supabase
          .from('events')
          .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .in('id', featIds)
          .eq('is_published', true);
        setFeaturedEvents((featData || []) as unknown as FeedEvent[]);
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
        setCoverPhotos(photos);
      }

      setLoading(false);
    })();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0C0B08' }}>
        <Skeleton className="h-[80vh] w-full rounded-none" />
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (notFound || !studio) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C0B08' }}>
        <div className="text-center">
          <h1
            className="text-3xl font-light"
            style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}
          >
            Photographer Not Found
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#A6A197' }}>
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
          <WebsiteSocialBar
            key="social"
            id="social"
            instagram={studio.instagram}
            website={studio.website}
            whatsapp={studio.whatsapp}
            email={profile?.email}
            accent={accent}
          />
        );
      case 'portfolio':
        return (
          <WebsitePortfolio
            key="portfolio"
            id="portfolio"
            events={events}
            coverPhotos={coverPhotos}
            accent={accent}
            layout={portfolioLayout}
            onNavigate={handleNav}
          />
        );
      case 'about':
        return studio.bio ? (
          <WebsiteAbout
            key="about"
            id="about"
            template="modern-portfolio"
            branding={branding}
          />
        ) : null;
      case 'featured':
        return (
          <WebsiteFeatured
            key="featured"
            id="featured"
            events={featuredEvents}
            coverPhotos={coverPhotos}
            accent={accent}
            onNavigate={handleNav}
          />
        );
      case 'services':
        return (
          <WebsiteServices
            key="services"
            id="services"
            services={services}
            accent={accent}
          />
        );
      case 'contact':
        return (
          <WebsiteContact
            key="contact"
            id="contact"
            template="modern-portfolio"
            branding={branding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#0C0B08', color: '#EDEAE3', fontFamily: "'DM Sans', sans-serif" }}
    >
      {sectionOrder.map(renderSection)}

      {/* Footer always at bottom */}
      <div className="text-center py-12 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {profile?.studio_logo_url ? (
          <img src={profile.studio_logo_url} alt="" className="h-8 mx-auto object-contain opacity-50 mb-4" />
        ) : (
          <p
            className="text-sm font-medium tracking-[0.15em] uppercase mb-4"
            style={{ color: '#EDEAE3', opacity: 0.5 }}
          >
            {profile?.studio_name || 'Studio'}
          </p>
        )}
        {studio.footer_text && (
          <p className="text-xs mb-3" style={{ color: '#A6A197', opacity: 0.5 }}>
            {studio.footer_text}
          </p>
        )}
        <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#A6A197', opacity: 0.4 }}>
          © {new Date().getFullYear()} {profile?.studio_name || 'Studio'}
        </p>
        <p className="text-[8px] tracking-[0.14em] uppercase mt-1" style={{ color: '#A6A197', opacity: 0.2 }}>
          Powered by MirrorAI
        </p>
      </div>
    </div>
  );
};

export default PhotographerFeed;
