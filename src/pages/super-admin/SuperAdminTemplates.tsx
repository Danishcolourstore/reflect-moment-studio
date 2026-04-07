import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const clearTemplateCache = () => {};
const useInvalidateTemplates = () => () => {};
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Upload, Save, ArrowLeft,
  Image as ImageIcon, X, Camera, Mail, Instagram, Globe, ChevronDown,
  Monitor, Smartphone, Tablet, Menu as MenuIcon, Copy, GripVertical,
  ChevronUp, Settings2, Play, Film, MessageSquare, Users, Heart,
  Layers, ToggleLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import browserImageCompression from 'browser-image-compression';

/* ───────── Section Types ───────── */

const ALL_SECTION_TYPES = [
  { id: 'hero', label: 'Hero Section', icon: ImageIcon, description: 'Full-screen hero image with overlay text' },
  { id: 'portfolio', label: 'Portfolio Gallery', icon: Camera, description: 'Masonry or grid photo showcase' },
  { id: 'featured_stories', label: 'Featured Stories', icon: Heart, description: 'Wedding/story cards with image and text' },
  { id: 'gallery', label: 'Image Grid Gallery', icon: Layers, description: 'Editorial image grid with lightbox' },
  { id: 'about', label: 'About Section', icon: Users, description: 'Photographer bio with portrait' },
  { id: 'services', label: 'Services', icon: Settings2, description: 'Service offerings list' },
  { id: 'films', label: 'Films / Video', icon: Film, description: 'Video thumbnails with play overlay' },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, description: 'Client testimonials' },
  { id: 'instagram', label: 'Instagram Gallery', icon: Instagram, description: 'Square social image grid' },
  { id: 'contact', label: 'Contact / Inquiry', icon: Mail, description: 'Contact form with WhatsApp' },
  { id: 'footer', label: 'Footer', icon: Globe, description: 'Minimal footer with social links' },
] as const;

type SectionId = typeof ALL_SECTION_TYPES[number]['id'];

interface SectionConfig {
  id: SectionId;
  enabled: boolean;
  order: number;
}

/* ───────── Types ───────── */

interface DemoContent {
  hero?: { headline?: string; tagline?: string; button_text?: string; image_url?: string | null };
  portfolio?: { layout?: string; max_images?: number; demo_images?: string[] };
  about?: { bio?: string; profile_image_url?: string | null };
  services?: { title: string; description: string; icon: string }[];
  contact?: { heading?: string; button_text?: string; show_whatsapp?: boolean };
  footer?: { text?: string; show_social?: boolean; email?: string };
  gallery_images?: string[];
  featured_stories?: { title: string; location: string; image_url: string }[];
  films?: { title: string; thumbnail_url: string; video_url?: string }[];
  social_images?: string[];
  testimonials?: { name: string; text: string; location?: string }[];
}

interface StylingConfig {
  fontFamily?: string;
  uiFontFamily?: string;
  bg?: string;
  text?: string;
  textSecondary?: string;
  navBg?: string;
  navBorder?: string;
  headerStyle?: string;
  heroStyle?: string;
  cardBg?: string;
  footerBg?: string;
  footerText?: string;
  galleryColumnsDesktop?: number;
  galleryColumnsTablet?: number;
  galleryColumnsMobile?: number;
  buttonStyle?: 'outline' | 'solid' | 'ghost';
  spacing?: 'compact' | 'normal' | 'generous';
}

interface TemplateRow {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  category: string;
  preview_image_url: string | null;
  font_family: string;
  ui_font_family: string;
  bg_color: string;
  text_color: string;
  text_secondary_color: string;
  nav_bg: string;
  nav_border: string;
  header_style: string;
  hero_style: string;
  card_bg: string;
  footer_bg: string;
  footer_text_color: string;
  demo_content: DemoContent;
  styling_config: StylingConfig;
  section_config: { sections?: SectionConfig[] };
  created_at: string;
  updated_at: string;
}

const DEFAULT_SECTIONS: SectionConfig[] = ALL_SECTION_TYPES.map((s, i) => ({
  id: s.id,
  enabled: ['hero', 'portfolio', 'about', 'contact', 'footer'].includes(s.id),
  order: i,
}));

const EMPTY_TEMPLATE: Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'> = {
  slug: '', label: '', description: '', is_active: false, sort_order: 0,
  category: 'wedding', preview_image_url: null,
  font_family: '"Cormorant Garamond", Georgia, serif',
  ui_font_family: '"DM Sans", sans-serif',
  bg_color: '#0C0A07', text_color: '#F2EDE4', text_secondary_color: '#A69E8F',
  nav_bg: 'rgba(12,10,7,0.75)', nav_border: 'rgba(242,237,228,0.06)',
  header_style: 'transparent', hero_style: 'vows',
  card_bg: '#161310', footer_bg: '#0C0A07', footer_text_color: '#7A7365',
  demo_content: {
    hero: { headline: 'Your Story', tagline: 'Photography', button_text: 'View Portfolio', image_url: null },
    portfolio: { layout: 'masonry', max_images: 20, demo_images: [] },
    about: { bio: 'Award-winning photographer with a passion for capturing authentic moments.', profile_image_url: null },
    services: [],
    contact: { heading: 'Get In Touch', button_text: 'Send Message', show_whatsapp: true },
    footer: { text: '© 2025 Studio Name', show_social: true, email: 'hello@studio.com' },
    gallery_images: [],
    featured_stories: [],
    films: [],
    social_images: [],
    testimonials: [],
  },
  styling_config: {
    galleryColumnsDesktop: 3,
    galleryColumnsTablet: 2,
    galleryColumnsMobile: 1,
    buttonStyle: 'outline',
    spacing: 'normal',
  },
  section_config: { sections: DEFAULT_SECTIONS },
};

const MAX_PORTFOLIO_IMAGES = 20;
const MAX_GALLERY_IMAGES = 20;
const MAX_SOCIAL_IMAGES = 12;

const CATEGORIES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'other', label: 'Other' },
];

/* ───────── Main Component ───────── */

export default function SuperAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>>(EMPTY_TEMPLATE);
  const invalidateTemplates = useInvalidateTemplates();

  const loadTemplates = useCallback(async () => {
    const { data, error } = await (supabase.from('website_templates').select('*') as any).order('sort_order');
    if (error) { toast.error('Failed to load templates'); return; }
    setTemplates(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const startCreate = () => {
    setForm({ ...EMPTY_TEMPLATE, sort_order: templates.length + 1 });
    setCreating(true); setEditing(null);
  };

  const startEdit = (tmpl: TemplateRow) => {
    const { id, created_at, updated_at, ...rest } = tmpl;
    setForm({
      ...rest,
      demo_content: tmpl.demo_content || EMPTY_TEMPLATE.demo_content,
      styling_config: tmpl.styling_config || EMPTY_TEMPLATE.styling_config,
      section_config: tmpl.section_config?.sections ? tmpl.section_config : { sections: DEFAULT_SECTIONS },
    });
    setEditing(tmpl); setCreating(false);
  };

  const cancelEdit = () => { setEditing(null); setCreating(false); };

  const handleSave = async () => {
    if (!form.slug || !form.label) { toast.error('Slug and Label are required'); return; }
    setSaving(true);
    try {
      if (creating) {
        const { error } = await (supabase.from('website_templates').insert(form as any) as any);
        if (error) throw error;
        toast.success('Template created');
      } else if (editing) {
        const { error } = await (supabase.from('website_templates').update(form as any) as any).eq('id', editing.id);
        if (error) throw error;
        toast.success('Template updated');
      }
      setEditing(null); setCreating(false);
      clearTemplateCache();
      invalidateTemplates();
      await loadTemplates();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('website_templates').delete() as any).eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Template deleted'); clearTemplateCache(); invalidateTemplates(); loadTemplates();
  };

  const handleDuplicate = async (tmpl: TemplateRow) => {
    const { id, created_at, updated_at, ...rest } = tmpl;
    const newSlug = `${rest.slug}-copy-${Date.now().toString(36).slice(-4)}`;
    const payload = { ...rest, slug: newSlug, label: `${rest.label} (Copy)`, is_active: false, sort_order: templates.length + 1 };
    const { error } = await (supabase.from('website_templates').insert(payload as any) as any);
    if (error) { toast.error('Duplicate failed'); return; }
    toast.success('Template duplicated');
    clearTemplateCache(); invalidateTemplates(); loadTemplates();
  };

  const handleToggleActive = async (tmpl: TemplateRow) => {
    await (supabase.from('website_templates').update({ is_active: !tmpl.is_active } as any) as any).eq('id', tmpl.id);
    loadTemplates(); clearTemplateCache(); invalidateTemplates();
  };

  const uploadDemoImage = async (file: File, folder: string): Promise<string | null> => {
    try {
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 2, maxWidthOrHeight: 2400, useWebWorker: true, fileType: 'image/webp',
      });
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const path = `template-demos/${folder}/${fileName}`;
      const { error } = await supabase.storage.from('studio-website-assets').upload(path, compressed, { upsert: true, contentType: 'image/webp' });
      if (error) throw error;
      return supabase.storage.from('studio-website-assets').getPublicUrl(path).data.publicUrl;
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
      return null;
    }
  };

  const updateDemoContent = (path: string, value: any) => {
    setForm(prev => {
      const dc = JSON.parse(JSON.stringify(prev.demo_content || {}));
      const parts = path.split('.');
      let obj = dc;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return { ...prev, demo_content: dc };
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (editing || creating) {
    return (
      <TemplateEditor
        form={form}
        setForm={setForm}
        creating={creating}
        editing={editing}
        saving={saving}
        onSave={handleSave}
        onCancel={cancelEdit}
        uploadDemoImage={uploadDemoImage}
        updateDemoContent={updateDemoContent}
      />
    );
  }

  /* ── Template List View ── */
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-serif">Template Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, edit, and manage website templates</p>
        </div>
        <Button onClick={startCreate} className="gap-1.5"><Plus className="h-4 w-4" /> Create Template</Button>
      </div>

      <div className="space-y-3">
        {templates.map(tmpl => (
          <Card key={tmpl.id} className={`transition-opacity ${!tmpl.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-20 h-14 rounded-lg border border-border shrink-0 overflow-hidden relative" style={{ backgroundColor: tmpl.bg_color }}>
                {(tmpl.preview_image_url || tmpl.demo_content?.hero?.image_url) ? (
                  <img src={tmpl.preview_image_url || tmpl.demo_content?.hero?.image_url || ''} alt="" className="w-full h-full object-cover opacity-70" />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: tmpl.text_color }}>
                  <span className="text-[10px] font-bold" style={{ fontFamily: tmpl.font_family }}>Aa</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{tmpl.label}</h3>
                  <Badge variant="outline" className="text-[9px] shrink-0">{tmpl.slug}</Badge>
                  <Badge variant="secondary" className="text-[9px] shrink-0 capitalize">{tmpl.category || 'wedding'}</Badge>
                  {!tmpl.is_active && <Badge variant="destructive" className="text-[9px]">Draft</Badge>}
                  {tmpl.is_active && <Badge className="text-[9px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{tmpl.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground/50">
                    {(tmpl.section_config as any)?.sections?.filter((s: any) => s.enabled).length || 0} sections
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {(tmpl.demo_content?.portfolio?.demo_images || []).length + (tmpl.demo_content?.gallery_images || []).length} images
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    Updated {new Date(tmpl.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(tmpl)} title={tmpl.is_active ? 'Deactivate' : 'Activate'}>
                  {tmpl.is_active ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(tmpl)} title="Duplicate">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(tmpl)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete "{tmpl.label}". Photographers using this template will fall back to the default.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(tmpl.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No templates yet</p>
            <p className="text-xs mt-1">Create your first website template</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Template Editor with Live Preview ───────── */

interface TemplateEditorProps {
  form: Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>;
  setForm: React.Dispatch<React.SetStateAction<Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>>>;
  creating: boolean;
  editing: TemplateRow | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  uploadDemoImage: (file: File, folder: string) => Promise<string | null>;
  updateDemoContent: (path: string, value: any) => void;
}

function TemplateEditor({ form, setForm, creating, editing, saving, onSave, onCancel, uploadDemoImage, updateDemoContent }: TemplateEditorProps) {
  const sections = useMemo(() => {
    const s = (form.section_config?.sections || DEFAULT_SECTIONS);
    return [...s].sort((a, b) => a.order - b.order);
  }, [form.section_config]);

  const updateSections = (newSections: SectionConfig[]) => {
    setForm(p => ({ ...p, section_config: { sections: newSections } }));
  };

  const toggleSection = (id: SectionId) => {
    updateSections(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const moveSection = (id: SectionId, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx < 0) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= sections.length) return;
    const updated = [...sections];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    updateSections(updated.map((s, i) => ({ ...s, order: i })));
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h2 className="text-sm font-semibold">{creating ? 'New Template' : `Edit: ${editing?.label}`}</h2>
        <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {creating ? 'Create' : 'Save Changes'}
        </Button>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={55}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="general" className="text-[9px]">General</TabsTrigger>
                  <TabsTrigger value="sections" className="text-[9px]">Sections</TabsTrigger>
                  <TabsTrigger value="content" className="text-[9px]">Content</TabsTrigger>
                  <TabsTrigger value="images" className="text-[9px]">Images</TabsTrigger>
                  <TabsTrigger value="styling" className="text-[9px]">Styling</TabsTrigger>
                </TabsList>

                {/* ── General Tab ── */}
                <TabsContent value="general" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Template Slug</label>
                      <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} className="mt-1 h-8 text-xs" placeholder="my-template" disabled={!!editing} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Template Name</label>
                      <Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className="mt-1 h-8 text-xs" placeholder="My Template" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Description</label>
                    <Textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 text-xs" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Category</label>
                      <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Sort Order</label>
                      <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 h-8 text-xs" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <span className="text-xs font-medium">Template Status</span>
                      <p className="text-[10px] text-muted-foreground">{form.is_active ? 'Active — visible to photographers' : 'Draft — hidden from photographers'}</p>
                    </div>
                    <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                  </div>
                  <DemoImageUploader
                    label="Preview Thumbnail"
                    value={form.preview_image_url || null}
                    onChange={url => setForm(p => ({ ...p, preview_image_url: url }))}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />
                </TabsContent>

                {/* ── Sections Tab ── */}
                <TabsContent value="sections" className="space-y-2">
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Toggle sections on/off and reorder them. The template is a single scrolling page built from these sections.
                  </p>
                  {sections.map((section, idx) => {
                    const meta = ALL_SECTION_TYPES.find(s => s.id === section.id);
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={section.id}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                          section.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveSection(section.id, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-20"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveSection(section.id, 'down')}
                            disabled={idx === sections.length - 1}
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-20"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{meta.label}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{meta.description}</p>
                        </div>
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => toggleSection(section.id)}
                          className="shrink-0"
                        />
                      </div>
                    );
                  })}
                </TabsContent>

                {/* ── Content Tab ── */}
                <TabsContent value="content" className="space-y-4">
                  {sections.filter(s => s.enabled).map(section => {
                    switch (section.id) {
                      case 'hero':
                        return (
                          <ContentSection key="hero" title="🖼️ Hero Section">
                            <Input value={form.demo_content?.hero?.headline || ''} onChange={e => updateDemoContent('hero.headline', e.target.value)} placeholder="Headline" className="h-8 text-xs" />
                            <Input value={form.demo_content?.hero?.tagline || ''} onChange={e => updateDemoContent('hero.tagline', e.target.value)} placeholder="Tagline" className="h-8 text-xs" />
                            <Input value={form.demo_content?.hero?.button_text || ''} onChange={e => updateDemoContent('hero.button_text', e.target.value)} placeholder="Button Text" className="h-8 text-xs" />
                          </ContentSection>
                        );
                      case 'about':
                        return (
                          <ContentSection key="about" title="👤 About">
                            <Textarea value={form.demo_content?.about?.bio || ''} onChange={e => updateDemoContent('about.bio', e.target.value)} placeholder="Bio text" rows={3} className="text-xs" />
                          </ContentSection>
                        );
                      case 'services':
                        return (
                          <ContentSection key="services" title="💼 Services">
                            {(form.demo_content?.services || []).map((svc, i) => (
                              <div key={i} className="flex items-center gap-1.5 p-1.5 border border-border rounded">
                                <Input value={svc.title} onChange={e => {
                                  const svcs = [...(form.demo_content?.services || [])];
                                  svcs[i] = { ...svcs[i], title: e.target.value };
                                  updateDemoContent('services', svcs);
                                }} className="flex-1 h-7 text-[10px]" placeholder="Title" />
                                <Input value={svc.description} onChange={e => {
                                  const svcs = [...(form.demo_content?.services || [])];
                                  svcs[i] = { ...svcs[i], description: e.target.value };
                                  updateDemoContent('services', svcs);
                                }} className="flex-1 h-7 text-[10px]" placeholder="Description" />
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                  updateDemoContent('services', (form.demo_content?.services || []).filter((_, idx) => idx !== i));
                                }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => {
                              updateDemoContent('services', [...(form.demo_content?.services || []), { title: 'New Service', description: '', icon: 'camera' }]);
                            }}><Plus className="h-3 w-3 mr-1" /> Add Service</Button>
                          </ContentSection>
                        );
                      case 'featured_stories':
                        return (
                          <ContentSection key="featured" title="💍 Featured Stories">
                            {(form.demo_content?.featured_stories || []).map((story, i) => (
                              <div key={i} className="space-y-1.5 p-2 border border-border rounded">
                                <div className="flex gap-1.5">
                                  <Input value={story.title} onChange={e => {
                                    const stories = [...(form.demo_content?.featured_stories || [])];
                                    stories[i] = { ...stories[i], title: e.target.value };
                                    updateDemoContent('featured_stories', stories);
                                  }} className="flex-1 h-7 text-[10px]" placeholder="Couple names" />
                                  <Input value={story.location} onChange={e => {
                                    const stories = [...(form.demo_content?.featured_stories || [])];
                                    stories[i] = { ...stories[i], location: e.target.value };
                                    updateDemoContent('featured_stories', stories);
                                  }} className="flex-1 h-7 text-[10px]" placeholder="Location" />
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                    updateDemoContent('featured_stories', (form.demo_content?.featured_stories || []).filter((_, idx) => idx !== i));
                                  }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                </div>
                                <SingleImageField
                                  value={story.image_url}
                                  onChange={url => {
                                    const stories = [...(form.demo_content?.featured_stories || [])];
                                    stories[i] = { ...stories[i], image_url: url || '' };
                                    updateDemoContent('featured_stories', stories);
                                  }}
                                  folder={form.slug || 'new'}
                                  uploadFn={uploadDemoImage}
                                />
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => {
                              updateDemoContent('featured_stories', [...(form.demo_content?.featured_stories || []), { title: 'Couple Names', location: 'Location', image_url: '' }]);
                            }}><Plus className="h-3 w-3 mr-1" /> Add Story</Button>
                          </ContentSection>
                        );
                      case 'films':
                        return (
                          <ContentSection key="films" title="🎬 Films / Videos">
                            {(form.demo_content?.films || []).map((film, i) => (
                              <div key={i} className="space-y-1.5 p-2 border border-border rounded">
                                <Input value={film.title} onChange={e => {
                                  const films = [...(form.demo_content?.films || [])];
                                  films[i] = { ...films[i], title: e.target.value };
                                  updateDemoContent('films', films);
                                }} className="h-7 text-[10px]" placeholder="Film title" />
                                <Input value={film.video_url || ''} onChange={e => {
                                  const films = [...(form.demo_content?.films || [])];
                                  films[i] = { ...films[i], video_url: e.target.value };
                                  updateDemoContent('films', films);
                                }} className="h-7 text-[10px]" placeholder="YouTube/Vimeo URL" />
                                <div className="flex items-center gap-2">
                                  <SingleImageField
                                    value={film.thumbnail_url}
                                    onChange={url => {
                                      const films = [...(form.demo_content?.films || [])];
                                      films[i] = { ...films[i], thumbnail_url: url || '' };
                                      updateDemoContent('films', films);
                                    }}
                                    folder={form.slug || 'new'}
                                    uploadFn={uploadDemoImage}
                                  />
                                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                    updateDemoContent('films', (form.demo_content?.films || []).filter((_, idx) => idx !== i));
                                  }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                </div>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => {
                              updateDemoContent('films', [...(form.demo_content?.films || []), { title: 'Wedding Film', thumbnail_url: '', video_url: '' }]);
                            }}><Plus className="h-3 w-3 mr-1" /> Add Film</Button>
                          </ContentSection>
                        );
                      case 'testimonials':
                        return (
                          <ContentSection key="testimonials" title="💬 Testimonials">
                            {(form.demo_content?.testimonials || []).map((t, i) => (
                              <div key={i} className="flex items-start gap-1.5 p-1.5 border border-border rounded">
                                <div className="flex-1 space-y-1">
                                  <Input value={t.name} onChange={e => {
                                    const ts = [...(form.demo_content?.testimonials || [])];
                                    ts[i] = { ...ts[i], name: e.target.value };
                                    updateDemoContent('testimonials', ts);
                                  }} className="h-7 text-[10px]" placeholder="Client name" />
                                  <Textarea value={t.text} onChange={e => {
                                    const ts = [...(form.demo_content?.testimonials || [])];
                                    ts[i] = { ...ts[i], text: e.target.value };
                                    updateDemoContent('testimonials', ts);
                                  }} className="text-[10px]" rows={2} placeholder="Quote" />
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                                  updateDemoContent('testimonials', (form.demo_content?.testimonials || []).filter((_, idx) => idx !== i));
                                }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => {
                              updateDemoContent('testimonials', [...(form.demo_content?.testimonials || []), { name: 'Client Name', text: 'Amazing experience!', location: '' }]);
                            }}><Plus className="h-3 w-3 mr-1" /> Add Testimonial</Button>
                          </ContentSection>
                        );
                      case 'contact':
                        return (
                          <ContentSection key="contact" title="✉️ Contact / Inquiry">
                            <Input value={form.demo_content?.contact?.heading || ''} onChange={e => updateDemoContent('contact.heading', e.target.value)} placeholder="Contact Heading" className="h-8 text-xs" />
                            <Input value={form.demo_content?.contact?.button_text || ''} onChange={e => updateDemoContent('contact.button_text', e.target.value)} placeholder="Button Text" className="h-8 text-xs" />
                            <div className="flex items-center gap-2">
                              <Switch checked={form.demo_content?.contact?.show_whatsapp ?? true} onCheckedChange={v => updateDemoContent('contact.show_whatsapp', v)} />
                              <span className="text-[10px] text-muted-foreground">Show WhatsApp button</span>
                            </div>
                          </ContentSection>
                        );
                      case 'footer':
                        return (
                          <ContentSection key="footer" title="🔻 Footer">
                            <Input value={form.demo_content?.footer?.text || ''} onChange={e => updateDemoContent('footer.text', e.target.value)} placeholder="Footer text" className="h-8 text-xs" />
                            <Input value={form.demo_content?.footer?.email || ''} onChange={e => updateDemoContent('footer.email', e.target.value)} placeholder="Email" className="h-8 text-xs" />
                            <div className="flex items-center gap-2">
                              <Switch checked={form.demo_content?.footer?.show_social ?? true} onCheckedChange={v => updateDemoContent('footer.show_social', v)} />
                              <span className="text-[10px] text-muted-foreground">Show social icons</span>
                            </div>
                          </ContentSection>
                        );
                      case 'portfolio':
                        return (
                          <ContentSection key="portfolio" title="📷 Portfolio Settings">
                            <Select value={form.demo_content?.portfolio?.layout || 'masonry'} onValueChange={v => updateDemoContent('portfolio.layout', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="grid">Grid</SelectItem>
                                <SelectItem value="masonry">Masonry</SelectItem>
                                <SelectItem value="large">Full Width</SelectItem>
                              </SelectContent>
                            </Select>
                          </ContentSection>
                        );
                      default:
                        return null;
                    }
                  })}
                </TabsContent>

                {/* ── Images Tab ── */}
                <TabsContent value="images" className="space-y-5">
                  <DemoImageUploader
                    label="Hero Image"
                    value={form.demo_content?.hero?.image_url || null}
                    onChange={url => updateDemoContent('hero.image_url', url)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />
                  <DemoImageUploader
                    label="About Portrait"
                    value={form.demo_content?.about?.profile_image_url || null}
                    onChange={url => updateDemoContent('about.profile_image_url', url)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />

                  {/* Portfolio Images */}
                  <MultiImageSection
                    label="Portfolio Demo Images"
                    images={form.demo_content?.portfolio?.demo_images || []}
                    max={MAX_PORTFOLIO_IMAGES}
                    onChange={urls => updateDemoContent('portfolio.demo_images', urls)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />

                  {/* Gallery Images */}
                  <MultiImageSection
                    label="Gallery Images"
                    images={form.demo_content?.gallery_images || []}
                    max={MAX_GALLERY_IMAGES}
                    onChange={urls => updateDemoContent('gallery_images', urls)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />

                  {/* Social / Instagram Images */}
                  <MultiImageSection
                    label="Social / Instagram Images"
                    images={form.demo_content?.social_images || []}
                    max={MAX_SOCIAL_IMAGES}
                    onChange={urls => updateDemoContent('social_images', urls)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />
                </TabsContent>

                {/* ── Styling Tab ── */}
                <TabsContent value="styling" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Heading Font</label>
                      <Input value={form.font_family} onChange={e => setForm(p => ({ ...p, font_family: e.target.value }))} className="mt-1 h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">UI Font</label>
                      <Input value={form.ui_font_family} onChange={e => setForm(p => ({ ...p, ui_font_family: e.target.value }))} className="mt-1 h-8 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ['bg_color', 'Background'], ['text_color', 'Text'], ['text_secondary_color', 'Secondary'],
                      ['card_bg', 'Card BG'], ['footer_bg', 'Footer BG'], ['footer_text_color', 'Footer Text'],
                    ] as const).map(([key, label]) => (
                      <div key={key}>
                        <label className="text-[9px] font-medium text-muted-foreground">{label}</label>
                        <div className="flex items-center gap-1 mt-0.5">
                          <input type="color" value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="h-7 w-7 rounded border border-border cursor-pointer shrink-0" />
                          <Input value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="h-7 text-[10px] flex-1" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Nav BG</label>
                      <Input value={form.nav_bg} onChange={e => setForm(p => ({ ...p, nav_bg: e.target.value }))} className="mt-1 h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Nav Border</label>
                      <Input value={form.nav_border} onChange={e => setForm(p => ({ ...p, nav_border: e.target.value }))} className="mt-1 h-8 text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Header Style</label>
                      <Select value={form.header_style} onValueChange={v => setForm(p => ({ ...p, header_style: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transparent">Transparent</SelectItem>
                          <SelectItem value="solid">Solid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Hero Style</label>
                      <Select value={form.hero_style} onValueChange={v => setForm(p => ({ ...p, hero_style: v }))}>
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vows">Vows (Full Bleed)</SelectItem>
                          <SelectItem value="editorial">Editorial (Split)</SelectItem>
                          <SelectItem value="modern-grid">Modern Grid</SelectItem>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Responsive Gallery Columns */}
                  <div className="p-3 rounded-lg border border-border space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground">Gallery Responsive Columns</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] text-muted-foreground flex items-center gap-1"><Monitor className="h-3 w-3" /> Desktop</label>
                        <Input
                          type="number" min={1} max={6}
                          value={form.styling_config?.galleryColumnsDesktop || 3}
                          onChange={e => setForm(p => ({ ...p, styling_config: { ...p.styling_config, galleryColumnsDesktop: parseInt(e.target.value) || 3 } }))}
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground flex items-center gap-1"><Tablet className="h-3 w-3" /> Tablet</label>
                        <Input
                          type="number" min={1} max={4}
                          value={form.styling_config?.galleryColumnsTablet || 2}
                          onChange={e => setForm(p => ({ ...p, styling_config: { ...p.styling_config, galleryColumnsTablet: parseInt(e.target.value) || 2 } }))}
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile</label>
                        <Input
                          type="number" min={1} max={3}
                          value={form.styling_config?.galleryColumnsMobile || 1}
                          onChange={e => setForm(p => ({ ...p, styling_config: { ...p.styling_config, galleryColumnsMobile: parseInt(e.target.value) || 1 } }))}
                          className="h-7 text-[10px] mt-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Button Style</label>
                      <Select
                        value={form.styling_config?.buttonStyle || 'outline'}
                        onValueChange={v => setForm(p => ({ ...p, styling_config: { ...p.styling_config, buttonStyle: v as any } }))}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Spacing</label>
                      <Select
                        value={form.styling_config?.spacing || 'normal'}
                        onValueChange={v => setForm(p => ({ ...p, styling_config: { ...p.styling_config, spacing: v as any } }))}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="compact">Compact</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="generous">Generous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60}>
          <PreviewPanel form={form} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* ───────── Preview Panel ───────── */

function PreviewPanel({ form }: { form: Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'> }) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const sections = useMemo(() => {
    const s = form.section_config?.sections || DEFAULT_SECTIONS;
    return [...s].filter(sec => sec.enabled).sort((a, b) => a.order - b.order);
  }, [form.section_config]);

  const dc = form.demo_content || {};
  const spacing = form.styling_config?.spacing === 'compact' ? '24px' : form.styling_config?.spacing === 'generous' ? '64px' : '40px';
  const cols = device === 'mobile' ? (form.styling_config?.galleryColumnsMobile || 1) : device === 'tablet' ? (form.styling_config?.galleryColumnsTablet || 2) : (form.styling_config?.galleryColumnsDesktop || 3);
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-center gap-1 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        {(['desktop', 'tablet', 'mobile'] as const).map(d => {
          const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
          return (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                device === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          );
        })}
      </div>

      <ScrollArea className="flex-1">
        <div className={`mx-auto transition-all duration-300 ${isMobile ? 'max-w-[375px]' : isTablet ? 'max-w-[768px]' : ''}`}>
          <div style={{ backgroundColor: form.bg_color, color: form.text_color, fontFamily: form.ui_font_family }} className="min-h-full">
            {/* Nav */}
            <nav className="sticky top-0 z-10 flex items-center justify-between" style={{
              background: form.nav_bg, borderBottom: `1px solid ${form.nav_border}`,
              padding: isMobile ? '10px 16px' : '12px 24px'
            }}>
              <span className="font-semibold" style={{ fontFamily: form.font_family, fontSize: isMobile ? 13 : 14 }}>{form.label || 'Studio'}</span>
              {!isMobile && (
                <div className="flex gap-4">
                  {['Home', 'About', 'Portfolio', 'Contact'].map(l => (
                    <span key={l} className="text-[10px] uppercase tracking-wider opacity-60">{l}</span>
                  ))}
                </div>
              )}
              {isMobile && <MenuIcon className="h-4 w-4 opacity-60" />}
            </nav>

            {/* Render sections in order */}
            {sections.map(section => {
              switch (section.id) {
                case 'hero':
                  return (
                    <section key="hero" className="relative" style={{ minHeight: isMobile ? 280 : 400 }}>
                      {dc.hero?.image_url ? (
                        <img src={dc.hero.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${form.card_bg}, ${form.bg_color})` }} />
                      )}
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="relative z-[1] flex flex-col items-center justify-center text-center" style={{ minHeight: isMobile ? 280 : 400, padding: '24px' }}>
                        <span className="uppercase tracking-[0.3em] mb-3" style={{ color: form.text_secondary_color, fontSize: isMobile ? 9 : 11 }}>
                          {dc.hero?.tagline || 'Photography'}
                        </span>
                        <h1 className="font-light leading-tight mb-4" style={{ fontFamily: form.font_family, color: '#fff', fontSize: isMobile ? 24 : 36 }}>
                          {dc.hero?.headline || 'Your Story'}
                        </h1>
                        <button className="uppercase tracking-wider border rounded-sm" style={{
                          borderColor: 'rgba(255,255,255,0.3)', color: '#fff',
                          padding: isMobile ? '6px 16px' : '8px 24px', fontSize: isMobile ? 9 : 10
                        }}>
                          {dc.hero?.button_text || 'View Portfolio'}
                        </button>
                      </div>
                    </section>
                  );

                case 'portfolio':
                  return (dc.portfolio?.demo_images || []).length > 0 ? (
                    <section key="portfolio" style={{ padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-5xl mx-auto">
                        <h2 className="text-center mb-6" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>Portfolio</h2>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                          {dc.portfolio!.demo_images!.map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full aspect-[3/4] object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'featured_stories':
                  return (dc.featured_stories || []).length > 0 ? (
                    <section key="featured" style={{ padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-5xl mx-auto">
                        <h2 className="text-center mb-6" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>Featured Stories</h2>
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(cols, (dc.featured_stories || []).length)}, 1fr)` }}>
                          {(dc.featured_stories || []).map((story, i) => (
                            <div key={i} className="relative overflow-hidden rounded aspect-[3/4]">
                              {story.image_url && <img src={story.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="font-light text-sm" style={{ color: '#fff', fontFamily: form.font_family }}>{story.title}</h3>
                                <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{story.location}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'gallery':
                  return (dc.gallery_images || []).length > 0 ? (
                    <section key="gallery" style={{ padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-5xl mx-auto">
                        <h2 className="text-center mb-6" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>Gallery</h2>
                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                          {(dc.gallery_images || []).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'about':
                  return dc.about?.bio ? (
                    <section key="about" style={{ padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className={`max-w-3xl mx-auto ${isMobile ? 'text-center' : 'flex gap-8 items-start'}`}>
                        {dc.about.profile_image_url && (
                          <div className={isMobile ? 'mx-auto mb-4' : 'w-40 shrink-0'}>
                            <img src={dc.about.profile_image_url} alt="" className="object-cover rounded-lg" style={{ width: isMobile ? 100 : 160, height: isMobile ? 130 : 200 }} />
                          </div>
                        )}
                        <div className="flex-1">
                          <h2 className="mb-3" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>About</h2>
                          <p className="leading-relaxed" style={{ color: form.text_secondary_color, fontSize: isMobile ? 12 : 14 }}>{dc.about.bio}</p>
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'services':
                  return (dc.services || []).length > 0 ? (
                    <section key="services" style={{ backgroundColor: form.card_bg, padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-3xl mx-auto">
                        <h2 className="text-center mb-4" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>Services</h2>
                        <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
                          {dc.services!.map((svc, i) => (
                            <div key={i} className="rounded-lg border" style={{ borderColor: form.nav_border, padding: '16px' }}>
                              <h3 className="font-semibold mb-1" style={{ fontSize: 14 }}>{svc.title}</h3>
                              <p style={{ color: form.text_secondary_color, fontSize: 11 }}>{svc.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'films':
                  return (dc.films || []).length > 0 ? (
                    <section key="films" style={{ padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-5xl mx-auto">
                        <h2 className="text-center mb-6" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>Films</h2>
                        <div className="grid gap-4" style={{ gridTemplateColumns: isMobile ? '1fr' : `repeat(${Math.min(cols, (dc.films || []).length)}, 1fr)` }}>
                          {(dc.films || []).map((film, i) => (
                            <div key={i} className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer">
                              {film.thumbnail_url ? (
                                <img src={film.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <div className="absolute inset-0" style={{ backgroundColor: form.card_bg }} />
                              )}
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                  <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-xs font-medium" style={{ color: '#fff' }}>{film.title}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'testimonials':
                  return (dc.testimonials || []).length > 0 ? (
                    <section key="testimonials" style={{ backgroundColor: form.card_bg, padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-3xl mx-auto text-center">
                        <h2 className="mb-6" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>What Clients Say</h2>
                        <div className="grid gap-4" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
                          {(dc.testimonials || []).map((t, i) => (
                            <div key={i} className="rounded-lg border p-5 text-left" style={{ borderColor: form.nav_border }}>
                              <p className="italic leading-relaxed mb-3" style={{ color: form.text_secondary_color, fontSize: 12 }}>"{t.text}"</p>
                              <p className="text-xs font-semibold">{t.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'instagram':
                  return (dc.social_images || []).length > 0 ? (
                    <section key="instagram" style={{ padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-3xl mx-auto text-center">
                        <h2 className="mb-2" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>Follow Along</h2>
                        <p className="text-xs mb-6" style={{ color: form.text_secondary_color }}>@studio</p>
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(isMobile ? 3 : 6, (dc.social_images || []).length)}, 1fr)` }}>
                          {(dc.social_images || []).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null;

                case 'contact':
                  return (
                    <section key="contact" style={{ backgroundColor: form.card_bg, padding: isMobile ? `${spacing} 16px` : `${spacing} 24px` }}>
                      <div className="max-w-md mx-auto text-center">
                        <h2 className="mb-4" style={{ fontFamily: form.font_family, fontSize: isMobile ? 18 : 22 }}>
                          {dc.contact?.heading || 'Get In Touch'}
                        </h2>
                        <div className="space-y-2">
                          {['Name', 'Email', 'Event Date', 'Message'].map(field => (
                            <div key={field} className="rounded border flex items-center px-3 opacity-40" style={{ borderColor: form.nav_border, height: field === 'Message' ? 64 : 32, fontSize: 10 }}>
                              {field}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-center mt-4">
                          <button className="uppercase tracking-wider rounded-sm" style={{
                            backgroundColor: form.text_color, color: form.bg_color,
                            padding: '8px 20px', fontSize: 10
                          }}>
                            {dc.contact?.button_text || 'Send Message'}
                          </button>
                          {dc.contact?.show_whatsapp && (
                            <button className="uppercase tracking-wider rounded-sm border" style={{
                              borderColor: form.nav_border, color: form.text_color,
                              padding: '8px 20px', fontSize: 10
                            }}>
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                    </section>
                  );

                case 'footer':
                  return (
                    <footer key="footer" style={{ backgroundColor: form.footer_bg, color: form.footer_text_color, padding: isMobile ? '16px' : '24px' }}>
                      <div className={`max-w-3xl mx-auto flex items-center ${isMobile ? 'flex-col gap-3 text-center' : 'justify-between'}`}>
                        <span className="text-[10px]">{dc.footer?.text || '© 2025 Studio'}</span>
                        {dc.footer?.show_social && (
                          <div className="flex gap-3">
                            <Instagram className="h-3.5 w-3.5 opacity-60" />
                            <Mail className="h-3.5 w-3.5 opacity-60" />
                            <Globe className="h-3.5 w-3.5 opacity-60" />
                          </div>
                        )}
                      </div>
                    </footer>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

/* ───────── Helper Components ───────── */

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold py-1.5 hover:text-foreground text-muted-foreground">
        <span>{title}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function DemoImageUploader({ label, value, onChange, folder, uploadFn }: {
  label: string; value: string | null; onChange: (url: string | null) => void; folder: string;
  uploadFn: (file: File, folder: string) => Promise<string | null>;
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFn(file, folder);
    if (url) onChange(url);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border w-40">
          <img src={value} alt="" className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-[10px]">{uploading ? '...' : 'Replace'}</span>
            </label>
            <button onClick={() => onChange(null)} className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-[10px]">Remove</button>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer block w-40">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 flex flex-col items-center justify-center gap-1 transition-colors">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
              <><Upload className="h-4 w-4 text-muted-foreground/40" /><span className="text-[9px] text-muted-foreground/40">Upload</span></>
            )}
          </div>
        </label>
      )}
    </div>
  );
}

function SingleImageField({ value, onChange, folder, uploadFn }: {
  value: string | null | undefined; onChange: (url: string | null) => void; folder: string;
  uploadFn: (file: File, folder: string) => Promise<string | null>;
}) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFn(file, folder);
    if (url) onChange(url);
    setUploading(false);
    e.target.value = '';
  };

  if (value) {
    return (
      <div className="relative group w-16 h-16 rounded overflow-hidden border border-border shrink-0">
        <img src={value} alt="" className="w-full h-full object-cover" />
        <label className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <Camera className="h-3 w-3 text-white" />
        </label>
      </div>
    );
  }

  return (
    <label className="cursor-pointer w-16 h-16 rounded border-2 border-dashed border-border hover:border-muted-foreground/30 flex items-center justify-center shrink-0">
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3 text-muted-foreground/40" />}
    </label>
  );
}

function MultiImageSection({ label, images, max, onChange, folder, uploadFn }: {
  label: string;
  images: string[];
  max: number;
  onChange: (urls: string[]) => void;
  folder: string;
  uploadFn: (file: File, folder: string) => Promise<string | null>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <span className="text-[10px] font-semibold text-muted-foreground">{images.length} / {max}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {images.map((url, i) => (
          <div key={i} className="relative group rounded overflow-hidden border border-border">
            <img src={url} alt="" className="w-full aspect-square object-cover" />
            <button
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <MultiImageUploadButton
            folder={folder}
            uploadFn={uploadFn}
            maxRemaining={max - images.length}
            onUploaded={urls => onChange([...images, ...urls])}
          />
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div className="bg-primary h-1 rounded-full transition-all" style={{ width: `${(images.length / max) * 100}%` }} />
      </div>
    </div>
  );
}

function MultiImageUploadButton({ folder, uploadFn, maxRemaining, onUploaded }: {
  folder: string;
  uploadFn: (file: File, folder: string) => Promise<string | null>;
  maxRemaining: number;
  onUploaded: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/')).slice(0, maxRemaining);
    if (files.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadFn(file, folder);
      if (url) urls.push(url);
      setProgress(p => ({ ...p, done: p.done + 1 }));
    }
    if (urls.length > 0) onUploaded(urls);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <label className="cursor-pointer">
      <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
      <div className="w-full aspect-square rounded border-2 border-dashed border-border hover:border-muted-foreground/30 flex flex-col items-center justify-center gap-0.5 transition-colors">
        {uploading ? (
          <div className="flex flex-col items-center gap-0.5">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-[8px] text-muted-foreground">{progress.done}/{progress.total}</span>
          </div>
        ) : (
          <><Plus className="h-4 w-4 text-muted-foreground/40" /><span className="text-[7px] text-muted-foreground/40">Add</span></>
        )}
      </div>
    </label>
  );
}
