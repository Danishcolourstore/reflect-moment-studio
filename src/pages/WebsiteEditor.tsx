import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Tablet, Smartphone, Globe, Loader2, Eye, GripVertical, ChevronDown, ChevronRight, EyeOff, Plus, Trash2, Upload, X, ExternalLink, Pencil, LayoutGrid, Save, AlertTriangle, SplitSquareHorizontal, RotateCcw, Maximize2, Sparkles, Copy, MoveUp, MoveDown } from 'lucide-react';

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
import { fonts, colors } from '@/styles/design-tokens';

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
  { id: 'hero', label: 'Hero Banner', icon: '🖼️', desc: 'Full-width cover with text overlay' },
  { id: 'social', label: 'Social Bar', icon: '🔗', desc: 'Instagram, WhatsApp, email links' },
  { id: 'featured_galleries', label: 'Featured Galleries', icon: '🏛️', desc: 'Showcase your best gallery collections' },
  { id: 'storytelling', label: 'Storytelling', icon: '✨', desc: 'Narrative block with background image' },
  { id: 'portfolio', label: 'Portfolio Grid', icon: '📷', desc: 'Masonry or grid gallery layout' },
  { id: 'latest_works', label: 'Latest Works', icon: '🎯', desc: 'Recent photo gallery showcase' },
  { id: 'albums', label: 'Albums', icon: '📁', desc: 'Portfolio album collection' },
  { id: 'about', label: 'About / Bio', icon: '👤', desc: 'Your story with portrait image' },
  { id: 'featured', label: 'Featured Work', icon: '⭐', desc: 'Highlighted galleries and photos' },
  { id: 'process', label: 'Style & Process', icon: '🎨', desc: 'How you work — step by step' },
  { id: 'services', label: 'Services & Pricing', icon: '💼', desc: 'Packages and pricing cards' },
  { id: 'testimonials', label: 'Testimonials', icon: '💬', desc: 'Client reviews and quotes' },
  { id: 'journal', label: 'Journal / Blog', icon: '📖', desc: 'Recent blog entries' },
  { id: 'newsletter', label: 'Newsletter', icon: '📬', desc: 'Email subscription form' },
  { id: 'image_strip', label: 'Image Strip', icon: '🎞️', desc: 'Horizontal scrolling photo row' },
  { id: 'inquiry', label: 'Inquiry Form', icon: '💌', desc: 'Contact and booking inquiries' },
  { id: 'contact', label: 'Contact Info', icon: '✉️', desc: 'Email, phone, social links' },
] as const;

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type EditorTab = 'editor' | 'preview';

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
  const [editorTab, setEditorTab] = useState<EditorTab>('editor');

  // ── Mobile editor state ──
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<'preview' | 'edit' | 'landscape'>('preview');

  // ── Branding data ──
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

  // ── Website images ──
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

  // ── Add section panel ──
  const [showAddSection, setShowAddSection] = useState(false);

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

      const portfolioIds = (s?.portfolio_photo_ids as string[]) || [];
      if (portfolioIds.length > 0) {
        const { data: pPhotos } = await (supabase.from('photos').select('id, url') as any).in('id', portfolioIds);
        if (!cancelled && pPhotos) {
          const photoMap = new Map((pPhotos as any[]).map(pp => [pp.id, pp]));
          setPortfolioPhotos(portfolioIds.map(id => photoMap.get(id)).filter(Boolean));
        }
      }

      const featIds = (s?.featured_gallery_ids as string[]) || [];
      if (featIds.length > 0) {
        const { data: fData } = await (supabase.from('events').select('id, name, slug, event_date, location, cover_url, photo_count, event_type') as any).in('id', featIds).eq('is_published', true);
        if (!cancelled) setFeaturedEvents(fData || []);
      }

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
      await (supabase.from('studio_profiles').update({
        website_template: null, section_order: null, section_visibility: null,
        services_data: null, testimonials_data: null, featured_gallery_ids: null,
        portfolio_layout: null, hero_button_label: null, hero_button_url: null,
        website_images: null, username: null, footer_text: null,
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

  // ── Move section helpers ──
  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    setSectionOrder(newOrder);
  };

  // ── Add section ──
  const addSection = (id: string) => {
    if (!sectionOrder.includes(id)) {
      setSectionOrder(prev => [...prev, id]);
    }
    setSectionVisibility(prev => ({ ...prev, [id]: true }));
    setShowAddSection(false);
    toast.success(`${ALL_SECTIONS.find(s => s.id === id)?.label} added`);
  };

  // ── Remove section ──
  const removeSection = (id: string) => {
    setSectionVisibility(prev => ({ ...prev, [id]: false }));
  };

  // ── Duplicate section (just toggles visibility if hidden) ──
  const duplicateSection = (id: string) => {
    setSectionVisibility(prev => ({ ...prev, [id]: true }));
    toast.success('Section enabled');
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
      case 'featured_galleries': return (
        <WebsiteFeaturedGalleries key="featured_galleries" id="featured-galleries" template={websiteTemplate}
          galleries={websiteImages.featured_galleries || []}
        />
      );
      case 'storytelling': return (
        <WebsiteStorytelling key="storytelling" id="storytelling" template={websiteTemplate}
          headline={websiteImages.storytelling_headline || 'Every Love Story Is Beautiful'}
          paragraph={websiteImages.storytelling_paragraph || ''}
          backgroundImage={websiteImages.storytelling_bg_image || null}
        />
      );
      case 'process': return (
        <WebsiteProcessSection key="process" id="process" template={websiteTemplate}
          title={websiteImages.process_title || 'My Style & Process'}
          blocks={websiteImages.process_blocks || []}
        />
      );
      case 'journal': return (
        <WebsiteJournal key="journal" id="journal" template={websiteTemplate}
          entries={websiteImages.journal_entries || []}
        />
      );
      case 'inquiry': return (
        <WebsiteInquiryForm key="inquiry" id="inquiry" template={websiteTemplate}
          branding={{
            studio_name: studioName || 'Studio',
            studio_accent_color: accentColor,
            email, whatsapp, instagram,
          }}
          accent={accentColor}
        />
      );
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          onClick={() => setActiveSection(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            color: colors.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
          }}
        >
          ← Back to Sections
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{sec.icon}</span>
          <h3 style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: 400, color: colors.text }}>
            {sec.label}
          </h3>
        </div>

        {activeSection === 'hero' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Studio Name">
              <Input value={studioName} onChange={e => setStudioName(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}`, fontFamily: fonts.body }} />
            </EditorField>
            <EditorField label="Tagline">
              <Input value={tagline} onChange={e => setTagline(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}`, fontFamily: fonts.body }} placeholder="Reflections of Your Moments" />
            </EditorField>
            <WebsiteImageUploader
              value={websiteImages.hero_cover || coverUrl}
              onChange={(url) => { setWebsiteImages(prev => ({ ...prev, hero_cover: url })); if (url) setCoverUrl(url); }}
              userId={user.id} folder="hero" label="Cover Image" aspectClass="aspect-video"
            />
            <EditorField label="Button Label">
              <Input value={heroButtonLabel} onChange={e => setHeroButtonLabel(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}`, fontFamily: fonts.body }} />
            </EditorField>
            <EditorField label="Button Link">
              <Input value={heroButtonUrl} onChange={e => setHeroButtonUrl(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}`, fontFamily: fonts.body }} placeholder="#portfolio" />
            </EditorField>
          </div>
        )}

        {activeSection === 'portfolio' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Layout Style">
              <Select value={portfolioLayout} onValueChange={v => setPortfolioLayout(v as any)}>
                <SelectTrigger className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="large">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </EditorField>
            <WebsiteImageGridUploader
              values={websiteImages.portfolio_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, portfolio_photos: urls }))}
              userId={user.id} folder="portfolio" label="Portfolio Photos" maxImages={20}
            />
          </div>
        )}

        {activeSection === 'about' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="About / Bio">
              <Textarea value={bio} onChange={e => setBio(e.target.value)} className="text-sm min-h-[120px]" style={{ background: colors.surface, border: `1px solid ${colors.border}`, fontFamily: fonts.body }} placeholder="Tell your story..." />
            </EditorField>
            <WebsiteImageUploader
              value={websiteImages.about_photo || null}
              onChange={(url) => setWebsiteImages(prev => ({ ...prev, about_photo: url }))}
              userId={user.id} folder="about" label="Photographer Portrait" aspectClass="aspect-[3/4]"
            />
          </div>
        )}

        {activeSection === 'featured' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Featured Work Photos">
              <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>Upload your best featured work images.</p>
              <WebsiteImageGridUploader
                values={websiteImages.featured_photos || []}
                onChange={(urls) => setWebsiteImages(prev => ({ ...prev, featured_photos: urls }))}
                userId={user.id} folder="featured" label="Featured Images" maxImages={12}
              />
            </EditorField>
          </div>
        )}

        {activeSection === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {servicesData.map((svc, i) => (
              <div key={i} style={{ padding: 14, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ ...labelStyle }}>Service {i + 1}</span>
                  <button onClick={() => removeService(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, fontSize: 12 }}>Remove</button>
                </div>
                <Input value={svc.title} onChange={e => updateService(i, 'title', e.target.value)} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Service name" />
                <Input value={svc.description} onChange={e => updateService(i, 'description', e.target.value)} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Description" />
                <Input value={svc.price || ''} onChange={e => updateService(i, 'price', e.target.value)} className="h-9 text-xs" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Price (optional)" />
              </div>
            ))}
            <button onClick={addService} style={addBtnStyle}>+ Add Service</button>
          </div>
        )}

        {activeSection === 'testimonials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {testimonialsData.map((t, i) => (
              <div key={i} style={{ padding: 14, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={labelStyle}>Testimonial {i + 1}</span>
                  <button onClick={() => removeTestimonial(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, fontSize: 12 }}>Remove</button>
                </div>
                <Input value={t.clientName} onChange={e => updateTestimonial(i, 'clientName', e.target.value)} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Client name" />
                <Textarea value={t.review} onChange={e => updateTestimonial(i, 'review', e.target.value)} className="text-xs min-h-[60px]" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Testimonial text" />
              </div>
            ))}
            <button onClick={addTestimonial} style={addBtnStyle}>+ Add Testimonial</button>
          </div>
        )}

        {activeSection === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Email"><Input value={email} onChange={e => setEmail(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} /></EditorField>
            <EditorField label="WhatsApp"><Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="+1234567890" /></EditorField>
            <EditorField label="Instagram"><Input value={instagram} onChange={e => setInstagram(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="@yourstudio" /></EditorField>
            <EditorField label="Website"><Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="www.studio.com" /></EditorField>
          </div>
        )}

        {activeSection === 'social' && (
          <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>Social links are pulled from the Contact section. Edit them there.</p>
        )}

        {activeSection === 'albums' && (
          <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>Albums are managed from the Album Designer. Visible albums appear automatically.</p>
        )}

        {activeSection === 'latest_works' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Section Title">
              <Input value={websiteImages.latest_works_title || 'My Latest Works'} onChange={e => setWebsiteImages(prev => ({ ...prev, latest_works_title: e.target.value }))} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />
            </EditorField>
            <WebsiteImageGridUploader
              values={websiteImages.latest_works_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, latest_works_photos: urls }))}
              userId={user.id} folder="latest-works" label="Gallery Images" maxImages={30}
            />
          </div>
        )}

        {activeSection === 'newsletter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Title"><Input value={websiteImages.newsletter_title || 'Follow Our Updates'} onChange={e => setWebsiteImages(prev => ({ ...prev, newsletter_title: e.target.value }))} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} /></EditorField>
            <EditorField label="Description"><Textarea value={websiteImages.newsletter_description || ''} onChange={e => setWebsiteImages(prev => ({ ...prev, newsletter_description: e.target.value }))} className="text-sm min-h-[80px]" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="Subscribe to stay updated..." /></EditorField>
            <EditorField label="Button Text"><Input value={websiteImages.newsletter_button_text || 'Subscribe'} onChange={e => setWebsiteImages(prev => ({ ...prev, newsletter_button_text: e.target.value }))} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} /></EditorField>
          </div>
        )}

        {activeSection === 'image_strip' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <WebsiteImageGridUploader
              values={websiteImages.image_strip_photos || []}
              onChange={(urls) => setWebsiteImages(prev => ({ ...prev, image_strip_photos: urls }))}
              userId={user.id} folder="image-strip" label="Strip Images (up to 6)" maxImages={6}
            />
            <p style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted }}>These appear as a horizontal scrolling row.</p>
          </div>
        )}

        {activeSection === 'featured_galleries' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(websiteImages.featured_galleries || []).map((g, i) => (
              <div key={i} style={{ padding: 14, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={labelStyle}>Gallery {i + 1}</span>
                  <button onClick={() => setWebsiteImages(prev => ({ ...prev, featured_galleries: (prev.featured_galleries || []).filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, fontSize: 12 }}>Remove</button>
                </div>
                <Input value={g.title} onChange={e => { const arr = [...(websiteImages.featured_galleries || [])]; arr[i] = { ...arr[i], title: e.target.value }; setWebsiteImages(prev => ({ ...prev, featured_galleries: arr })); }} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Gallery title" />
                <Input value={g.location} onChange={e => { const arr = [...(websiteImages.featured_galleries || [])]; arr[i] = { ...arr[i], location: e.target.value }; setWebsiteImages(prev => ({ ...prev, featured_galleries: arr })); }} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Location" />
                <WebsiteImageUploader value={g.imageUrl || null} onChange={(url) => { const arr = [...(websiteImages.featured_galleries || [])]; arr[i] = { ...arr[i], imageUrl: url || '' }; setWebsiteImages(prev => ({ ...prev, featured_galleries: arr })); }} userId={user.id} folder="featured-galleries" label="Cover Image" aspectClass="aspect-video" />
              </div>
            ))}
            <button onClick={() => setWebsiteImages(prev => ({ ...prev, featured_galleries: [...(prev.featured_galleries || []), { title: 'New Gallery', location: '', imageUrl: '' }] }))} style={addBtnStyle}>+ Add Gallery</button>
          </div>
        )}

        {activeSection === 'storytelling' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <EditorField label="Headline">
              <Input value={websiteImages.storytelling_headline || ''} onChange={e => setWebsiteImages(prev => ({ ...prev, storytelling_headline: e.target.value }))} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="Every Love Story Is Beautiful" />
            </EditorField>
            <EditorField label="Paragraph">
              <Textarea value={websiteImages.storytelling_paragraph || ''} onChange={e => setWebsiteImages(prev => ({ ...prev, storytelling_paragraph: e.target.value }))} className="text-sm min-h-[100px]" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="Tell your story..." />
            </EditorField>
            <WebsiteImageUploader value={websiteImages.storytelling_bg_image || null} onChange={(url) => setWebsiteImages(prev => ({ ...prev, storytelling_bg_image: url }))} userId={user.id} folder="storytelling" label="Background Image" aspectClass="aspect-video" />
          </div>
        )}

        {activeSection === 'process' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EditorField label="Section Title">
              <Input value={websiteImages.process_title || 'My Style & Process'} onChange={e => setWebsiteImages(prev => ({ ...prev, process_title: e.target.value }))} className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />
            </EditorField>
            {(websiteImages.process_blocks || []).map((b, i) => (
              <div key={i} style={{ padding: 14, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={labelStyle}>Step {i + 1}</span>
                  <button onClick={() => setWebsiteImages(prev => ({ ...prev, process_blocks: (prev.process_blocks || []).filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, fontSize: 12 }}>Remove</button>
                </div>
                <Input value={b.title} onChange={e => { const arr = [...(websiteImages.process_blocks || [])]; arr[i] = { ...arr[i], title: e.target.value }; setWebsiteImages(prev => ({ ...prev, process_blocks: arr })); }} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Step title" />
                <Textarea value={b.description} onChange={e => { const arr = [...(websiteImages.process_blocks || [])]; arr[i] = { ...arr[i], description: e.target.value }; setWebsiteImages(prev => ({ ...prev, process_blocks: arr })); }} className="text-xs min-h-[60px]" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Description" />
              </div>
            ))}
            <button onClick={() => setWebsiteImages(prev => ({ ...prev, process_blocks: [...(prev.process_blocks || []), { title: 'New Step', description: '' }] }))} style={addBtnStyle}>+ Add Step</button>
          </div>
        )}

        {activeSection === 'journal' && user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(websiteImages.journal_entries || []).map((entry, i) => (
              <div key={i} style={{ padding: 14, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={labelStyle}>Entry {i + 1}</span>
                  <button onClick={() => setWebsiteImages(prev => ({ ...prev, journal_entries: (prev.journal_entries || []).filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.danger, fontSize: 12 }}>Remove</button>
                </div>
                <Input value={entry.title} onChange={e => { const arr = [...(websiteImages.journal_entries || [])]; arr[i] = { ...arr[i], title: e.target.value }; setWebsiteImages(prev => ({ ...prev, journal_entries: arr })); }} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Entry title" />
                <Input value={entry.date || ''} onChange={e => { const arr = [...(websiteImages.journal_entries || [])]; arr[i] = { ...arr[i], date: e.target.value }; setWebsiteImages(prev => ({ ...prev, journal_entries: arr })); }} className="h-9 text-xs mb-2" style={{ background: '#fff', border: `1px solid ${colors.border}` }} placeholder="Date" type="date" />
                <WebsiteImageUploader value={entry.imageUrl || null} onChange={(url) => { const arr = [...(websiteImages.journal_entries || [])]; arr[i] = { ...arr[i], imageUrl: url || undefined }; setWebsiteImages(prev => ({ ...prev, journal_entries: arr })); }} userId={user.id} folder="journal" label="Cover" aspectClass="aspect-video" />
              </div>
            ))}
            <button onClick={() => setWebsiteImages(prev => ({ ...prev, journal_entries: [...(prev.journal_entries || []), { title: 'New Entry' }] }))} style={addBtnStyle}>+ Add Entry</button>
          </div>
        )}

        {activeSection === 'inquiry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted }}>
              The inquiry form automatically uses your contact details (email, WhatsApp, Instagram) from the Contact section. Submissions are saved to your backend.
            </p>
          </div>
          <div style={{ paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
            <EditorField label="Brand Accent Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ height: 36, width: 36, borderRadius: 8, border: `1px solid ${colors.border}`, cursor: 'pointer' }} />
                <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-28 h-9 text-xs" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />
              </div>
            </EditorField>
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.gold, margin: '0 auto 12px' }} />
          <p style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>Loading Website Builder…</p>
        </div>
      </div>
    );
  }

  const visibleSections = sectionOrder.filter(id => sectionVisibility[id]);
  const activeSecMeta = ALL_SECTIONS.find(s => s.id === activeSection);
  const hiddenSections = ALL_SECTIONS.filter(s => !sectionOrder.includes(s.id) || !sectionVisibility[s.id]);

  // ═══════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════
  if (isMobile && mobileMode !== 'landscape') {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg, overflow: 'hidden' }}>
        {/* ── Mobile Top Bar ── */}
        <header style={{
          height: 52, borderBottom: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', background: colors.bg, flexShrink: 0, zIndex: 50,
        }}>
          <button onClick={() => navigate('/dashboard/branding')} style={iconBtnStyle}>
            <ArrowLeft className="h-4 w-4" style={{ color: colors.text }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: colors.surface, borderRadius: 20, padding: 2 }}>
            {(['preview', 'edit'] as const).map(m => (
              <button key={m} onClick={() => setMobileMode(m)} style={{
                padding: '6px 14px', borderRadius: 18,
                fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                background: mobileMode === m ? colors.bg : 'transparent',
                color: mobileMode === m ? colors.text : colors.textMuted,
                border: 'none', cursor: 'pointer',
                boxShadow: mobileMode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                {m === 'preview' ? '👁 Preview' : '✏️ Edit'}
              </button>
            ))}
            <button onClick={() => setMobileMode('landscape')} style={{
              padding: '6px 10px', borderRadius: 18, background: 'transparent',
              border: 'none', cursor: 'pointer',
            }}>
              <Maximize2 className="h-3.5 w-3.5" style={{ color: colors.textMuted }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={handleSave} disabled={saving} style={{ ...goldBtnStyle, padding: '6px 12px', fontSize: 10 }}>
              {saving ? '…' : 'SAVE'}
            </button>
          </div>
        </header>

        {mobileMode === 'edit' ? (
          <div style={{ flex: 1, overflowY: 'auto', background: colors.bg }}>
            <div style={{ padding: 16 }}>
              {/* Template */}
              <EditorField label="Template">
                <Select value={websiteTemplate} onValueChange={v => setWebsiteTemplate(v as WebsiteTemplateValue)}>
                  <SelectTrigger className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dbTemplates.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1px solid ${colors.border}`, backgroundColor: t.bg }} />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditorField>

              <div style={{ height: 16 }} />

              <EditorField label="Portfolio URL">
                <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="yourstudio" className="h-10 text-sm" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />
                {username && <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{getStudioDisplayUrl(username)}</p>}
              </EditorField>

              <div style={{ height: 20 }} />

              {activeSection ? renderSectionEditor() : (
                <>
                  <p style={labelStyle}>SECTIONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    {sectionOrder.map((sectionId, idx) => {
                      const sec = ALL_SECTIONS.find(s => s.id === sectionId);
                      if (!sec) return null;
                      const isOn = sectionVisibility[sectionId] !== false;
                      return (
                        <SectionRow key={sectionId} sec={sec} isOn={isOn}
                          onEdit={() => setActiveSection(sectionId)}
                          onToggle={() => toggleSection(sectionId)}
                        />
                      );
                    })}
                  </div>

                  <div style={{ height: 16 }} />
                  <EditorField label="Footer">
                    <Input value={footerText} onChange={e => setFooterText(e.target.value)} className="h-9 text-xs" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="Footer tagline" />
                  </EditorField>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <main style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
                {visibleSections.map(sectionId => (
                  <div key={sectionId} onClick={() => openMobileSectionEditor(sectionId)} style={{ position: 'relative', cursor: 'pointer' }}>
                    {renderSection(sectionId)}
                  </div>
                ))}
                <WebsiteFooter template={websiteTemplate} branding={branding} />
              </div>
            </main>

            <button onClick={() => setMobileSectionsOpen(true)} style={{
              position: 'fixed', bottom: 20, right: 16, zIndex: 40,
              height: 52, width: 52, borderRadius: '50%',
              background: colors.gold, color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(201,169,110,0.4)',
            }}>
              <LayoutGrid className="h-5 w-5" />
            </button>
          </>
        )}

        <MobileSectionDrawer
          open={mobileSectionsOpen} onOpenChange={setMobileSectionsOpen}
          sections={ALL_SECTIONS as unknown as { id: string; label: string; icon: string }[]}
          sectionOrder={sectionOrder} sectionVisibility={sectionVisibility}
          onReorder={setSectionOrder} onToggleVisibility={toggleSection}
          onEditSection={openMobileSectionEditor}
        />

        {activeSection && activeSecMeta && (
          <MobileEditorPanel
            open={mobileEditorOpen}
            onOpenChange={(open) => { if (!open) closeMobileSectionEditor(); }}
            sectionLabel={activeSecMeta.label} sectionIcon={activeSecMeta.icon}
            onBack={closeMobileSectionEditor}
          >
            {renderSectionEditor()}
          </MobileEditorPanel>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // DESKTOP LAYOUT — Premium White Editorial
  // ═══════════════════════════════════════════
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg, overflow: 'hidden' }}>
      {/* ── Top Bar ── */}
      <header style={{
        height: 56, borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: colors.bg, flexShrink: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => {
            if (isMobile && mobileMode === 'landscape') { setMobileMode('preview'); }
            else { navigate('/dashboard/branding'); }
          }} style={iconBtnStyle}>
            <ArrowLeft className="h-4 w-4" style={{ color: colors.text }} />
          </button>
          <div>
            <h1 style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 400, color: colors.text, lineHeight: 1.2 }}>
              Website Builder
            </h1>
            <p style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, letterSpacing: '0.06em' }}>
              {studioName || 'Your Studio'}
            </p>
          </div>
          {isMobile && mobileMode === 'landscape' && (
            <button onClick={() => setMobileMode('preview')} style={{
              ...addBtnStyle, fontSize: 10, padding: '4px 10px', marginLeft: 8,
            }}>
              <RotateCcw className="h-3 w-3" style={{ marginRight: 4 }} /> Exit Wide
            </button>
          )}
        </div>

        {/* ── Editor / Preview Tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: colors.surface, borderRadius: 20, padding: 2 }}>
          {(['editor', 'preview'] as EditorTab[]).map(tab => (
            <button key={tab} onClick={() => setEditorTab(tab)} style={{
              padding: '7px 18px', borderRadius: 18,
              fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              background: editorTab === tab ? colors.bg : 'transparent',
              color: editorTab === tab ? colors.text : colors.textMuted,
              border: 'none', cursor: 'pointer',
              boxShadow: editorTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              {tab === 'editor' ? '✏️ Editor' : '👁 Preview'}
            </button>
          ))}
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Device toggles (only in preview tab) */}
          {editorTab === 'preview' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: colors.surface, borderRadius: 20, padding: 2, marginRight: 8 }}>
              {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as [ViewMode, any][]).map(([mode, Icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: 6, borderRadius: '50%',
                  background: viewMode === mode ? colors.bg : 'transparent',
                  border: 'none', cursor: 'pointer',
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: viewMode === mode ? colors.text : colors.textMuted }} />
                </button>
              ))}
            </div>
          )}

          {username && (
            <button onClick={() => window.open(`/studio/${username}`, '_blank')} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 12px', background: 'none',
              border: `1px solid ${colors.border}`, borderRadius: 8,
              cursor: 'pointer', fontFamily: fonts.body, fontSize: 11,
              color: colors.textDim,
            }}>
              <ExternalLink className="h-3 w-3" /> Live Site
            </button>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            ...outlineBtnStyle, opacity: saving ? 0.6 : 1,
          }}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" style={{ marginRight: 4 }} /> : null}
            Save
          </button>

          <button onClick={handlePublish} disabled={publishing} style={goldBtnStyle}>
            {publishing ? <Loader2 className="h-3 w-3 animate-spin" style={{ marginRight: 4 }} /> : <Globe className="h-3 w-3" style={{ marginRight: 4 }} />}
            Publish
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button style={{ ...iconBtnStyle, color: colors.danger }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Portfolio Website
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? This removes the layout and content. Your galleries and photos will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWebsite} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {deleting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                  Delete Website
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* ── Main Layout ── */}
      {editorTab === 'editor' ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* ── Left Sidebar ── */}
          <aside style={{
            width: 300, borderRight: `1px solid ${colors.border}`,
            background: colors.bg, overflowY: 'auto', flexShrink: 0,
          }}>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Template */}
              <div>
                <p style={labelStyle}>TEMPLATE</p>
                <Select value={websiteTemplate} onValueChange={v => setWebsiteTemplate(v as WebsiteTemplateValue)}>
                  <SelectTrigger className="h-10 text-sm mt-2" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {dbTemplates.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1px solid ${colors.border}`, backgroundColor: t.bg }} />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={() => navigate('/dashboard/website-builder')} style={{
                  fontFamily: fonts.body, fontSize: 10, color: colors.gold,
                  background: 'none', border: 'none', cursor: 'pointer',
                  marginTop: 6, padding: 0, letterSpacing: '0.04em',
                }}>
                  Browse all templates →
                </button>
              </div>

              {/* Portfolio URL */}
              <div>
                <p style={labelStyle}>PORTFOLIO URL</p>
                <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="yourstudio" className="h-9 text-xs mt-2" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />
                {username && <p style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, marginTop: 4 }}>{getStudioDisplayUrl(username)}</p>}
              </div>

              {/* Sections or Section Editor */}
              {activeSection ? renderSectionEditor() : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <p style={labelStyle}>SECTIONS</p>
                    <button onClick={() => setShowAddSection(true)} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: fonts.body, fontSize: 10, fontWeight: 600,
                      color: colors.gold, background: 'none', border: 'none',
                      cursor: 'pointer', letterSpacing: '0.04em',
                    }}>
                      <Plus className="h-3 w-3" /> ADD
                    </button>
                  </div>
                  <p style={{ fontFamily: fonts.body, fontSize: 9, color: colors.textMuted, marginBottom: 10 }}>
                    Drag to reorder · Click to edit · Toggle visibility
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 10,
                            border: isDragOver ? `2px solid ${colors.gold}` : `1px solid transparent`,
                            background: isDragOver ? 'rgba(201,169,110,0.04)' : 'transparent',
                            opacity: isOn ? 1 : 0.35,
                            cursor: 'grab', transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = colors.surface)}
                          onMouseLeave={e => (e.currentTarget.style.background = isDragOver ? 'rgba(201,169,110,0.04)' : 'transparent')}
                        >
                          <GripVertical className="h-3 w-3" style={{ color: colors.textMuted, flexShrink: 0, opacity: 0.4 }} />
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{sec.icon}</span>
                          <button
                            onClick={() => setActiveSection(sectionId)}
                            style={{
                              flex: 1, textAlign: 'left',
                              fontFamily: fonts.body, fontSize: 12, color: colors.text,
                              background: 'none', border: 'none', cursor: 'pointer',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}
                          >
                            {sec.label}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); toggleSection(sectionId); }}
                            style={{ ...iconBtnStyle, padding: 4 }}
                            title={isOn ? 'Hide' : 'Show'}
                          >
                            {isOn ? <Eye className="h-3 w-3" style={{ color: colors.textMuted, opacity: 0.5 }} /> : <EyeOff className="h-3 w-3" style={{ color: colors.textMuted, opacity: 0.3 }} />}
                          </button>
                          <ChevronRight className="h-3 w-3" style={{ color: colors.textMuted, opacity: 0.2, flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              {!activeSection && (
                <div>
                  <p style={labelStyle}>FOOTER</p>
                  <Input value={footerText} onChange={e => setFooterText(e.target.value)} className="h-9 text-xs mt-2" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} placeholder="Footer tagline" />
                </div>
              )}

              {/* Delete */}
              {!activeSection && (
                <div style={{ paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button style={{
                        width: '100%', padding: '8px',
                        fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
                        color: colors.danger, background: 'none',
                        border: `1px solid rgba(232,93,93,0.2)`, borderRadius: 8,
                        cursor: 'pointer', letterSpacing: '0.04em',
                      }}>
                        Delete Website
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Portfolio Website
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the layout and content. Your galleries and photos will not be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWebsite} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

          {/* ── Live Preview ── */}
          <main style={{ flex: 1, background: colors.surface, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
            <div style={{
              width: '100%',
              maxWidth: viewMode === 'mobile' ? 375 : viewMode === 'tablet' ? 768 : 1280,
              transition: 'max-width 0.3s ease',
            }}>
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                backgroundColor: tmpl.bg,
              }}>
                {/* Browser chrome */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderBottom: `1px solid ${tmpl.navBorder}`,
                  backgroundColor: tmpl.navBg,
                }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(248,113,113,0.5)' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(250,204,21,0.5)' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(74,222,128,0.5)' }} />
                  </div>
                  <div style={{
                    flex: 1, textAlign: 'center',
                    fontFamily: 'monospace', fontSize: 9,
                    color: tmpl.textSecondary, padding: '2px 8px',
                    background: `${tmpl.text}08`, borderRadius: 6,
                  }}>
                    {username ? getStudioDisplayUrl(username) : 'mirroraigallery.com/studio/yourstudio'}
                  </div>
                </div>

                {/* Website content */}
                <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
                  {visibleSections.map(sectionId => (
                    <div
                      key={sectionId}
                      onClick={() => setActiveSection(sectionId)}
                      style={{
                        position: 'relative', cursor: 'pointer',
                        outline: activeSection === sectionId ? `2px solid ${colors.gold}` : 'none',
                        outlineOffset: -2,
                        transition: 'outline 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        if (activeSection !== sectionId) {
                          e.currentTarget.style.outline = `1px solid rgba(201,169,110,0.3)`;
                          e.currentTarget.style.outlineOffset = '-1px';
                        }
                      }}
                      onMouseLeave={e => {
                        if (activeSection !== sectionId) {
                          e.currentTarget.style.outline = 'none';
                        }
                      }}
                    >
                      {/* Section label */}
                      <div style={{
                        position: 'absolute', top: 8, left: 8, zIndex: 20,
                        padding: '3px 8px', borderRadius: 6,
                        fontFamily: fonts.body, fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        background: activeSection === sectionId ? colors.gold : 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        opacity: activeSection === sectionId ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: 'none',
                      }} className="group-label">
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
      ) : (
        /* ── Full Preview Tab ── */
        <main style={{ flex: 1, background: colors.surface, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
          <div style={{
            width: '100%',
            maxWidth: viewMode === 'mobile' ? 375 : viewMode === 'tablet' ? 768 : 1280,
            transition: 'max-width 0.3s ease',
          }}>
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${colors.border}`,
              boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
              backgroundColor: tmpl.bg,
            }}>
              {/* Browser chrome */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderBottom: `1px solid ${tmpl.navBorder}`,
                backgroundColor: tmpl.navBg,
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(248,113,113,0.5)' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(250,204,21,0.5)' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(74,222,128,0.5)' }} />
                </div>
                <div style={{
                  flex: 1, textAlign: 'center',
                  fontFamily: 'monospace', fontSize: 9,
                  color: tmpl.textSecondary, padding: '2px 8px',
                  background: `${tmpl.text}08`, borderRadius: 6,
                }}>
                  {username ? getStudioDisplayUrl(username) : 'mirroraigallery.com/studio/yourstudio'}
                </div>
              </div>

              <div style={{ backgroundColor: tmpl.bg, color: tmpl.text, fontFamily: tmpl.uiFontFamily }}>
                {visibleSections.map(sectionId => (
                  <div key={sectionId}>{renderSection(sectionId)}</div>
                ))}
                <WebsiteFooter template={websiteTemplate} branding={branding} />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── Add Section Modal ── */}
      {showAddSection && (
        <>
          <div onClick={() => setShowAddSection(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 101, background: colors.bg, borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            width: 480, maxHeight: '70vh', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 24px 12px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 400, color: colors.text }}>Add Section</h3>
                <button onClick={() => setShowAddSection(false)} style={iconBtnStyle}><X className="h-4 w-4" style={{ color: colors.textMuted }} /></button>
              </div>
              <p style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Click to add a section to your website</p>
            </div>
            <div style={{ overflowY: 'auto', padding: '12px 24px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ALL_SECTIONS.map(sec => {
                  const isActive = sectionOrder.includes(sec.id) && sectionVisibility[sec.id];
                  return (
                    <button
                      key={sec.id}
                      onClick={() => addSection(sec.id)}
                      disabled={isActive}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: 14, borderRadius: 12,
                        border: `1px solid ${isActive ? colors.gold : colors.border}`,
                        background: isActive ? 'rgba(201,169,110,0.04)' : colors.bg,
                        cursor: isActive ? 'default' : 'pointer',
                        opacity: isActive ? 0.5 : 1,
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 20, marginBottom: 6 }}>{sec.icon}</span>
                      <span style={{ fontFamily: fonts.body, fontSize: 12, fontWeight: 600, color: colors.text }}>{sec.label}</span>
                      <span style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{sec.desc}</span>
                      {isActive && <span style={{ fontFamily: fonts.body, fontSize: 9, color: colors.gold, marginTop: 4, fontWeight: 600 }}>✓ Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WebsiteEditor;

/* ── Shared Sub-components & Styles ── */

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

function SectionRow({ sec, isOn, onEdit, onToggle }: {
  sec: { id: string; label: string; icon: string; desc?: string };
  isOn: boolean; onEdit: () => void; onToggle: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10,
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      opacity: isOn ? 1 : 0.35,
      transition: 'all 0.2s ease',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{sec.icon}</span>
      <button onClick={onEdit} style={{
        flex: 1, textAlign: 'left',
        fontFamily: fonts.body, fontSize: 13, fontWeight: 500, color: colors.text,
        background: 'none', border: 'none', cursor: 'pointer',
      }}>
        {sec.label}
      </button>
      <button onClick={onToggle} style={{ ...iconBtnStyle, padding: 4 }}>
        {isOn ? <Eye className="h-3.5 w-3.5" style={{ color: colors.textMuted, opacity: 0.5 }} /> : <EyeOff className="h-3.5 w-3.5" style={{ color: colors.textMuted, opacity: 0.3 }} />}
      </button>
      <ChevronRight className="h-3.5 w-3.5" style={{ color: colors.textMuted, opacity: 0.2, flexShrink: 0 }} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: fonts.body, fontSize: 10, fontWeight: 600,
  letterSpacing: '0.15em', textTransform: 'uppercase',
  color: colors.textMuted,
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const goldBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '8px 18px', borderRadius: 8,
  fontFamily: fonts.body, fontSize: 11, fontWeight: 700,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  background: colors.gold, color: '#fff',
  border: 'none', cursor: 'pointer',
  transition: 'opacity 0.2s ease',
};

const outlineBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '8px 16px', borderRadius: 8,
  fontFamily: fonts.body, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.06em',
  background: 'none', color: colors.text,
  border: `1px solid ${colors.border}`,
  cursor: 'pointer', transition: 'all 0.2s ease',
};

const addBtnStyle: React.CSSProperties = {
  width: '100%', padding: '10px',
  fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
  color: colors.gold, background: 'rgba(201,169,110,0.06)',
  border: `1px dashed rgba(201,169,110,0.3)`, borderRadius: 10,
  cursor: 'pointer', letterSpacing: '0.04em',
  transition: 'all 0.2s ease',
};
