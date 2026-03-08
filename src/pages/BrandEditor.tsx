import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Eye, Save, ChevronRight, Upload, Loader2, X,
  Instagram, Globe, MessageCircle, Mail,
  ChevronUp, ChevronDown, Check, Palette, Image as ImageIcon,
  Layout, User, Phone, FileText, Star, Briefcase, Share2, Plus, Trash2,
  MessageSquare, FolderHeart,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { STATIC_TEMPLATES, type WebsiteTemplateValue } from '@/lib/website-templates';
import { useWebsiteTemplates } from '@/hooks/use-website-templates';
import { WebsiteHero } from '@/components/website/WebsiteHero';
import { WebsitePortfolio } from '@/components/website/WebsitePortfolio';
import { WebsiteFeatured } from '@/components/website/WebsiteFeatured';
import { WebsiteServices, type ServiceItem } from '@/components/website/WebsiteServices';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteContact } from '@/components/website/WebsiteContact';
import { WebsiteSocialBar } from '@/components/website/WebsiteSocialBar';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { WebsiteTestimonials, type Testimonial } from '@/components/website/WebsiteTestimonials';
import { WebsiteAlbums } from '@/components/website/WebsiteAlbums';
import { AlbumManagerDrawer } from '@/components/brand-editor/AlbumManagerDrawer';
import { StudioLivePreview } from '@/components/brand-editor/StudioLivePreview';

/* ── Types ── */
interface BrandData {
  studioName: string;
  tagline: string;
  bio: string;
  accentColor: string;
  logoUrl: string | null;
  coverUrl: string | null;
  instagram: string;
  website: string;
  whatsapp: string;
  email: string;
  footerText: string;
  fontStyle: string;
  heroButtonLabel: string;
  heroButtonUrl: string;
  portfolioLayout: string;
  services: ServiceItem[];
  featuredGalleryIds: string[];
  testimonials: Testimonial[];
  location: string;
  phone: string;
}

type SectionId = 'hero' | 'branding' | 'about' | 'contact' | 'footer' | 'portfolio' | 'featured' | 'services' | 'social' | 'testimonials' | 'albums';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Hero Section', icon: ImageIcon, enabled: true },
  { id: 'social', label: 'Social Links', icon: Share2, enabled: true },
  { id: 'portfolio', label: 'Portfolio', icon: Layout, enabled: true },
  { id: 'albums', label: 'Albums', icon: FolderHeart, enabled: false },
  { id: 'about', label: 'About Section', icon: User, enabled: true },
  { id: 'featured', label: 'Featured Galleries', icon: Star, enabled: true },
  { id: 'services', label: 'Services', icon: Briefcase, enabled: false },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, enabled: false },
  { id: 'contact', label: 'Contact Section', icon: Phone, enabled: true },
  { id: 'branding', label: 'Studio Branding', icon: Palette, enabled: true },
  { id: 'footer', label: 'Footer', icon: FileText, enabled: true },
];

interface EventOption {
  id: string;
  name: string;
  cover_url: string | null;
}

/* ── Main Component ── */
const BrandEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<BrandData>({
    studioName: '', tagline: '', bio: '', accentColor: '#b08d57',
    logoUrl: null, coverUrl: null, instagram: '', website: '',
    whatsapp: '', email: '', footerText: '', fontStyle: 'serif',
    heroButtonLabel: '', heroButtonUrl: '', portfolioLayout: 'grid',
    services: [], featuredGalleryIds: [], testimonials: [],
    location: '', phone: '',
  });
  const [websiteTemplate, setWebsiteTemplate] = useState<WebsiteTemplateValue>('vows-elegance');
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [allEvents, setAllEvents] = useState<EventOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [activeDrawer, setActiveDrawer] = useState<SectionId | 'template' | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedData = useRef<string>('');

  // ── Load data ──
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await (supabase.from('profiles').select('studio_name, studio_logo_url, studio_accent_color, email') as any).eq('user_id', user.id).maybeSingle();
      const { data: studio } = await (supabase.from('studio_profiles').select('*') as any).eq('user_id', user.id).maybeSingle();

      const sOrder = (studio?.section_order as string[]) || DEFAULT_SECTIONS.map(s => s.id);
      const sVis = (studio?.section_visibility as Record<string, boolean>) || {};

      const loadedSections: SectionConfig[] = sOrder
        .map(id => {
          const def = DEFAULT_SECTIONS.find(s => s.id === id);
          if (!def) return null;
          return { ...def, enabled: sVis[id] !== undefined ? sVis[id] : def.enabled };
        })
        .filter(Boolean) as SectionConfig[];
      // Add any missing sections
      DEFAULT_SECTIONS.forEach(ds => {
        if (!loadedSections.find(s => s.id === ds.id)) {
          loadedSections.push({ ...ds, enabled: sVis[ds.id] !== undefined ? sVis[ds.id] : ds.enabled });
        }
      });

      setSections(loadedSections);
      if (studio?.website_template) setWebsiteTemplate(studio.website_template);
      const newData: BrandData = {
        studioName: profile?.studio_name || '',
        logoUrl: profile?.studio_logo_url || null,
        accentColor: profile?.studio_accent_color || '#b08d57',
        email: profile?.email || '',
        tagline: studio?.display_name || '',
        bio: studio?.bio || '',
        coverUrl: studio?.cover_url || null,
        instagram: studio?.instagram || '',
        website: studio?.website || '',
        whatsapp: studio?.whatsapp || '',
        footerText: studio?.footer_text || '',
        fontStyle: studio?.font_style || 'serif',
        heroButtonLabel: studio?.hero_button_label || '',
        heroButtonUrl: studio?.hero_button_url || '',
        portfolioLayout: studio?.portfolio_layout || 'grid',
        services: (studio?.services_data as ServiceItem[]) || [],
        featuredGalleryIds: (studio?.featured_gallery_ids as string[]) || [],
        testimonials: (studio?.testimonials_data as Testimonial[]) || [],
        location: studio?.location || '',
        phone: studio?.phone || '',
      };
      setData(newData);
      lastSavedData.current = JSON.stringify(newData);

      // Load events for featured picker
      const { data: evData } = await (supabase.from('events')
        .select('id, name, cover_url') as any)
        .eq('user_id', user.id)
        .eq('is_published', true)
        .order('event_date', { ascending: false })
        .limit(50);
      setAllEvents((evData || []) as EventOption[]);

      setLoading(false);
    })();
  }, [user]);

  // ── Auto-save ──
  const saveData = useCallback(async (d: BrandData, sects?: SectionConfig[]) => {
    if (!user) return;
    const currentJson = JSON.stringify(d);
    const sectionsToSave = sects || sections;

    setSaving(true);
    await (supabase.from('profiles').update({ studio_name: d.studioName, studio_accent_color: d.accentColor } as any) as any).eq('user_id', user.id);

    const sectionOrder = sectionsToSave.map(s => s.id);
    const sectionVisibility: Record<string, boolean> = {};
    sectionsToSave.forEach(s => { sectionVisibility[s.id] = s.enabled; });

    const studioPayload = {
      bio: d.bio || null, display_name: d.tagline || null,
      instagram: d.instagram || null, website: d.website || null,
      whatsapp: d.whatsapp || null, footer_text: d.footerText || null,
      font_style: d.fontStyle,
      hero_button_label: d.heroButtonLabel || null,
      hero_button_url: d.heroButtonUrl || null,
      portfolio_layout: d.portfolioLayout || 'grid',
      services_data: d.services,
      featured_gallery_ids: d.featuredGalleryIds,
      section_order: sectionOrder,
      section_visibility: sectionVisibility,
      testimonials_data: d.testimonials,
      location: d.location || null,
      phone: d.phone || null,
      website_template: websiteTemplate,
    };

    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).maybeSingle();
    if (existing) {
      await (supabase.from('studio_profiles').update(studioPayload as any) as any).eq('user_id', user.id);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: user.id, ...studioPayload } as any) as any);
    }
    lastSavedData.current = currentJson;
    setSavedAt(new Date());
    setSaving(false);
  }, [user, sections]);

  const updateData = useCallback((partial: Partial<BrandData>) => {
    setData(prev => {
      const next = { ...prev, ...partial };
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => saveData(next), 3000);
      return next;
    });
  }, [saveData]);

  // ── File uploads ──
  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('event-covers').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('event-covers').getPublicUrl(path).data.publicUrl;
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    setLogoUploading(true);
    try {
      const url = await uploadFile(file, `studio-logos/${user.id}/logo.${file.name.split('.').pop()}`);
      await (supabase.from('profiles').update({ studio_logo_url: url } as any) as any).eq('user_id', user.id);
      updateData({ logoUrl: url });
      toast.success('Logo uploaded');
    } catch (e: any) { toast.error(e.message); }
    setLogoUploading(false);
  };

  const handleCoverUpload = async (file: File) => {
    if (!user) return;
    setCoverUploading(true);
    try {
      const url = await uploadFile(file, `studio-covers/${user.id}/cover.${file.name.split('.').pop()}`);
      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (existing) {
        await (supabase.from('studio_profiles').update({ cover_url: url } as any) as any).eq('user_id', user.id);
      } else {
        await (supabase.from('studio_profiles').insert({ user_id: user.id, cover_url: url } as any) as any);
      }
      updateData({ coverUrl: url });
      toast.success('Cover uploaded');
    } catch (e: any) { toast.error(e.message); }
    setCoverUploading(false);
  };

  // ── Section reorder ──
  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSections(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // ── Services helpers ──
  const addService = () => {
    updateData({ services: [...data.services, { title: '', description: '', icon: 'camera' }] });
  };
  const updateService = (idx: number, partial: Partial<ServiceItem>) => {
    const next = [...data.services];
    next[idx] = { ...next[idx], ...partial };
    updateData({ services: next });
  };
  const removeService = (idx: number) => {
    updateData({ services: data.services.filter((_, i) => i !== idx) });
  };

  // ── Testimonials helpers ──
  const addTestimonial = () => {
    updateData({ testimonials: [...data.testimonials, { clientName: '', review: '', rating: 5 }] });
  };
  const updateTestimonial = (idx: number, partial: Partial<Testimonial>) => {
    const next = [...data.testimonials];
    next[idx] = { ...next[idx], ...partial };
    updateData({ testimonials: next });
  };
  const removeTestimonial = (idx: number) => {
    updateData({ testimonials: data.testimonials.filter((_, i) => i !== idx) });
  };

  // ── Featured gallery toggle ──
  const toggleFeatured = (eventId: string) => {
    const ids = data.featuredGalleryIds.includes(eventId)
      ? data.featuredGalleryIds.filter(id => id !== eventId)
      : [...data.featuredGalleryIds, eventId];
    updateData({ featuredGalleryIds: ids });
  };

  // ── Manual save ──
  const handleManualSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await saveData(data, sections);
    toast.success('All changes saved');
  };

  // ── Combined branding for preview ──
  const combinedBranding = {
    studio_name: data.studioName,
    studio_logo_url: data.logoUrl,
    studio_accent_color: data.accentColor,
    bio: data.bio,
    display_name: data.tagline,
    instagram: data.instagram,
    website: data.website,
    whatsapp: data.whatsapp,
    email: data.email,
    footer_text: data.footerText,
    cover_url: data.coverUrl,
    hero_button_label: data.heroButtonLabel,
    hero_button_url: data.heroButtonUrl,
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fileInputs = (
    <>
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
    </>
  );

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {fileInputs}

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 flex items-center justify-between h-14 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => navigate('/dashboard/branding')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium truncate">{data.studioName || 'Brand Editor'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {savedAt && !saving && (
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
              <Check className="inline h-3 w-3 mr-0.5" />Saved
            </span>
          )}
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />}
          <div className="flex bg-muted rounded-full p-0.5">
            <button onClick={() => setMode('edit')} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${mode === 'edit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              Edit
            </button>
            <button onClick={() => setMode('preview')} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${mode === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>
              <Eye className="inline h-3 w-3 mr-1" />Preview
            </button>
          </div>
          <Button size="sm" className="h-9 text-[11px]" onClick={handleManualSave} disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </header>

      {/* ── CONTENT ── */}
      {mode === 'edit' ? (
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Template Selector */}
          <div className="px-4 pt-5 pb-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-3">WEBSITE TEMPLATE</p>
            <button
              onClick={() => setActiveDrawer('template')}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layout className="h-5 w-5 text-muted-foreground/50" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {templates.find(t => t.value === websiteTemplate)?.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {templates.find(t => t.value === websiteTemplate)?.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </button>
          </div>

          {/* Section Cards */}
          <div className="px-4 pt-4 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium mb-3">SECTIONS</p>
            {sections.map((section, idx) => (
              <div key={section.id} className="flex items-center gap-2">
                <div className="flex flex-col shrink-0">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 disabled:opacity-20">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 disabled:opacity-20">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => setActiveDrawer(section.id)}
                  className="flex-1 flex items-center justify-between p-4 bg-card border border-border rounded-xl active:bg-muted/50 transition-colors min-h-[60px]"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="h-5 w-5 text-muted-foreground/50" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{section.label}</p>
                      <p className="text-[10px] text-muted-foreground/50">Tap to edit</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={section.enabled}
                      onCheckedChange={(checked) => {
                        setSections(prev => prev.map((s, i) => i === idx ? { ...s, enabled: checked } : s));
                      }}
                      className="scale-90"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* ── LIVE STUDIO PREVIEW ── */}
          {user && (
            <StudioLivePreview
              branding={combinedBranding}
              template={websiteTemplate}
              sections={sections.map(s => ({ id: s.id, enabled: s.enabled }))}
              accent={data.accentColor}
              services={data.services}
              testimonials={data.testimonials}
              featuredGalleryIds={data.featuredGalleryIds}
              portfolioLayout={data.portfolioLayout as 'grid' | 'masonry' | 'large'}
              userId={user.id}
            />
          )}
        </div>
      ) : (
        /* ── PREVIEW MODE ── */
        <div className="flex-1 overflow-y-auto">
          <div className="border-2 border-dashed border-border/30 rounded-xl m-3 overflow-hidden" style={{ backgroundColor: '#0C0B08' }}>
            {sections.filter(s => s.enabled).map(section => {
              switch (section.id) {
                case 'hero':
                  return <WebsiteHero key="hero" branding={combinedBranding} />;
                case 'social':
                  return <WebsiteSocialBar key="social" instagram={data.instagram} website={data.website} whatsapp={data.whatsapp} email={data.email} accent={data.accentColor} />;
                case 'portfolio':
                  return (
                    <div key="portfolio" className="p-4">
                      <div className="text-center mb-4">
                        <div className="w-6 h-[1px] mx-auto mb-2" style={{ backgroundColor: data.accentColor }} />
                        <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#A6A197' }}>Portfolio Preview</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="aspect-[4/3] rounded" style={{ backgroundColor: '#17140D' }} />
                        ))}
                      </div>
                    </div>
                  );
                case 'about':
                  return data.bio ? <WebsiteAbout key="about" template="vows-elegance" branding={combinedBranding} /> : null;
                case 'featured':
                  return data.featuredGalleryIds.length > 0 ? (
                    <div key="featured" className="py-8 px-4 text-center">
                      <p className="text-[10px] uppercase tracking-[0.25em] mb-2" style={{ color: data.accentColor, opacity: 0.7 }}>Featured Work</p>
                      <div className="grid grid-cols-2 gap-2">
                        {data.featuredGalleryIds.slice(0, 4).map((id) => (
                          <div key={id} className="aspect-[3/2] rounded" style={{ backgroundColor: '#17140D' }} />
                        ))}
                      </div>
                    </div>
                  ) : null;
                case 'services':
                  return <WebsiteServices key="services" services={data.services} accent={data.accentColor} />;
                case 'testimonials':
                  return data.testimonials.length > 0 ? <WebsiteTestimonials key="testimonials" testimonials={data.testimonials} accent={data.accentColor} /> : null;
                case 'albums':
                  return null; // albums managed separately
                case 'contact':
                  return (data.whatsapp || data.website || data.email) ? <WebsiteContact key="contact" template="vows-elegance" branding={combinedBranding} /> : null;
                case 'branding':
                  return null; // branding is meta, not visual
                case 'footer':
                  return <WebsiteFooter key="footer" template="vows-elegance" branding={combinedBranding} />;
                default:
                  return null;
              }
            })}
          </div>
        </div>
      )}

      {/* ── DRAWERS ── */}

      {/* Template Drawer */}
      <Drawer open={activeDrawer === 'template'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Website Template</DrawerTitle>
            <DrawerDescription>Choose your gallery website style</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-3 overflow-y-auto">
            {templates.map(tmpl => (
              <button
                key={tmpl.value}
                onClick={() => { setWebsiteTemplate(tmpl.value); setActiveDrawer(null); }}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors text-left ${
                  websiteTemplate === tmpl.value ? 'border-foreground/30 bg-foreground/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tmpl.bg, border: `1px solid ${tmpl.navBorder}` }}>
                  <Layout className="h-4 w-4" style={{ color: tmpl.text }} />
                </div>
                <div>
                  <p className="text-sm font-medium">{tmpl.label}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{tmpl.description}</p>
                </div>
                {websiteTemplate === tmpl.value && <Check className="h-4 w-4 text-foreground ml-auto shrink-0 mt-1" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Hero Section Drawer */}
      <Drawer open={activeDrawer === 'hero'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Hero Section</DrawerTitle>
            <DrawerDescription>Cover image, tagline, and call-to-action</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Cover Photo</label>
              {data.coverUrl ? (
                <div className="space-y-2">
                  <img src={data.coverUrl} alt="" className="w-full aspect-[16/9] object-cover rounded-lg border border-border" />
                  <Button variant="outline" size="sm" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="w-full h-11 text-[12px]">
                    {coverUploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />} Replace Cover Photo
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => coverRef.current?.click()} disabled={coverUploading} className="w-full h-14 border-dashed text-[12px]">
                  {coverUploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />} Upload Cover Photo
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Tagline</label>
              <Input value={data.tagline} onChange={(e) => updateData({ tagline: e.target.value })} placeholder="Photography by Studio Name" className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Button Label (optional)</label>
              <Input value={data.heroButtonLabel} onChange={(e) => updateData({ heroButtonLabel: e.target.value })} placeholder="View Portfolio" className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Button Link (optional)</label>
              <Input value={data.heroButtonUrl} onChange={(e) => updateData({ heroButtonUrl: e.target.value })} placeholder="#portfolio or https://..." className="h-11" />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Studio Branding Drawer */}
      <Drawer open={activeDrawer === 'branding'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Studio Branding</DrawerTitle>
            <DrawerDescription>Name, logo, and visual identity</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Studio Name</label>
              <Input value={data.studioName} onChange={(e) => updateData({ studioName: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Logo</label>
              {data.logoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={data.logoUrl} alt="" className="h-14 w-auto object-contain border border-border rounded-lg p-1.5 bg-background" />
                  <div className="flex flex-col gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={logoUploading} className="h-9 text-[11px]">
                      {logoUploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Replace
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 text-[11px] text-destructive" onClick={async () => {
                      await (supabase.from('profiles').update({ studio_logo_url: null } as any) as any).eq('user_id', user!.id);
                      updateData({ logoUrl: null });
                    }}>
                      <X className="mr-1 h-3 w-3" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => logoRef.current?.click()} disabled={logoUploading} className="w-full h-14 border-dashed text-[12px]">
                  {logoUploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />} Upload Logo
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={data.accentColor} onChange={(e) => updateData({ accentColor: e.target.value })} className="h-11 w-11 rounded-lg border border-border cursor-pointer" />
                <Input value={data.accentColor} onChange={(e) => updateData({ accentColor: e.target.value })} className="flex-1 h-11 font-mono text-[13px]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Font Style</label>
              <Select value={data.fontStyle} onValueChange={(v) => updateData({ fontStyle: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="serif">Serif (Cormorant Garamond)</SelectItem>
                  <SelectItem value="sans">Sans-serif (Inter)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* About Section Drawer */}
      <Drawer open={activeDrawer === 'about'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">About Section</DrawerTitle>
            <DrawerDescription>Tell your story to visitors</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">About / Bio</label>
              <Textarea value={data.bio} onChange={(e) => updateData({ bio: e.target.value })} placeholder="Tell your story..." className="min-h-[140px]" />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Portfolio Section Drawer */}
      <Drawer open={activeDrawer === 'portfolio'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Portfolio Section</DrawerTitle>
            <DrawerDescription>How your galleries are displayed</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Layout Style</label>
              <Select value={data.portfolioLayout} onValueChange={(v) => updateData({ portfolioLayout: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid (3 columns)</SelectItem>
                  <SelectItem value="masonry">Masonry (2-3 columns)</SelectItem>
                  <SelectItem value="large">Large Cards (2 columns)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground/40">
              The portfolio section automatically displays all galleries you've marked as "Show in Public Feed" in your event settings.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Featured Galleries Drawer */}
      <Drawer open={activeDrawer === 'featured'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Featured Galleries</DrawerTitle>
            <DrawerDescription>Select galleries to highlight</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto">
            {allEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 text-center py-8">No published events yet</p>
            ) : (
              allEvents.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => toggleFeatured(ev.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    data.featuredGalleryIds.includes(ev.id) ? 'border-foreground/30 bg-foreground/5' : 'border-border'
                  }`}
                >
                  <div className="h-12 w-16 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: '#17140D' }}>
                    {ev.cover_url && <img src={ev.cover_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <p className="text-sm font-medium flex-1 truncate">{ev.name}</p>
                  {data.featuredGalleryIds.includes(ev.id) && (
                    <Star className="h-4 w-4 text-foreground shrink-0" fill="currentColor" />
                  )}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Services Drawer */}
      <Drawer open={activeDrawer === 'services'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Services</DrawerTitle>
            <DrawerDescription>List the services you offer</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4 overflow-y-auto">
            {data.services.map((svc, idx) => (
              <div key={idx} className="p-4 bg-card border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Service {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeService(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <Input value={svc.title} onChange={(e) => updateService(idx, { title: e.target.value })} placeholder="Service name" className="h-10" />
                <Textarea value={svc.description} onChange={(e) => updateService(idx, { description: e.target.value })} placeholder="Brief description" className="min-h-[60px]" />
                <Input value={svc.price || ''} onChange={(e) => updateService(idx, { price: e.target.value })} placeholder="Price (optional) e.g. ₹25,000" className="h-10" />
                <Select value={svc.icon || 'camera'} onValueChange={(v) => updateService(idx, { icon: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">📷 Camera</SelectItem>
                    <SelectItem value="heart">❤️ Heart</SelectItem>
                    <SelectItem value="location">📍 Location</SelectItem>
                    <SelectItem value="people">👥 People</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button variant="outline" onClick={addService} className="w-full h-12 border-dashed text-[12px]">
              <Plus className="mr-1.5 h-4 w-4" /> Add Service
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Social Links Drawer */}
      <Drawer open={activeDrawer === 'social'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Social Links</DrawerTitle>
            <DrawerDescription>Links displayed on your portfolio</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3">
              <Instagram className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              <Input value={data.instagram} onChange={(e) => updateData({ instagram: e.target.value })} placeholder="@yourstudio" className="h-11" />
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              <Input value={data.website} onChange={(e) => updateData({ website: e.target.value })} placeholder="www.studio.com" className="h-11" />
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              <Input value={data.whatsapp} onChange={(e) => updateData({ whatsapp: e.target.value })} placeholder="+1234567890" className="h-11" />
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              <Input value={data.email} onChange={(e) => updateData({ email: e.target.value })} placeholder="hello@studio.com" className="h-11" />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Contact Section Drawer */}
      <Drawer open={activeDrawer === 'contact'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Contact Section</DrawerTitle>
            <DrawerDescription>Contact buttons shown on your page</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4 overflow-y-auto">
            <p className="text-[10px] text-muted-foreground/40">
              The contact section automatically uses the social links and email you've configured. Edit them in the Social Links section.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Footer Drawer */}
      <Drawer open={activeDrawer === 'footer'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Footer</DrawerTitle>
            <DrawerDescription>Bottom branding text</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Footer Text</label>
              <Input value={data.footerText} onChange={(e) => updateData({ footerText: e.target.value })} placeholder="Fine art wedding photography" className="h-11" />
            </div>
            <p className="text-[10px] text-muted-foreground/40">
              Footer automatically displays your studio name, social links, and copyright.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Testimonials Drawer */}
      <Drawer open={activeDrawer === 'testimonials'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Testimonials</DrawerTitle>
            <DrawerDescription>Add client reviews</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4 overflow-y-auto">
            {data.testimonials.map((t, idx) => (
              <div key={idx} className="p-4 bg-card border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Review {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTestimonial(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <Input value={t.clientName} onChange={(e) => updateTestimonial(idx, { clientName: e.target.value })} placeholder="Client name" className="h-10" />
                <Textarea value={t.review} onChange={(e) => updateTestimonial(idx, { review: e.target.value })} placeholder="Their review..." className="min-h-[60px]" />
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(r => (
                      <button key={r} onClick={() => updateTestimonial(idx, { rating: r })}
                        className="p-1 transition-colors">
                        <Star className="h-5 w-5" fill={r <= t.rating ? '#D4AF37' : 'transparent'} style={{ color: r <= t.rating ? '#D4AF37' : 'rgba(255,255,255,0.15)' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addTestimonial} className="w-full h-12 border-dashed text-[12px]">
              <Plus className="mr-1.5 h-4 w-4" /> Add Testimonial
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Albums Drawer */}
      {user && (
        <AlbumManagerDrawer
          open={activeDrawer === 'albums'}
          onClose={() => setActiveDrawer(null)}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default BrandEditor;
