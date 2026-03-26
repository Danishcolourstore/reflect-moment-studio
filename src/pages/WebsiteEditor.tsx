import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Tablet, Smartphone, Globe, Loader2, Eye, GripVertical, ChevronDown, ChevronRight, EyeOff, Plus, Trash2, Upload, X, ExternalLink, Pencil, LayoutGrid, Save, AlertTriangle, SplitSquareHorizontal, RotateCcw, Maximize2 } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSectionDrawer } from '@/components/website-editor/MobileSectionDrawer';
import { MobileEditorPanel } from '@/components/website-editor/MobileEditorPanel';
import { WebsiteImageUploader, WebsiteImageGridUploader } from '@/components/website-editor/WebsiteImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { getTemplate, type WebsiteTemplateValue, type WebsiteTemplateConfig } from '@/lib/website-templates';
import { useWebsiteTemplates } from '@/hooks/use-website-templates';
import { getStudioUrl, getStudioDisplayUrl } from '@/lib/studio-url';

// Website image data structure (independent of events/galleries)
interface WebsiteImages {
  hero_cover?: string | null;
  about_photo?: string | null;
  portfolio_photos?: string[];
  featured_photos?: string[];
  latest_works_photos?: string[];
  image_strip_photos?: string[];
  newsletter_title?: string;
  newsletter_description?: string;
  newsletter_button_text?: string;
  latest_works_title?: string;
  // Cinematic Wedding Story sections
  featured_galleries?: { title: string; location: string; imageUrl: string }[];
  storytelling_headline?: string;
  storytelling_paragraph?: string;
  storytelling_bg_image?: string | null;
  process_title?: string;
  process_blocks?: { title: string; description: string; imageUrl?: string }[];
  journal_entries?: { title: string; imageUrl?: string; date?: string }[];
  inquiry_heading?: string;
  inquiry_subheading?: string;
  inquiry_bg_image?: string | null;
}

// Website section components
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
import { WebsiteLatestWorks } from '@/components/website/WebsiteLatestWorks';
import { WebsiteNewsletter } from '@/components/website/WebsiteNewsletter';
import { WebsiteImageStrip } from '@/components/website/WebsiteImageStrip';
import { WebsiteFeaturedGalleries, type FeaturedGalleryItem } from '@/components/website/WebsiteFeaturedGalleries';
import { WebsiteStorytelling } from '@/components/website/WebsiteStorytelling';
import { WebsiteProcessSection, type ProcessBlock } from '@/components/website/WebsiteProcessSection';
import { WebsiteJournal, type JournalEntry } from '@/components/website/WebsiteJournal';
import { WebsiteInquiryForm } from '@/components/website/WebsiteInquiryForm';

// ── Section metadata ──
const ALL_SECTIONS = [
  { id: 'hero', label: 'Hero', icon: '🖼️' },
  { id: 'social', label: 'Social Bar', icon: '🔗' },
  { id: 'featured_galleries', label: 'Featured Galleries', icon: '🏛️' },
  { id: 'storytelling', label: 'Storytelling', icon: '✨' },
  { id: 'portfolio', label: 'Portfolio', icon: '📷' },
  { id: 'latest_works', label: 'Latest Works', icon: '🎯' },
  { id: 'albums', label: 'Albums', icon: '📁' },
  { id: 'about', label: 'About', icon: '👤' },
  { id: 'featured', label: 'Featured Work', icon: '⭐' },
  { id: 'process', label: 'Style & Process', icon: '🎨' },
  { id: 'services', label: 'Services', icon: '💼' },
  { id: 'testimonials', label: 'Testimonials', icon: '💬' },
  { id: 'journal', label: 'Journal', icon: '📖' },
  { id: 'newsletter', label: 'Newsletter', icon: '📬' },
  { id: 'image_strip', label: 'Image Strip', icon: '🎞️' },
  { id: 'inquiry', label: 'Inquiry Form', icon: '💌' },
  { id: 'contact', label: 'Contact', icon: '✉️' },
] as const;

type ViewMode = 'desktop' | 'tablet' | 'mobile';

const WebsiteEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isMobile = useIsMobile();

  // ── Loading state ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── View state ──
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // ── Mobile editor state ──
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<'preview' | 'edit' | 'landscape'>('preview');


  // ── Branding data (from profiles + studio_profiles) ──
  const [studioName, setStudioName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#b08d57');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [footerText, setFooterText] = useState('');
  const [username, setUsername] = useState('');
  const [heroButtonLabel, setHeroButtonLabel] = useState('View Portfolio');
  const [heroButtonUrl, setHeroButtonUrl] = useState('#portfolio');

  // ── Template & layout ──
  const [websiteTemplate, setWebsiteTemplate] = useState<WebsiteTemplateValue>('vows-elegance');
  const [sectionOrder, setSectionOrder] = useState<string[]>(['hero', 'social', 'portfolio', 'albums', 'about', 'featured', 'services', 'testimonials', 'contact']);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({ hero: true, social: true, portfolio: true, albums: false, about: true, featured: true, services: false, testimonials: false, contact: true });
  const [portfolioLayout, setPortfolioLayout] = useState<'grid' | 'masonry' | 'large'>('grid');
  const [servicesData, setServicesData] = useState<ServiceItem[]>([]);
  const [testimonialsData, setTestimonialsData] = useState<Testimonial[]>([]);
  const [featuredGalleryIds, setFeaturedGalleryIds] = useState<string[]>([]);

  // ── Website images (independent of events/galleries) ──
  const [websiteImages, setWebsiteImages] = useState<WebsiteImages>({});

  // ── Live data from DB ──
  const [events, setEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<{ id: string; url: string }[]>([]);
  const [allEvents, setAllEvents] = useState<{ id: string; name: string }[]>([]);
  const { data: dbTemplates = [] } = useWebsiteTemplates();

  // ── Drag state ──
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);


  // ── Load template fonts ──
  useEffect(() => {
    if (!document.getElementById('website-template-fonts')) {
      const link = document.createElement('link');
      link.id = 'website-template-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Nunito+Sans:wght@300;400;500;600;700&family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&family=Prata&family=Manrope:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // ── Load all data ──
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const [profileRes, studioRes] = await Promise.all([
        (supabase.from('profiles').select('studio_name, studio_logo_url, studio_accent_color, email') as any).eq('user_id', user.id).maybeSingle(),
        (supabase.from('studio_profiles').select('*') as any).eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      const p = profileRes.data;
      const s = studioRes.data;

      if (p) {
        setStudioName(p.studio_name || '');
        setLogoUrl(p.studio_logo_url || null);
        setAccentColor(p.studio_accent_color || '#b08d57');
        setEmail(p.email || '');
      }
      if (s) {
        setBio(s.bio || '');
        setCoverUrl(s.cover_url || null);
        setTagline(s.display_name || '');
        setInstagram(s.instagram || '');
        setWebsiteUrl(s.website || '');
        setWhatsapp(s.whatsapp || '');
        setFooterText(s.footer_text || '');
        setUsername(s.username || '');
        setHeroButtonLabel(s.hero_button_label || 'View Portfolio');
        setHeroButtonUrl(s.hero_button_url || '#portfolio');
        setWebsiteTemplate((s.website_template as WebsiteTemplateValue) || 'vows-elegance');
        setSectionOrder((s.section_order as string[]) || ['hero', 'social', 'portfolio', 'albums', 'about', 'featured', 'services', 'testimonials', 'contact']);
        setSectionVisibility((s.section_visibility as Record<string, boolean>) || { hero: true, social: true, portfolio: true, albums: false, about: true, featured: true, services: false, testimonials: false, contact: true });
        setPortfolioLayout((s.portfolio_layout as 'grid' | 'masonry' | 'large') || 'grid');
        setServicesData((s.services_data as ServiceItem[]) || []);
        setTestimonialsData((s.testimonials_data as Testimonial[]) || []);
        setFeaturedGalleryIds((s.featured_gallery_ids as string[]) || []);
        setWebsiteImages((s.website_images as WebsiteImages) || {});
      }

      // Load events
      const [evRes, albumRes, allEvRes] = await Promise.all([
        (supabase.from('events').select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any)
          .eq('user_id', user.id).eq('is_published', true).eq('feed_visible', true)
          .order('event_date', { ascending: false }).limit(12),
        (supabase.from('portfolio_albums').select('id, title, description, cover_url, category, photo_urls') as any)
          .eq('user_id', user.id).eq('is_visible', true).order('sort_order', { ascending: true }),
        (supabase.from('events').select('id, name') as any).eq('user_id', user.id).eq('is_published', true).order('event_date', { ascending: false }),
      ]);
      if (cancelled) return;

      setEvents(evRes.data || []);
      setAlbums((albumRes.data || []) as unknown as PortfolioAlbum[]);
      setAllEvents((allEvRes.data || []) as { id: string; name: string }[]);

      // Load portfolio photos
      const portfolioIds = (s?.portfolio_photo_ids as string[]) || [];
      if (portfolioIds.length > 0) {
        const { data: pPhotos } = await (supabase.from('photos').select('id, url') as any).in('id', portfolioIds);
        if (!cancelled && pPhotos) {
          const photoMap = new Map((pPhotos as any[]).map(pp => [pp.id, pp]));
          setPortfolioPhotos(portfolioIds.map(id => photoMap.get(id)).filter(Boolean));
        }
      }

      // Featured events
      const featIds = (s?.featured_gallery_ids as string[]) || [];
      if (featIds.length > 0) {
        const { data: fData } = await (supabase.from('events').select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any).in('id', featIds).eq('is_published', true);
        if (!cancelled) setFeaturedEvents(fData || []);
      }

      // Fallback covers
      const typedEvents = (evRes.data || []) as any[];
      const noCover = typedEvents.filter((e: any) => !e.cover_url);
      if (noCover.length > 0) {
        const photos: Record<string, string> = {};
        for (const ev of noCover) {
          const { data: ph } = await (supabase.from('photos').select('url') as any).eq('event_id', ev.id).limit(1);
          if (ph?.[0]?.url) photos[ev.id] = ph[0].url;
        }
        if (!cancelled) setCoverPhotos(photos);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await (supabase.from('profiles').update({ studio_name: studioName, studio_accent_color: accentColor } as any) as any).eq('user_id', user.id);

      const studioData = {
        bio, display_name: tagline, instagram: instagram || null, website: websiteUrl || null,
        whatsapp: whatsapp || null, footer_text: footerText || null,
        username: username || null, website_template: websiteTemplate,
        section_order: sectionOrder, section_visibility: sectionVisibility,
        services_data: servicesData, testimonials_data: testimonialsData,
        featured_gallery_ids: featuredGalleryIds, portfolio_layout: portfolioLayout,
        hero_button_label: heroButtonLabel || null, hero_button_url: heroButtonUrl || null,
        website_images: websiteImages,
      };

      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (existing) {
        await (supabase.from('studio_profiles').update(studioData as any) as any).eq('user_id', user.id);
      } else {
        await (supabase.from('studio_profiles').insert({ user_id: user.id, ...studioData } as any) as any);
      }
      toast.success('Website saved');
    } catch (err) {
      console.error('Failed to save website:', err);
      toast.error('Failed to save changes. Please try again.');
    }
    setSaving(false);
  }, [user, studioName, accentColor, bio, tagline, instagram, websiteUrl, whatsapp, footerText, username, websiteTemplate, sectionOrder, sectionVisibility, servicesData, testimonialsData, featuredGalleryIds, portfolioLayout, heroButtonLabel, heroButtonUrl, websiteImages]);

  // ── Publish ──
  const handlePublish = useCallback(async () => {
    if (!username) {
      toast.error('Set a portfolio username first');
      return;
    }
    setPublishing(true);
    await handleSave();
    setPublishing(false);
    toast.success('Website published!', { description: getStudioDisplayUrl(username) });
  }, [username, handleSave]);


  // ── Delete / Reset Website ──
  const [deleting, setDeleting] = useState(false);
  const handleDeleteWebsite = useCallback(async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Reset studio_profiles website config (keep non-website fields intact)
      await (supabase.from('studio_profiles').update({
        website_template: null,
        section_order: null,
        section_visibility: null,
        services_data: null,
        testimonials_data: null,
        featured_gallery_ids: null,
        portfolio_layout: null,
        hero_button_label: null,
        hero_button_url: null,
        website_images: null,
        username: null,
        footer_text: null,
      } as any) as any).eq('user_id', user.id);

      toast.success('Portfolio website deleted');
      navigate('/dashboard/branding');
    } catch (err) {
      console.error('Website operation failed:', err);
      toast.error('Something went wrong. Please try again.');
    }
    setDeleting(false);
  }, [user, navigate]);


  const toggleSection = (id: string) => {
    setSectionVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Drag reorder ──
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const newOrder = [...sectionOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setSectionOrder(newOrder);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // ── Service helpers ──
  const addService = () => setServicesData(prev => [...prev, { title: 'New Service', description: '', icon: 'camera', price: '' }]);
  const removeService = (i: number) => setServicesData(prev => prev.filter((_, idx) => idx !== i));
  const updateService = (i: number, field: keyof ServiceItem, val: string) => {
    setServicesData(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  // ── Testimonial helpers ──
  const addTestimonial = () => setTestimonialsData(prev => [...prev, { clientName: 'Client Name', review: 'Amazing experience!', rating: 5 }]);
  const removeTestimonial = (i: number) => setTestimonialsData(prev => prev.filter((_, idx) => idx !== i));
  const updateTestimonial = (i: number, field: string, val: string) => {
    setTestimonialsData(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };

  // ── Featured gallery helpers ──
  const toggleFeaturedGallery = (eventId: string) => {
    setFeaturedGalleryIds(prev => prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]);
  };

  const tmpl = getTemplate(websiteTemplate);

  const branding = {
    studio_name: studioName || 'Studio',
    studio_logo_url: logoUrl,
    studio_accent_color: accentColor,
    bio, display_name: tagline,
    instagram, website: websiteUrl, whatsapp, email,
    footer_text: footerText, cover_url: coverUrl,
    hero_button_label: heroButtonLabel, hero_button_url: heroButtonUrl,
  };

  // ── Render section ──
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero': return <WebsiteHero key="hero" branding={branding} id="hero" template={websiteTemplate} />;
      case 'social': return <WebsiteSocialBar key="social" id="social" instagram={instagram} website={websiteUrl} whatsapp={whatsapp} email={email} accent={accentColor} template={websiteTemplate} />;
      case 'portfolio': return <WebsitePortfolio key="portfolio" id="portfolio" events={events} coverPhotos={coverPhotos} accent={accentColor} layout={portfolioLayout} onNavigate={() => {}} template={websiteTemplate} />;
      case 'albums': return albums.length > 0 ? <WebsiteAlbums key="albums" id="albums" albums={albums} accent={accentColor} template={websiteTemplate} /> : <div key="albums" className="py-16 text-center opacity-30" style={{ color: tmpl.textSecondary }}>No albums yet</div>;
      case 'about': return bio ? <WebsiteAbout key="about" id="about" template={websiteTemplate} branding={branding} /> : <div key="about" className="py-16 text-center opacity-30" style={{ color: tmpl.textSecondary }}>Add a bio in the About section editor</div>;
      case 'featured': return (
        <>
          {portfolioPhotos.length > 0 && <WebsitePortfolioImages key="portfolio-images" id="portfolio-images" photos={portfolioPhotos} accent={accentColor} template={websiteTemplate} />}
          <WebsiteFeatured key="featured" id="featured" events={featuredEvents} coverPhotos={coverPhotos} accent={accentColor} onNavigate={() => {}} template={websiteTemplate} />
        </>
      );
      case 'services': return servicesData.length > 0 ? <WebsiteServices key="services" id="services" services={servicesData} accent={accentColor} template={websiteTemplate} /> : <div key="services" className="py-16 text-center opacity-30" style={{ color: tmpl.textSecondary }}>Add services in the section editor</div>;
      case 'testimonials': return testimonialsData.length > 0 ? <WebsiteTestimonials key="testimonials" id="testimonials" testimonials={testimonialsData} accent={accentColor} template={websiteTemplate} /> : <div key="testimonials" className="py-16 text-center opacity-30" style={{ color: tmpl.textSecondary }}>Add testimonials in the section editor</div>;
      case 'latest_works': return <WebsiteLatestWorks key="latest_works" id="latest-works" template={websiteTemplate} images={websiteImages.latest_works_photos || []} accent={accentColor} title={websiteImages.latest_works_title || 'My Latest Works'} maxImages={30} />;
      case 'newsletter': return <WebsiteNewsletter key="newsletter" id="newsletter" template={websiteTemplate} title={websiteImages.newsletter_title} description={websiteImages.newsletter_description} buttonText={websiteImages.newsletter_button_text} />;
      case 'image_strip': return <WebsiteImageStrip key="image_strip" id="image-strip" template={websiteTemplate} images={websiteImages.image_strip_photos || []} />;
      case 'contact': return <WebsiteContact key="contact" id="contact" template={websiteTemplate} branding={branding} photographerId={user?.id} />;
      default: return null;
    }
  };

  // ── Section editor panel ──
  const renderSectionEditor = () => {
    if (!activeSection) return null;
    const sec = ALL_SECTIONS.find(s => s.id === activeSection);
    if (!sec) return null;

    return (
      <div className="space-y-4">
        <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Sections
        </button>
        <h3 className="text-sm font-semibold text-foreground">{sec.icon} {sec.label}</h3>

        {activeSection === 'hero' && user && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Name</label>
              <Input value={studioName} onChange={e => setStudioName(e.target.value)} className="mt-1 h-9 text-sm bg-card" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Tagline</label>
              <Input value={tagline} onChange={e => setTagline(e.target.value)} className="mt-1 h-9 text-sm bg-card" placeholder="Reflections of Your Moments" />
            </div>
            <WebsiteImageUploader
              value={websiteImages.hero_cover || coverUrl}
              onChange={(url) => {
                setWebsiteImages(prev => ({ ...prev, hero_cover: url }));
                if (url) setCoverUrl(url);
              }}
              userId={user.id}
              folder="hero"
              label="Cover Image"
              aspectClass="aspect-video"
            />
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Button Label</label>
              <Input value={heroButtonLabel} onChange={e => setHeroButtonLabel(e.target.value)} className="mt-1 h-9 text-sm bg-card" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Button Link</label>
              <Input value={heroButtonUrl} onChange={e => setHeroButtonUrl(e.target.value)} className="mt-1 h-9 text-sm bg-card" placeholder="#portfolio" />
            </div>
          </div>
        )}

        {activeSection === 'portfolio' && user && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Layout Style</label>
              <Select value={portfolioLayout} onValueChange={v => setPortfolioLayout(v as any)}>
                <SelectTrigger className="mt-1 h-9 text-sm bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="large">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <WebsiteImageGridUploader
              values={websiteImages.portfolio_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, portfolio_photos: urls }))}
              userId={user.id}
              folder="portfolio"
              label="Portfolio Photos"
              maxImages={20}
            />
            <p className="text-[8px] text-muted-foreground/30">Upload your best portfolio images directly from your device.</p>
          </div>
        )}

        {activeSection === 'about' && user && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">About / Bio</label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} className="mt-1 text-sm bg-card min-h-[120px]" placeholder="Tell your story..." />
            </div>
            <WebsiteImageUploader
              value={websiteImages.about_photo || null}
              onChange={(url) => setWebsiteImages(prev => ({ ...prev, about_photo: url }))}
              userId={user.id}
              folder="about"
              label="Photographer Portrait"
              aspectClass="aspect-[3/4]"
            />
          </div>
        )}

        {activeSection === 'featured' && user && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Featured Work Photos</p>
            <p className="text-[8px] text-muted-foreground/30 mb-2">Upload your best featured work images. These are independent of your event galleries.</p>
            <WebsiteImageGridUploader
              values={websiteImages.featured_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, featured_photos: urls }))}
              userId={user.id}
              folder="featured"
              label="Featured Images"
              maxImages={12}
            />
          </div>
        )}



        {activeSection === 'services' && (
          <div className="space-y-3">
            {servicesData.map((svc, i) => (
              <div key={i} className="p-3 bg-card rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Service {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeService(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
                <Input value={svc.title} onChange={e => updateService(i, 'title', e.target.value)} className="h-8 text-xs bg-background" placeholder="Service name" />
                <Input value={svc.description} onChange={e => updateService(i, 'description', e.target.value)} className="h-8 text-xs bg-background" placeholder="Description" />
                <Input value={svc.price || ''} onChange={e => updateService(i, 'price', e.target.value)} className="h-8 text-xs bg-background" placeholder="Price (optional)" />
                <Select value={svc.icon || 'camera'} onValueChange={v => updateService(i, 'icon', v)}>
                  <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">📷 Camera</SelectItem>
                    <SelectItem value="heart">❤️ Heart</SelectItem>
                    <SelectItem value="location">📍 Location</SelectItem>
                    <SelectItem value="people">👥 People</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={addService}>
              <Plus className="h-3 w-3 mr-1" /> Add Service
            </Button>
          </div>
        )}

        {activeSection === 'testimonials' && (
          <div className="space-y-3">
            {testimonialsData.map((t, i) => (
              <div key={i} className="p-3 bg-card rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Testimonial {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTestimonial(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
                <Input value={t.clientName} onChange={e => updateTestimonial(i, 'clientName', e.target.value)} className="h-8 text-xs bg-background" placeholder="Client name" />
                <Textarea value={t.review} onChange={e => updateTestimonial(i, 'review', e.target.value)} className="text-xs bg-background min-h-[60px]" placeholder="Testimonial text" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-[10px] h-8" onClick={addTestimonial}>
              <Plus className="h-3 w-3 mr-1" /> Add Testimonial
            </Button>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Email</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 h-9 text-sm bg-card" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">WhatsApp</label>
              <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="mt-1 h-9 text-sm bg-card" placeholder="+1234567890" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Instagram</label>
              <Input value={instagram} onChange={e => setInstagram(e.target.value)} className="mt-1 h-9 text-sm bg-card" placeholder="@yourstudio" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Website</label>
              <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="mt-1 h-9 text-sm bg-card" placeholder="www.studio.com" />
            </div>
          </div>
        )}

        {activeSection === 'social' && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground/40">Social links are pulled from the Contact section. Edit them there.</p>
          </div>
        )}

        {activeSection === 'albums' && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground/40">Albums are managed from the Album Designer. Visible albums appear automatically.</p>
          </div>
        )}

        {activeSection === 'latest_works' && user && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Section Title</label>
              <Input value={websiteImages.latest_works_title || 'My Latest Works'} onChange={e => setWebsiteImages(prev => ({ ...prev, latest_works_title: e.target.value }))} className="mt-1 h-9 text-sm bg-card" />
            </div>
            <WebsiteImageGridUploader
              values={websiteImages.latest_works_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, latest_works_photos: urls }))}
              userId={user.id}
              folder="latest-works"
              label="Gallery Images"
              maxImages={30}
            />
            <p className="text-[8px] text-muted-foreground/30">Upload up to 30 images. Visitors can click to view full-screen.</p>
          </div>
        )}

        {activeSection === 'newsletter' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Title</label>
              <Input value={websiteImages.newsletter_title || 'Follow Our Updates'} onChange={e => setWebsiteImages(prev => ({ ...prev, newsletter_title: e.target.value }))} className="mt-1 h-9 text-sm bg-card" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Description</label>
              <Textarea value={websiteImages.newsletter_description || ''} onChange={e => setWebsiteImages(prev => ({ ...prev, newsletter_description: e.target.value }))} className="mt-1 text-sm bg-card min-h-[80px]" placeholder="Subscribe to stay updated..." />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Button Text</label>
              <Input value={websiteImages.newsletter_button_text || 'Subscribe'} onChange={e => setWebsiteImages(prev => ({ ...prev, newsletter_button_text: e.target.value }))} className="mt-1 h-9 text-sm bg-card" />
            </div>
          </div>
        )}

        {activeSection === 'image_strip' && user && (
          <div className="space-y-3">
            <WebsiteImageGridUploader
              values={websiteImages.image_strip_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, image_strip_photos: urls }))}
              userId={user.id}
              folder="image-strip"
              label="Strip Images (up to 6)"
              maxImages={6}
            />
            <p className="text-[8px] text-muted-foreground/30">These appear as a horizontal row. Works like an Instagram preview.</p>
          </div>
        )}

        {(activeSection === 'hero' || activeSection === 'contact') && (
          <div className="pt-3 border-t border-border">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Brand Accent Color</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="h-8 w-8 rounded border border-border cursor-pointer" />
              <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-24 h-8 text-xs bg-card" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Mobile section edit handler ──
  const openMobileSectionEditor = (id: string) => {
    setActiveSection(id);
    setMobileEditorOpen(true);
  };

  const closeMobileSectionEditor = () => {
    setMobileEditorOpen(false);
    setActiveSection(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const visibleSections = sectionOrder.filter(id => sectionVisibility[id]);
  const activeSecMeta = ALL_SECTIONS.find(s => s.id === activeSection);

  // ═══════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════
  if (isMobile && mobileMode !== 'landscape') {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* ── Mobile Top Toolbar ── */}
        <header className="h-12 border-b border-border flex items-center justify-between px-3 bg-card shrink-0 z-50">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/branding')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-muted rounded-full p-0.5">
            <button
              onClick={() => setMobileMode('preview')}
              className={`px-2.5 py-1 rounded-full text-[9px] font-medium transition-colors ${
                mobileMode === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setMobileMode('edit')}
              className={`px-2.5 py-1 rounded-full text-[9px] font-medium transition-colors flex items-center gap-1 ${
                mobileMode === 'edit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              <SplitSquareHorizontal className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => setMobileMode('landscape')}
              className={`px-2.5 py-1 rounded-full text-[9px] font-medium transition-colors flex items-center gap-1 text-muted-foreground`}
              title="Switch to wide-screen desktop editor"
            >
              <Maximize2 className="h-3 w-3" />
              Wide
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="text-[10px] h-7 px-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            </Button>
            <Button size="sm" className="text-[10px] h-7 px-2 bg-primary text-primary-foreground" onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
            </Button>
          </div>
        </header>

        {/* ═══ SPLIT EDIT MODE ═══ */}
        {mobileMode === 'edit' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Edit Panel - scrollable section list / section editor */}
            <div className="flex-1 overflow-y-auto bg-card border-b border-border">
              <div className="p-4 space-y-4">
                {/* Template selector */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">TEMPLATE</p>
                  <Select value={websiteTemplate} onValueChange={v => setWebsiteTemplate(v as WebsiteTemplateValue)}>
                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dbTemplates.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: t.bg }} />
                            <span>{t.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Username */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">PORTFOLIO URL</p>
                  <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="yourstudio" className="h-8 text-xs bg-background" />
                  {username && (
                    <p className="text-[9px] text-muted-foreground/40 mt-1 truncate">{getStudioDisplayUrl(username)}</p>
                  )}
                </div>

                {/* Section editor or section list */}
                {activeSection ? (
                  renderSectionEditor()
                ) : (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">SECTIONS</p>
                    <p className="text-[9px] text-muted-foreground/30 mb-3">Tap to edit · Toggle visibility</p>
                    <div className="space-y-1">
                      {sectionOrder.map((sectionId, idx) => {
                        const sec = ALL_SECTIONS.find(s => s.id === sectionId);
                        if (!sec) return null;
                        const isOn = sectionVisibility[sectionId] !== false;

                        return (
                          <div
                            key={sectionId}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                              !isOn ? 'opacity-40 border-transparent' : 'border-border/50 hover:border-border'
                            }`}
                          >
                            <span className="text-sm shrink-0">{sec.icon}</span>
                            <button
                              onClick={() => setActiveSection(sectionId)}
                              className="flex-1 text-left text-xs text-foreground hover:text-primary transition-colors truncate"
                            >
                              {sec.label}
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); toggleSection(sectionId); }}
                              className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                            >
                              {isOn ? <Eye className="h-3.5 w-3.5 text-muted-foreground/50" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground/30" />}
                            </button>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/20 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer */}
                {!activeSection && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">FOOTER</p>
                    <Input value={footerText} onChange={e => setFooterText(e.target.value)} className="h-8 text-xs bg-background" placeholder="Footer tagline" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ═══ PREVIEW MODE (default) ═══ */
          <>
            <main className="flex-1 overflow-y-auto">
              <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
                {visibleSections.map(sectionId => (
                  <div
                    key={sectionId}
                    className={`relative group transition-all ${
                      activeSection === sectionId ? 'ring-2 ring-primary ring-inset' : ''
                    }`}
                    onClick={() => openMobileSectionEditor(sectionId)}
                  >
                    <div className="absolute top-2 left-2 z-20 px-2 py-1 rounded-md text-[9px] font-medium uppercase tracking-wider bg-black/60 text-white opacity-0 active:opacity-100 transition-opacity pointer-events-none">
                      <Pencil className="h-2.5 w-2.5 inline mr-1" />
                      {ALL_SECTIONS.find(s => s.id === sectionId)?.label}
                    </div>
                    {renderSection(sectionId)}
                  </div>
                ))}
                <WebsiteFooter template={websiteTemplate} branding={branding} />
              </div>
            </main>

            {/* Floating Edit Button */}
            <button
              onClick={() => setMobileSectionsOpen(true)}
              className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </>
        )}

        {/* ── Sections Manager Drawer ── */}
        <MobileSectionDrawer
          open={mobileSectionsOpen}
          onOpenChange={setMobileSectionsOpen}
          sections={ALL_SECTIONS as unknown as { id: string; label: string; icon: string }[]}
          sectionOrder={sectionOrder}
          sectionVisibility={sectionVisibility}
          onReorder={setSectionOrder}
          onToggleVisibility={toggleSection}
          onEditSection={openMobileSectionEditor}
        />

        {/* ── Section Editor Drawer ── */}
        {activeSection && activeSecMeta && (
          <MobileEditorPanel
            open={mobileEditorOpen}
            onOpenChange={(open) => { if (!open) closeMobileSectionEditor(); }}
            sectionLabel={activeSecMeta.label}
            sectionIcon={activeSecMeta.icon}
            onBack={closeMobileSectionEditor}
          >
            {renderSectionEditor()}
          </MobileEditorPanel>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // LANDSCAPE / WIDE MODE (forced desktop layout on mobile)
  // ═══════════════════════════════════════════
  // Falls through to the desktop layout below, but with a back-to-mobile button

  // ═══════════════════════════════════════════
  // DESKTOP LAYOUT (unchanged)
  // ═══════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            if (isMobile && mobileMode === 'landscape') {
              setMobileMode('preview');
            } else {
              navigate('/dashboard/branding');
            }
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs font-semibold text-foreground">Studio Feed</p>
              <p className="text-[10px] text-muted-foreground/50">{studioName || 'Your Studio'}</p>
            </div>
            {isMobile && mobileMode === 'landscape' && (
              <Button
                variant="outline"
                size="sm"
                className="text-[9px] h-6 px-2 gap-1 ml-2"
                onClick={() => setMobileMode('preview')}
              >
                <RotateCcw className="h-3 w-3" />
                Exit Wide
              </Button>
            )}
          </div>
        </div>

        {/* Device preview toggles */}
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
          {username && (
            <Button variant="ghost" size="sm" className="text-[10px] h-8 gap-1" onClick={() => window.open(`/studio/${username}`, '_blank')}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-[10px] h-8" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
            Save
          </Button>
          <Button size="sm" className="text-[10px] h-8 bg-primary text-primary-foreground" onClick={handlePublish} disabled={publishing}>
            {publishing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Globe className="h-3 w-3 mr-1" />}
            Publish
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Portfolio Website
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete your portfolio website? This will remove the layout and content and unpublish it. Your galleries, events, and photos will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteWebsite}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                  Delete Website
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Sidebar ── */}
        <aside className="w-72 border-r border-border bg-card overflow-y-auto shrink-0">
          <div className="p-4 space-y-5">
            {/* Template selector */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">TEMPLATE</p>
              <Select value={websiteTemplate} onValueChange={v => setWebsiteTemplate(v as WebsiteTemplateValue)}>
                <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dbTemplates.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: t.bg }} />
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Username */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">PORTFOLIO URL</p>
              <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="yourstudio" className="h-8 text-xs bg-background" />
              {username && (
                <p className="text-[9px] text-muted-foreground/40 mt-1 truncate">{getStudioDisplayUrl(username)}</p>
              )}
            </div>

            {/* Section editor or section list */}
            {activeSection ? (
              renderSectionEditor()
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">SECTIONS</p>
                <p className="text-[9px] text-muted-foreground/30 mb-3">Drag to reorder · Click to edit · Toggle visibility</p>
                <div className="space-y-1">
                  {sectionOrder.map((sectionId, idx) => {
                    const sec = ALL_SECTIONS.find(s => s.id === sectionId);
                    if (!sec) return null;
                    const isOn = sectionVisibility[sectionId] !== false;
                    const isDragOver = dragOverIdx === idx;

                    return (
                      <div
                        key={sectionId}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => handleDragOver(e, idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        onDrop={() => handleDrop(idx)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing group ${
                          isDragOver ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted/30'
                        } ${!isOn ? 'opacity-40' : ''}`}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                        <span className="text-sm shrink-0">{sec.icon}</span>
                        <button
                          onClick={() => setActiveSection(sectionId)}
                          className="flex-1 text-left text-xs text-foreground hover:text-primary transition-colors truncate"
                        >
                          {sec.label}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSection(sectionId); }}
                          className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                          title={isOn ? 'Hide section' : 'Show section'}
                        >
                          {isOn ? <Eye className="h-3 w-3 text-muted-foreground/50" /> : <EyeOff className="h-3 w-3 text-muted-foreground/30" />}
                        </button>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer editor shortcut */}
            {!activeSection && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-2">FOOTER</p>
                <div className="space-y-2">
                  <Input value={footerText} onChange={e => setFooterText(e.target.value)} className="h-8 text-xs bg-background" placeholder="Footer tagline" />
                </div>
              </div>
            )}

            {/* Delete Website */}
            {!activeSection && (
              <div className="pt-4 border-t border-border">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-[10px] h-8 text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                      <Trash2 className="h-3 w-3" /> Delete Website
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Portfolio Website
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete your current portfolio website? This will remove the website layout, content, and unpublish it. Your galleries, events, and photos will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteWebsite}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                        Delete Website
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </aside>

        {/* ── Preview Area ── */}
        <main className="flex-1 bg-muted/30 overflow-y-auto flex justify-center py-6 px-4">
          <div
            className={`transition-all duration-300 w-full ${
              viewMode === 'mobile' ? 'max-w-[375px]' : viewMode === 'tablet' ? 'max-w-[768px]' : 'max-w-[1280px]'
            }`}
          >
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
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(248 113 113 / 0.6)' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(250 204 21 / 0.6)' }} />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgb(74 222 128 / 0.6)' }} />
                </div>
                <div
                  className="flex-1 text-center text-[9px] font-mono truncate px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${tmpl.text}08`, color: tmpl.textSecondary }}
                >
                  {username ? getStudioDisplayUrl(username) : 'mirroraigallery.com/studio/yourstudio'}
                </div>
              </div>

              {/* Website content */}
              <div
                style={{
                  backgroundColor: tmpl.bg,
                  color: tmpl.text,
                  fontFamily: tmpl.uiFontFamily,
                }}
              >
                {visibleSections.map(sectionId => (
                  <div
                    key={sectionId}
                    className={`relative group cursor-pointer transition-all ${
                      activeSection === sectionId ? 'ring-2 ring-primary ring-inset' : 'hover:ring-1 hover:ring-primary/30 hover:ring-inset'
                    }`}
                    onClick={() => setActiveSection(sectionId)}
                  >
                    {/* Section label overlay */}
                    <div className={`absolute top-2 left-2 z-20 px-2 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-opacity ${
                      activeSection === sectionId ? 'opacity-100 bg-primary text-primary-foreground' : 'opacity-0 group-hover:opacity-100 bg-foreground/70 text-background'
                    }`}>
                      {ALL_SECTIONS.find(s => s.id === sectionId)?.label}
                    </div>
                    {renderSection(sectionId)}
                  </div>
                ))}
                <WebsiteFooter template={websiteTemplate} branding={branding} />
              </div>
            </div>
          </div>
        </main>
      </div>

      
    </div>
  );
};

export default WebsiteEditor;
