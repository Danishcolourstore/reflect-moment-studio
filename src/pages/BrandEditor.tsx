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
  Instagram, Globe, MessageCircle, Mail, GripVertical,
  ChevronUp, ChevronDown, Check, Type, Palette, Image as ImageIcon,
  Layout, User, Phone, FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { WEBSITE_TEMPLATES, type WebsiteTemplateValue } from '@/lib/website-templates';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { WebsiteAbout } from '@/components/website/WebsiteAbout';
import { WebsiteContact } from '@/components/website/WebsiteContact';

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
}

type SectionId = 'hero' | 'branding' | 'about' | 'contact' | 'footer';

interface SectionConfig {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'hero', label: 'Hero Section', icon: ImageIcon, enabled: true },
  { id: 'branding', label: 'Studio Branding', icon: Palette, enabled: true },
  { id: 'about', label: 'About Section', icon: User, enabled: true },
  { id: 'contact', label: 'Contact Section', icon: Phone, enabled: true },
  { id: 'footer', label: 'Footer', icon: FileText, enabled: true },
];

/* ── Main Component ── */
const BrandEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [data, setData] = useState<BrandData>({
    studioName: '', tagline: '', bio: '', accentColor: '#b08d57',
    logoUrl: null, coverUrl: null, instagram: '', website: '',
    whatsapp: '', email: '', footerText: '', fontStyle: 'serif',
  });
  const [websiteTemplate, setWebsiteTemplate] = useState<WebsiteTemplateValue>('editorial-studio');
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);

  // UI state
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
      };
      setData(newData);
      lastSavedData.current = JSON.stringify(newData);
      setLoading(false);
    })();
  }, [user]);

  // ── Auto-save ──
  const saveData = useCallback(async (d: BrandData) => {
    if (!user) return;
    const currentJson = JSON.stringify(d);
    if (currentJson === lastSavedData.current) return;

    setSaving(true);
    await (supabase.from('profiles').update({ studio_name: d.studioName, studio_accent_color: d.accentColor } as any) as any).eq('user_id', user.id);
    const studioPayload = {
      bio: d.bio || null, display_name: d.tagline || null,
      instagram: d.instagram || null, website: d.website || null,
      whatsapp: d.whatsapp || null, footer_text: d.footerText || null,
      font_style: d.fontStyle,
    };
    const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).single();
    if (existing) {
      await (supabase.from('studio_profiles').update(studioPayload as any) as any).eq('user_id', user.id);
    } else {
      await (supabase.from('studio_profiles').insert({ user_id: user.id, ...studioPayload } as any) as any);
    }
    lastSavedData.current = currentJson;
    setSavedAt(new Date());
    setSaving(false);
  }, [user]);

  const updateData = useCallback((partial: Partial<BrandData>) => {
    setData(prev => {
      const next = { ...prev, ...partial };
      // Schedule auto-save
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
      const { data: existing } = await (supabase.from('studio_profiles').select('id') as any).eq('user_id', user.id).single();
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

  // ── Manual save ──
  const handleManualSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    await saveData(data);
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
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Hidden file inputs
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
          {/* Save indicator */}
          {savedAt && !saving && (
            <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
              <Check className="inline h-3 w-3 mr-0.5" />Saved
            </span>
          )}
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />}

          {/* Mode toggle */}
          <div className="flex bg-muted rounded-full p-0.5">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${mode === 'edit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${mode === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
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
          {/* Template Selector Card */}
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
                    {WEBSITE_TEMPLATES.find(t => t.value === websiteTemplate)?.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {WEBSITE_TEMPLATES.find(t => t.value === websiteTemplate)?.description}
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
                {/* Reorder buttons */}
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0}
                    className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 disabled:opacity-20"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(idx, 1)}
                    disabled={idx === sections.length - 1}
                    className="h-5 w-5 flex items-center justify-center text-muted-foreground/40 disabled:opacity-20"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Card */}
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
        </div>
      ) : (
        /* ── PREVIEW MODE ── */
        <div className="flex-1 overflow-y-auto">
          <div className="border-2 border-dashed border-border/30 rounded-xl m-3 overflow-hidden">
            <WebsiteHeader
              template={websiteTemplate}
              branding={combinedBranding}
              eventName="Sample Wedding"
            />

            {/* Mock hero */}
            {sections.find(s => s.id === 'hero')?.enabled && (
              <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                {data.coverUrl ? (
                  <img src={data.coverUrl} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-secondary to-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <p className="text-white text-2xl font-light tracking-wide">Sample Wedding</p>
                  <p className="text-white/50 text-xs mt-2">{data.tagline || 'Your tagline'}</p>
                </div>
              </div>
            )}

            {/* Mock gallery placeholder */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-muted rounded aspect-square" />
                ))}
              </div>
            </div>

            {/* About section */}
            {sections.find(s => s.id === 'about')?.enabled && data.bio && (
              <WebsiteAbout template={websiteTemplate} branding={combinedBranding} />
            )}

            {/* Contact section */}
            {sections.find(s => s.id === 'contact')?.enabled && (data.whatsapp || data.website || data.email) && (
              <WebsiteContact template={websiteTemplate} branding={combinedBranding} />
            )}

            {/* Footer */}
            {sections.find(s => s.id === 'footer')?.enabled && (
              <WebsiteFooter template={websiteTemplate} branding={combinedBranding} />
            )}
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
            {WEBSITE_TEMPLATES.map(tmpl => (
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
            <DrawerDescription>Cover image and presentation</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            {/* Cover photo */}
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
            {/* Logo */}
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
            {/* Accent color */}
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Brand Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={data.accentColor} onChange={(e) => updateData({ accentColor: e.target.value })} className="h-11 w-11 rounded-lg border border-border cursor-pointer" />
                <Input value={data.accentColor} onChange={(e) => updateData({ accentColor: e.target.value })} className="flex-1 h-11 font-mono text-[13px]" />
              </div>
            </div>
            {/* Font */}
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
            <DrawerDescription>Tell your story to guests</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">About / Bio</label>
              <Textarea
                value={data.bio}
                onChange={(e) => updateData({ bio: e.target.value })}
                placeholder="Tell your story..."
                className="min-h-[140px]"
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Contact Section Drawer */}
      <Drawer open={activeDrawer === 'contact'} onOpenChange={(open) => !open && setActiveDrawer(null)}>
        <DrawerContent className="max-h-[88dvh]">
          <DrawerHeader>
            <DrawerTitle className="text-base">Contact & Social</DrawerTitle>
            <DrawerDescription>How guests can reach you</DrawerDescription>
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
              Footer automatically displays your studio name, social links, and copyright. A subtle "Powered by MirrorAI" appears below.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default BrandEditor;
