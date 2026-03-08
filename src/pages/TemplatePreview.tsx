import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Monitor, Tablet, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTemplate, type WebsiteTemplateValue, WEBSITE_TEMPLATES } from '@/lib/website-templates';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsitePortfolio } from '@/components/website/WebsitePortfolio';
import { WebsiteFeatured } from '@/components/website/WebsiteFeatured';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteServices, type ServiceItem } from '@/components/website/WebsiteServices';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteSocialBar } from '@/components/website/WebsiteSocialBar';
import { WebsiteTestimonials, type Testimonial } from '@/components/website/WebsiteTestimonials';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { WebsitePhotoShowcase } from '@/components/website/WebsitePhotoShowcase';
import { WebsiteInterstitial } from '@/components/website/WebsiteInterstitial';
import { WebsiteInstagramGrid } from '@/components/website/WebsiteInstagramGrid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

// ── Demo content so templates feel like finished websites ──

const DEMO_BRANDING = {
  studio_name: 'Arjun Kapoor Photography',
  studio_logo_url: null,
  studio_accent_color: '#B08D57',
  display_name: 'Not Just Photos',
  bio: "I'm Arjun. My journey started quietly, capturing candid moments for friends. One wedding changed everything — I realised these memories aren't just photos, they become legacy.\n\nFrom the first conversation to the final frame, I hold one promise — your story deserves to be remembered with intention and excellence. I bring not just skill, but sensitivity, timing, and a quiet presence that lets emotions unfold naturally. From grand palace celebrations to intimate beachfront vows, I capture love with honesty, elegance, and timeless storytelling.",
  cover_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80',
  instagram: '@arjunkapoor.photo',
  website: 'www.arjunkapoor.photo',
  whatsapp: '+919876543210',
  email: 'hello@arjunkapoor.photo',
  footer_text: 'Vows Through Lens',
  hero_button_label: 'Get Quote',
  hero_button_url: '#contact',
};

const DEMO_EVENTS = [
  { id: '1', name: 'Priya & Rahul Wedding', slug: 'demo-1', event_date: '2025-12-15', location: 'Udaipur, Rajasthan', cover_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', photo_count: 450, event_type: 'Wedding' },
  { id: '2', name: 'Ananya & Dev Pre-Wedding', slug: 'demo-2', event_date: '2025-11-20', location: 'Goa', cover_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80', photo_count: 180, event_type: 'Pre Wedding' },
  { id: '3', name: 'Meera & Arjun Engagement', slug: 'demo-3', event_date: '2025-10-05', location: 'Mumbai', cover_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80', photo_count: 120, event_type: 'Engagement' },
  { id: '4', name: 'Neha & Vikram Destination', slug: 'demo-4', event_date: '2025-09-18', location: 'Jaipur', cover_url: 'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=800&q=80', photo_count: 380, event_type: 'Wedding' },
  { id: '5', name: 'Ritu & Sanjay Reception', slug: 'demo-5', event_date: '2025-08-25', location: 'Delhi', cover_url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', photo_count: 220, event_type: 'Reception' },
  { id: '6', name: 'Kavya & Aditya Haldi', slug: 'demo-6', event_date: '2025-07-12', location: 'Pune', cover_url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80', photo_count: 95, event_type: 'Haldi' },
];

const DEMO_FEATURED = [
  { id: '1', name: 'Priya & Rahul', slug: 'demo-1', cover_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', event_type: 'Wedding' },
  { id: '2', name: 'Ananya & Dev', slug: 'demo-2', cover_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80', event_type: 'Pre Wedding' },
  { id: '4', name: 'Neha & Vikram', slug: 'demo-4', cover_url: 'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=800&q=80', event_type: 'Destination Wedding' },
];

const DEMO_SERVICES: ServiceItem[] = [
  { title: 'Wedding Photography', description: 'Full-day coverage of your wedding ceremony, from getting ready to the last dance.', icon: 'camera', price: '₹1,50,000' },
  { title: 'Pre-Wedding Shoot', description: 'A cinematic pre-wedding session at a location of your choice.', icon: 'heart', price: '₹45,000' },
  { title: 'Destination Wedding', description: 'Travel anywhere in India or abroad to capture your destination celebration.', icon: 'location', price: '₹3,00,000' },
  { title: 'Couple Portraits', description: 'Intimate couple portrait sessions for anniversaries and special occasions.', icon: 'people', price: '₹25,000' },
];

const DEMO_TESTIMONIALS: Testimonial[] = [
  { clientName: 'Jasmin & Nivin', review: 'Choosing this studio was hands down the best decision we made for our wedding. Their energy, creativity, and calm nature made the whole experience stress-free. When we got the photos, it felt like reliving every emotion all over again.', rating: 5 },
  { clientName: 'Sneha & Nikhil', review: 'They didn\'t just take photos — they captured our story. Every frame has so much emotion and depth. We couldn\'t be happier.', rating: 5 },
];

const DEMO_SHOWCASE_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=600&q=80' },
  { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80' },
];

const DEMO_IG_PHOTOS = [
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=80',
  'https://images.unsplash.com/photo-1606216794079-73f85bbd57d5?w=400&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
  'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=400&q=80',
];

type ViewMode = 'desktop' | 'tablet' | 'mobile';

export default function TemplatePreview() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const templateValue = (params.get('template') || 'vows-elegance') as WebsiteTemplateValue;
  const tmpl = getTemplate(templateValue);
  const templateInfo = WEBSITE_TEMPLATES.find(t => t.value === templateValue);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [choosing, setChoosing] = useState(false);

  const isVows = templateValue === 'vows-elegance';

  const handleUseTemplate = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setChoosing(true);
    try {
      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any)
        .eq('user_id', user.id).maybeSingle();
      if (existing) {
        await (supabase.from('studio_profiles').update({ website_template: templateValue } as any) as any)
          .eq('user_id', user.id);
      } else {
        await (supabase.from('studio_profiles').insert({ user_id: user.id, website_template: templateValue } as any) as any);
      }
      toast.success(`Template "${templateInfo?.label}" selected`);
      navigate('/dashboard/website-editor');
    } catch {
      toast.error('Failed to select template');
    }
    setChoosing(false);
  };

  // ── Vows Elegance section order (matches reference site) ──
  const vowsSections = [
    'hero',
    'showcase',        // Masonry photo wall
    'interstitial',    // "Captured with Heart"
    'about',
    'featured',        // Gallery stories
    'testimonials',
    'services',
    'contact',         // "Let's Connect"
    'instagram',       // Instagram grid
  ];

  const standardSections = ['hero', 'social', 'portfolio', 'about', 'featured', 'services', 'contact'];

  const renderVowsSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return <WebsiteHero key="hero" branding={DEMO_BRANDING} template={templateValue} />;
      case 'showcase':
        return <WebsitePhotoShowcase key="showcase" photos={DEMO_SHOWCASE_PHOTOS} accent={DEMO_BRANDING.studio_accent_color} template={templateValue} />;
      case 'interstitial':
        return (
          <WebsiteInterstitial
            key="interstitial"
            titleLines={['Captured With', 'Heart']}
            subtitle="These aren't just photos — they are pieces of our heart"
            accent={DEMO_BRANDING.studio_accent_color}
            template={templateValue}
          />
        );
      case 'about':
        return <WebsiteAbout key="about" template={templateValue} branding={DEMO_BRANDING} />;
      case 'featured':
        return <WebsiteFeatured key="featured" events={DEMO_FEATURED} coverPhotos={{}} accent={DEMO_BRANDING.studio_accent_color} onNavigate={() => {}} template={templateValue} />;
      case 'testimonials':
        return <WebsiteTestimonials key="testimonials" testimonials={DEMO_TESTIMONIALS} accent={DEMO_BRANDING.studio_accent_color} template={templateValue} />;
      case 'services':
        return <WebsiteServices key="services" services={DEMO_SERVICES} accent={DEMO_BRANDING.studio_accent_color} template={templateValue} />;
      case 'contact':
        return <WebsiteContact key="contact" template={templateValue} branding={DEMO_BRANDING} />;
      case 'instagram':
        return <WebsiteInstagramGrid key="instagram" photos={DEMO_IG_PHOTOS} instagramHandle={DEMO_BRANDING.instagram} accent={DEMO_BRANDING.studio_accent_color} template={templateValue} />;
      default:
        return null;
    }
  };

  const renderStandardSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return <WebsiteHero key="hero" branding={DEMO_BRANDING} template={templateValue} />;
      case 'social':
        return <WebsiteSocialBar key="social" instagram={DEMO_BRANDING.instagram} website={DEMO_BRANDING.website} whatsapp={DEMO_BRANDING.whatsapp} email={DEMO_BRANDING.email} accent={DEMO_BRANDING.studio_accent_color} template={templateValue} />;
      case 'portfolio':
        return <WebsitePortfolio key="portfolio" events={DEMO_EVENTS} coverPhotos={{}} accent={DEMO_BRANDING.studio_accent_color} layout="grid" onNavigate={() => {}} template={templateValue} />;
      case 'about':
        return <WebsiteAbout key="about" template={templateValue} branding={DEMO_BRANDING} />;
      case 'featured':
        return <WebsiteFeatured key="featured" events={DEMO_FEATURED} coverPhotos={{}} accent={DEMO_BRANDING.studio_accent_color} onNavigate={() => {}} template={templateValue} />;
      case 'services':
        return <WebsiteServices key="services" services={DEMO_SERVICES} accent={DEMO_BRANDING.studio_accent_color} template={templateValue} />;
      case 'contact':
        return <WebsiteContact key="contact" template={templateValue} branding={DEMO_BRANDING} />;
      default:
        return null;
    }
  };

  const sections = isVows ? vowsSections : standardSections;
  const renderSection = isVows ? renderVowsSection : renderStandardSection;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Sticky Top Bar ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/branding')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-semibold text-foreground">{templateInfo?.label || 'Template Preview'}</p>
            <p className="text-[10px] text-muted-foreground/50">{templateInfo?.description}</p>
          </div>
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [ViewMode, any][]).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-full transition-colors ${viewMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1.5" onClick={() => navigate('/dashboard/branding')}>
            <X className="h-3 w-3" /> Close
          </Button>
          <Button
            size="sm"
            className="text-[10px] h-8 gap-1.5 bg-primary text-primary-foreground"
            onClick={handleUseTemplate}
            disabled={choosing}
          >
            <Pencil className="h-3 w-3" />
            {choosing ? 'Setting up…' : 'Edit This Website'}
          </Button>
        </div>
      </header>

      {/* ── Preview Area ── */}
      <main className="flex-1 bg-muted/30 overflow-y-auto flex justify-center py-6 px-4">
        <div className={`transition-all duration-300 w-full ${
          viewMode === 'mobile' ? 'max-w-[375px]' : viewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[1280px]'
        }`}>
          <div
            className="rounded-2xl overflow-hidden border-2 shadow-2xl border-foreground/10"
            style={{ backgroundColor: tmpl.bg }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 border-b"
              style={{ backgroundColor: tmpl.navBg, borderColor: tmpl.navBorder }}
            >
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-destructive/60" />
                <div className="w-2 h-2 rounded-full bg-accent/60" />
                <div className="w-2 h-2 rounded-full bg-primary/60" />
              </div>
              <div
                className="flex-1 text-center text-[9px] font-mono truncate px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${tmpl.text}08`, color: tmpl.textSecondary }}
              >
                mirroraigallery.com/studio/yourstudio
              </div>
            </div>

            {/* Demo website content */}
            <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
              {sections.map(sectionId => renderSection(sectionId))}
              <WebsiteFooter template={templateValue} branding={DEMO_BRANDING} />
            </div>
          </div>

          {/* CTA at bottom */}
          <div className="flex items-center justify-center py-8">
            <Button
              size="lg"
              className="gap-2 bg-primary text-primary-foreground px-8"
              onClick={handleUseTemplate}
              disabled={choosing}
            >
              <Pencil className="h-4 w-4" />
              {choosing ? 'Setting up…' : 'Use This Template & Start Editing'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
