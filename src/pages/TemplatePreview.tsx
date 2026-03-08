import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Monitor, Tablet, Smartphone, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type WebsiteTemplateValue, type SectionConfigItem } from '@/lib/website-templates';
import { useWebsiteTemplates } from '@/hooks/use-website-templates';
import { cacheBust, cacheBustArray } from '@/lib/cache-bust';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsitePhotoShowcase } from '@/components/website/WebsitePhotoShowcase';
import { WebsiteServices } from '@/components/website/WebsiteServices';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteInstagramGrid } from '@/components/website/WebsiteInstagramGrid';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { WebsiteCinematicGallery } from '@/components/website/WebsiteCinematicGallery';
import { WebsiteCinematicFilms, type FilmItem } from '@/components/website/WebsiteCinematicFilms';
import { WebsiteCinematicSocialGrid } from '@/components/website/WebsiteCinematicSocialGrid';
import { WebsiteCinematicInquiry } from '@/components/website/WebsiteCinematicInquiry';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const DEFAULT_SECTIONS: SectionConfigItem[] = [
  { id: 'hero', enabled: true, order: 0 },
  { id: 'portfolio', enabled: true, order: 1 },
  { id: 'featured_stories', enabled: false, order: 2 },
  { id: 'gallery', enabled: false, order: 3 },
  { id: 'about', enabled: true, order: 4 },
  { id: 'services', enabled: false, order: 5 },
  { id: 'films', enabled: false, order: 6 },
  { id: 'testimonials', enabled: false, order: 7 },
  { id: 'instagram', enabled: false, order: 8 },
  { id: 'contact', enabled: true, order: 9 },
  { id: 'footer', enabled: true, order: 10 },
];

export default function TemplatePreview() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allTemplates = [] } = useWebsiteTemplates();
  const templateValue = (params.get('template') || '') as WebsiteTemplateValue;
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [choosing, setChoosing] = useState(false);

  const tmpl = useMemo(() => {
    if (!allTemplates.length) return null;
    return allTemplates.find((t) => t.value === templateValue) || allTemplates[0];
  }, [allTemplates, templateValue]);

  // Get ordered enabled sections from section_config
  const enabledSections = useMemo(() => {
    const sections = tmpl?.sectionConfig?.sections || DEFAULT_SECTIONS;
    return [...sections].filter(s => s.enabled).sort((a, b) => a.order - b.order);
  }, [tmpl]);

  const demoImages = useMemo(() => cacheBustArray(tmpl?.demoContent?.portfolio?.demo_images || []), [tmpl]);
  const galleryImages = useMemo(() => cacheBustArray(tmpl?.demoContent?.gallery_images || tmpl?.demoContent?.portfolio?.demo_images || []), [tmpl]);
  const socialImages = useMemo(() => cacheBustArray(tmpl?.demoContent?.social_images || tmpl?.demoContent?.portfolio?.demo_images?.slice(0, 6) || []), [tmpl]);
  const demoServices = tmpl?.demoContent?.services || [];

  const featuredStories = useMemo(() => {
    return (tmpl?.demoContent?.featured_stories || []).map(s => ({
      ...s,
      image_url: cacheBust(s.image_url),
    }));
  }, [tmpl]);

  const films: FilmItem[] = useMemo(() => {
    return (tmpl?.demoContent?.films || []).map(f => ({
      title: f.title,
      thumbnailUrl: cacheBust(f.thumbnail_url),
      videoUrl: f.video_url,
    }));
  }, [tmpl]);

  const testimonials = tmpl?.demoContent?.testimonials || [];

  const previewBranding = useMemo(() => {
    if (!tmpl) return null;
    return {
      studio_name: tmpl.label || 'Studio',
      studio_logo_url: null,
      studio_accent_color: tmpl.textSecondary,
      display_name: tmpl.demoContent?.hero?.tagline || 'Wedding Storytelling',
      cover_url: cacheBust(tmpl.demoContent?.hero?.image_url),
      about_image_url: cacheBust(tmpl.demoContent?.about?.profile_image_url),
      bio: tmpl.demoContent?.about?.bio || '',
      instagram: '@studio',
      website: '',
      whatsapp: '',
      email: tmpl.demoContent?.footer?.email || 'hello@studio.com',
      footer_text: tmpl.demoContent?.footer?.text || '',
      hero_button_label: tmpl.demoContent?.hero?.button_text || 'View Portfolio',
      hero_button_url: '#portfolio',
    };
  }, [tmpl]);

  const handleUseTemplate = async () => {
    if (!user) { navigate('/login'); return; }
    if (!tmpl?.value) return;
    setChoosing(true);
    try {
      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any)
        .eq('user_id', user.id).maybeSingle();
      if (existing) {
        await (supabase.from('studio_profiles').update({ website_template: tmpl.value } as any) as any).eq('user_id', user.id);
      } else {
        await (supabase.from('studio_profiles').insert({ user_id: user.id, website_template: tmpl.value } as any) as any);
      }
      toast.success('Template selected successfully');
      navigate('/dashboard/website-editor');
    } catch { toast.error('Failed to select template'); }
    setChoosing(false);
  };

  if (!tmpl || !previewBranding) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        No templates available yet.
      </div>
    );
  }

  const cols = tmpl.stylingConfig?.galleryColumnsDesktop || 3;

  /* Render a section by its id */
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return <WebsiteHero key="hero" branding={previewBranding} template={tmpl.value} />;

      case 'portfolio':
        return demoImages.length > 0 ? (
          <WebsitePhotoShowcase
            key="portfolio"
            id="portfolio"
            photos={demoImages.map(url => ({ url }))}
            accent={previewBranding.studio_accent_color || tmpl.textSecondary}
            template={tmpl.value}
          />
        ) : null;

      case 'featured_stories':
        return featuredStories.length > 0 ? (
          <section key="featured-stories" id="featured-stories" className="py-20 sm:py-28 px-6 sm:px-12" style={{ backgroundColor: '#FAF8F5' }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4" style={{ color: '#7A756E', fontFamily: '"DM Sans", sans-serif' }}>Featured</p>
                <h2 className="text-3xl sm:text-5xl font-light lowercase tracking-[0.02em]" style={{ fontFamily: tmpl.fontFamily, color: '#1A1715' }}>wedding stories</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredStories.map((story, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="relative overflow-hidden aspect-[3/4]">
                      <img src={story.image_url} alt={story.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-lg font-light tracking-wide" style={{ color: '#FAF8F5', fontFamily: tmpl.fontFamily }}>{story.title}</h3>
                        <p className="text-[10px] uppercase tracking-[0.2em] mt-1" style={{ color: 'rgba(250,248,245,0.6)', fontFamily: '"DM Sans", sans-serif' }}>{story.location}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null;

      case 'gallery':
        return galleryImages.length > 0 ? (
          <WebsiteCinematicGallery key="gallery" id="gallery" photos={galleryImages.map(url => ({ url }))} />
        ) : null;

      case 'about':
        return <WebsiteAbout key="about" id="about" template={tmpl.value} branding={previewBranding} />;

      case 'services':
        return demoServices.length > 0 ? (
          <WebsiteServices key="services" id="services" services={demoServices} accent={previewBranding.studio_accent_color || tmpl.textSecondary} template={tmpl.value} />
        ) : null;

      case 'films':
        return films.length > 0 ? (
          <WebsiteCinematicFilms key="films" id="films" films={films} />
        ) : null;

      case 'testimonials':
        return testimonials.length > 0 ? (
          <section key="testimonials" className="py-16 sm:py-24 px-6 sm:px-12" style={{ backgroundColor: tmpl.cardBg }}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-4xl font-light mb-10" style={{ fontFamily: tmpl.fontFamily }}>What Clients Say</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {testimonials.map((t, i) => (
                  <div key={i} className="rounded-lg border p-6 text-left" style={{ borderColor: tmpl.navBorder }}>
                    <p className="italic leading-relaxed mb-3" style={{ color: tmpl.textSecondary, fontSize: 14 }}>"{t.text}"</p>
                    <p className="text-sm font-semibold">{t.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null;

      case 'instagram':
        return socialImages.length > 0 ? (
          <WebsiteCinematicSocialGrid key="instagram" id="instagram" photos={socialImages} instagramHandle={previewBranding.instagram || '@studio'} />
        ) : (
          <WebsiteInstagramGrid key="instagram" id="instagram" photos={socialImages} instagramHandle={previewBranding.instagram || '@studio'} accent={previewBranding.studio_accent_color || tmpl.textSecondary} template={tmpl.value} />
        );

      case 'contact':
        return (
          <WebsiteCinematicInquiry key="contact" id="contact" branding={previewBranding} />
        );

      case 'footer':
        return <WebsiteFooter key="footer" template={tmpl.value} branding={previewBranding} />;

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/branding')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <p className="text-xs font-semibold text-foreground">Website Preview</p>
          <span className="text-[10px] text-muted-foreground capitalize">{tmpl.category}</span>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [ViewMode, any][]).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1.5" onClick={() => navigate('/dashboard/branding')}>
            <X className="h-3 w-3" /> Close
          </Button>
          <Button size="sm" className="text-[10px] h-8 gap-1.5" onClick={handleUseTemplate} disabled={choosing}>
            <Pencil className="h-3 w-3" />
            {choosing ? 'Setting up…' : 'Edit This Website'}
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-muted/30 overflow-y-auto flex justify-center py-6 px-4">
        <div
          className={`transition-all duration-300 w-full ${
            viewMode === 'mobile' ? 'max-w-[375px]' : viewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[1400px]'
          }`}
        >
          <div className="rounded-2xl overflow-hidden border-2 shadow-2xl border-foreground/10" style={{ backgroundColor: tmpl.bg }}>
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ backgroundColor: tmpl.navBg, borderColor: tmpl.navBorder }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/60" />
                <div className="w-2 h-2 rounded-full bg-accent/60" />
                <div className="w-2 h-2 rounded-full bg-primary/60" />
              </div>
              <div
                className="flex-1 text-center text-[9px] font-mono truncate px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${tmpl.text}08`, color: tmpl.textSecondary }}
              >
                mirrorai.gallery/studio/yourstudio
              </div>
            </div>

            <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
              {enabledSections.map(section => renderSection(section.id))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
