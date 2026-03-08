import { useState, useEffect } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { getStudioDisplayUrl } from '@/lib/studio-url';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsitePortfolio } from '@/components/website/WebsitePortfolio';
import { WebsiteFeatured } from '@/components/website/WebsiteFeatured';
import { WebsiteServices, type ServiceItem } from '@/components/website/WebsiteServices';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteSocialBar } from '@/components/website/WebsiteSocialBar';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { WebsiteTestimonials, type Testimonial } from '@/components/website/WebsiteTestimonials';
import { WebsiteAlbums, type PortfolioAlbum } from '@/components/website/WebsiteAlbums';
import { getTemplate, type WebsiteTemplateValue } from '@/lib/website-templates';
import { supabase } from '@/integrations/supabase/client';

interface SectionConfig {
  id: string;
  enabled: boolean;
}

interface Branding {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string;
  bio: string;
  display_name: string;
  instagram: string;
  website: string;
  whatsapp: string;
  email: string;
  footer_text: string;
  cover_url: string | null;
  hero_button_label: string;
  hero_button_url: string;
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

interface StudioLivePreviewProps {
  branding: Branding;
  template: WebsiteTemplateValue;
  sections: SectionConfig[];
  accent: string;
  services: ServiceItem[];
  testimonials: Testimonial[];
  featuredGalleryIds: string[];
  portfolioLayout: 'grid' | 'masonry' | 'large';
  userId: string;
  photographerId?: string;
}

export function StudioLivePreview({
  branding,
  template,
  sections,
  accent,
  services,
  testimonials,
  featuredGalleryIds,
  portfolioLayout,
  userId,
  photographerId,
}: StudioLivePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);

  const tmpl = getTemplate(template);

  // Load real data
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const [evRes, albumRes] = await Promise.all([
        (supabase.from('events')
          .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .eq('user_id', userId)
          .eq('is_published', true)
          .eq('feed_visible', true)
          .order('event_date', { ascending: false })
          .limit(12),
        (supabase.from('portfolio_albums')
          .select('id, title, description, cover_url, category, photo_urls') as any)
          .eq('user_id', userId)
          .eq('is_visible', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (cancelled) return;
      const typedEvents = (evRes.data || []) as unknown as FeedEvent[];
      setEvents(typedEvents);
      setAlbums((albumRes.data || []) as unknown as PortfolioAlbum[]);

      // Featured
      if (featuredGalleryIds.length > 0) {
        const { data: fData } = await (supabase.from('events')
          .select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .in('id', featuredGalleryIds)
          .eq('is_published', true);
        if (!cancelled) setFeaturedEvents((fData || []) as unknown as FeedEvent[]);
      } else {
        setFeaturedEvents([]);
      }

      // Fallback covers
      const noCover = typedEvents.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const photos: Record<string, string> = {};
        for (const ev of noCover) {
          const { data: p } = await (supabase.from('photos').select('url') as any).eq('event_id', ev.id).limit(1);
          if (p?.[0]?.url) photos[ev.id] = p[0].url;
        }
        if (!cancelled) setCoverPhotos(photos);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, featuredGalleryIds]);

  const isVisible = (id: string) => {
    const s = sections.find(sec => sec.id === id);
    return s ? s.enabled : false;
  };

  const orderedSections = sections.filter(s => s.enabled);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return <WebsiteHero key="hero" branding={branding} id="hero" />;
      case 'social':
        return (
          <WebsiteSocialBar key="social" id="social"
            instagram={branding.instagram} website={branding.website}
            whatsapp={branding.whatsapp} email={branding.email}
            accent={accent} template={template}
          />
        );
      case 'portfolio':
        return (
          <WebsitePortfolio key="portfolio" id="portfolio"
            events={events} coverPhotos={coverPhotos} accent={accent}
            layout={portfolioLayout} onNavigate={() => {}} template={template}
          />
        );
      case 'albums':
        return albums.length > 0 ? (
          <WebsiteAlbums key="albums" id="albums" albums={albums} accent={accent} template={template} />
        ) : null;
      case 'about':
        return branding.bio ? (
          <WebsiteAbout key="about" id="about" template={template} branding={branding} />
        ) : null;
      case 'featured':
        return featuredEvents.length > 0 ? (
          <WebsiteFeatured key="featured" id="featured"
            events={featuredEvents} coverPhotos={coverPhotos}
            accent={accent} onNavigate={() => {}} template={template}
          />
        ) : null;
      case 'services':
        return services.length > 0 ? (
          <WebsiteServices key="services" id="services" services={services} accent={accent} />
        ) : null;
      case 'testimonials':
        return testimonials.length > 0 ? (
          <WebsiteTestimonials key="testimonials" id="testimonials" testimonials={testimonials} accent={accent} />
        ) : null;
      case 'contact':
        return (
          <WebsiteContact key="contact" id="contact" template={template} branding={branding} photographerId={photographerId || userId} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium">STUDIO PAGE PREVIEW</p>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">Live preview of your public page</p>
        </div>
        <div className="flex bg-muted rounded-full p-0.5">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'desktop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Monitor className="h-3 w-3" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Smartphone className="h-3 w-3" />
            Mobile
          </button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className={`mx-auto transition-all duration-300 ${
        viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
      }`}>
        <div
          className={`rounded-2xl overflow-hidden border-2 shadow-2xl ${
            viewMode === 'mobile' ? 'border-foreground/10' : 'border-border/30'
          }`}
          style={{ backgroundColor: tmpl.bg }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-1.5 px-3 py-2 border-b"
            style={{ backgroundColor: tmpl.navBg, borderColor: tmpl.navBorder }}
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
            </div>
            <div
              className="flex-1 text-center text-[9px] font-mono truncate px-2 py-0.5 rounded-md"
              style={{ backgroundColor: `${tmpl.text}08`, color: tmpl.textSecondary }}
            >
              {getStudioDisplayUrl(branding.studio_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'yourstudio')}
            </div>
          </div>

          {/* Scrollable content */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: viewMode === 'mobile' ? '600px' : '500px',
              backgroundColor: tmpl.bg,
              color: tmpl.text,
              fontFamily: tmpl.uiFontFamily,
            }}
          >
            {orderedSections.map(section => renderSection(section.id))}
            <WebsiteFooter template={template} branding={branding} />
          </div>
        </div>
      </div>
    </div>
  );
}
