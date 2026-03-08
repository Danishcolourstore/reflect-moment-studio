import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Upload, Save, ArrowLeft,
  Image as ImageIcon, X, Camera, Mail, Instagram, Globe, ChevronDown
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
import browserImageCompression from 'browser-image-compression';

/* ───────── Types ───────── */

interface DemoContent {
  hero?: { headline?: string; tagline?: string; button_text?: string; image_url?: string | null };
  portfolio?: { layout?: string; max_images?: number; demo_images?: string[] };
  about?: { bio?: string; profile_image_url?: string | null };
  services?: { title: string; description: string; icon: string }[];
  contact?: { heading?: string; button_text?: string };
  footer?: { text?: string; show_social?: boolean };
}

interface TemplateRow {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
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
  created_at: string;
  updated_at: string;
}

const EMPTY_TEMPLATE: Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'> = {
  slug: '', label: '', description: '', is_active: true, sort_order: 0,
  font_family: '"Cormorant Garamond", Georgia, serif',
  ui_font_family: '"DM Sans", sans-serif',
  bg_color: '#0C0A07', text_color: '#F2EDE4', text_secondary_color: '#A69E8F',
  nav_bg: 'rgba(12,10,7,0.75)', nav_border: 'rgba(242,237,228,0.06)',
  header_style: 'transparent', hero_style: 'vows',
  card_bg: '#161310', footer_bg: '#0C0A07', footer_text_color: '#7A7365',
  demo_content: {
    hero: { headline: 'Your Story', tagline: 'Photography', button_text: 'View Portfolio', image_url: null },
    portfolio: { layout: 'grid', max_images: 20, demo_images: [] },
    about: { bio: 'Award-winning photographer with a passion for capturing authentic moments.', profile_image_url: null },
    services: [],
    contact: { heading: 'Get In Touch', button_text: 'Send Message' },
    footer: { text: '© 2025 Studio Name', show_social: true },
  },
};

const MAX_PORTFOLIO_IMAGES = 20;

/* ───────── Main Component ───────── */

export default function SuperAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>>(EMPTY_TEMPLATE);

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
    setForm({ ...rest, demo_content: tmpl.demo_content || EMPTY_TEMPLATE.demo_content });
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
      await loadTemplates();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('website_templates').delete() as any).eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Template deleted'); loadTemplates();
  };

  const handleToggleActive = async (tmpl: TemplateRow) => {
    await (supabase.from('website_templates').update({ is_active: !tmpl.is_active } as any) as any).eq('id', tmpl.id);
    loadTemplates();
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

  /* ── Editor View (Split Layout) ── */
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-serif">Template Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage website templates and demo content</p>
        </div>
        <Button onClick={startCreate} className="gap-1.5"><Plus className="h-4 w-4" /> New Template</Button>
      </div>

      <div className="space-y-3">
        {templates.map(tmpl => (
          <Card key={tmpl.id} className={`transition-opacity ${!tmpl.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              {/* Template preview swatch */}
              <div className="w-16 h-12 rounded-lg border border-border shrink-0 overflow-hidden relative" style={{ backgroundColor: tmpl.bg_color }}>
                {tmpl.demo_content?.hero?.image_url ? (
                  <img src={tmpl.demo_content.hero.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: tmpl.text_color }}>
                  <span className="text-[9px] font-bold" style={{ fontFamily: tmpl.font_family }}>Aa</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{tmpl.label}</h3>
                  <Badge variant="outline" className="text-[9px] shrink-0">{tmpl.slug}</Badge>
                  {!tmpl.is_active && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{tmpl.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground/50">{(tmpl.demo_content?.portfolio?.demo_images || []).length} demo images</span>
                  <span className="text-[10px] text-muted-foreground/50">{(tmpl.demo_content?.services || []).length} services</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(tmpl)}>
                  {tmpl.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(tmpl)}>
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

      {/* Split: Config | Preview */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={38} minSize={28} maxSize={50}>
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="general" className="text-[10px]">General</TabsTrigger>
                  <TabsTrigger value="styling" className="text-[10px]">Styling</TabsTrigger>
                  <TabsTrigger value="demo" className="text-[10px]">Content</TabsTrigger>
                  <TabsTrigger value="images" className="text-[10px]">Images</TabsTrigger>
                </TabsList>

                {/* General */}
                <TabsContent value="general" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Slug</label>
                      <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} className="mt-1 h-8 text-xs" placeholder="my-template" disabled={!!editing} />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">Label</label>
                      <Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className="mt-1 h-8 text-xs" placeholder="My Template" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Description</label>
                    <Textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1 text-xs" rows={2} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg border border-border">
                    <span className="text-xs">Active</span>
                    <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Sort Order</label>
                    <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 w-20 h-8 text-xs" />
                  </div>
                </TabsContent>

                {/* Styling */}
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
                </TabsContent>

                {/* Demo Content */}
                <TabsContent value="demo" className="space-y-5">
                  <ContentSection title="🖼️ Hero">
                    <Input value={form.demo_content?.hero?.headline || ''} onChange={e => updateDemoContent('hero.headline', e.target.value)} placeholder="Headline" className="h-8 text-xs" />
                    <Input value={form.demo_content?.hero?.tagline || ''} onChange={e => updateDemoContent('hero.tagline', e.target.value)} placeholder="Tagline" className="h-8 text-xs" />
                    <Input value={form.demo_content?.hero?.button_text || ''} onChange={e => updateDemoContent('hero.button_text', e.target.value)} placeholder="Button Text" className="h-8 text-xs" />
                  </ContentSection>

                  <ContentSection title="👤 About">
                    <Textarea value={form.demo_content?.about?.bio || ''} onChange={e => updateDemoContent('about.bio', e.target.value)} placeholder="Bio text" rows={3} className="text-xs" />
                  </ContentSection>

                  <ContentSection title="💼 Services">
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

                  <ContentSection title="✉️ Contact">
                    <Input value={form.demo_content?.contact?.heading || ''} onChange={e => updateDemoContent('contact.heading', e.target.value)} placeholder="Contact Heading" className="h-8 text-xs" />
                    <Input value={form.demo_content?.contact?.button_text || ''} onChange={e => updateDemoContent('contact.button_text', e.target.value)} placeholder="Button Text" className="h-8 text-xs" />
                  </ContentSection>

                  <ContentSection title="🔻 Footer">
                    <Input value={form.demo_content?.footer?.text || ''} onChange={e => updateDemoContent('footer.text', e.target.value)} placeholder="Footer text" className="h-8 text-xs" />
                    <div className="flex items-center gap-2">
                      <Switch checked={form.demo_content?.footer?.show_social ?? true} onCheckedChange={v => updateDemoContent('footer.show_social', v)} />
                      <span className="text-[10px] text-muted-foreground">Show social icons</span>
                    </div>
                  </ContentSection>

                  <ContentSection title="📷 Portfolio Defaults">
                    <Select value={form.demo_content?.portfolio?.layout || 'grid'} onValueChange={v => updateDemoContent('portfolio.layout', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                        <SelectItem value="large">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </ContentSection>
                </TabsContent>

                {/* Demo Images */}
                <TabsContent value="images" className="space-y-5">
                  <DemoImageUploader
                    label="Hero Demo Image"
                    value={form.demo_content?.hero?.image_url || null}
                    onChange={url => updateDemoContent('hero.image_url', url)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />
                  <DemoImageUploader
                    label="About Profile Image"
                    value={form.demo_content?.about?.profile_image_url || null}
                    onChange={url => updateDemoContent('about.profile_image_url', url)}
                    folder={form.slug || 'new'}
                    uploadFn={uploadDemoImage}
                  />

                  {/* Portfolio Multi-Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Portfolio Demo Images</label>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {(form.demo_content?.portfolio?.demo_images || []).length} / {MAX_PORTFOLIO_IMAGES}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(form.demo_content?.portfolio?.demo_images || []).map((url, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                          <img src={url} alt="" className="w-full aspect-square object-cover" />
                          <button
                            onClick={() => {
                              updateDemoContent('portfolio.demo_images', (form.demo_content?.portfolio?.demo_images || []).filter((_, idx) => idx !== i));
                            }}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {(form.demo_content?.portfolio?.demo_images || []).length < MAX_PORTFOLIO_IMAGES && (
                        <MultiImageUploadButton
                          folder={form.slug || 'new'}
                          uploadFn={uploadDemoImage}
                          maxRemaining={MAX_PORTFOLIO_IMAGES - (form.demo_content?.portfolio?.demo_images || []).length}
                          onUploaded={urls => {
                            const current = form.demo_content?.portfolio?.demo_images || [];
                            updateDemoContent('portfolio.demo_images', [...current, ...urls]);
                          }}
                        />
                      )}
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${((form.demo_content?.portfolio?.demo_images || []).length / MAX_PORTFOLIO_IMAGES) * 100}%` }}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Live Preview */}
        <ResizablePanel defaultSize={62}>
          <ScrollArea className="h-full">
            <TemplatePreview form={form} updateDemoContent={updateDemoContent} uploadDemoImage={uploadDemoImage} />
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* ───────── Live Preview ───────── */

function TemplatePreview({
  form,
  updateDemoContent,
  uploadDemoImage,
}: {
  form: Omit<TemplateRow, 'id' | 'created_at' | 'updated_at'>;
  updateDemoContent: (path: string, value: any) => void;
  uploadDemoImage: (file: File, folder: string) => Promise<string | null>;
}) {
  const dc = form.demo_content || {};
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const aboutImageInputRef = useRef<HTMLInputElement>(null);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadDemoImage(file, form.slug || 'new');
    if (url) updateDemoContent('hero.image_url', url);
    e.target.value = '';
  };

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadDemoImage(file, form.slug || 'new');
    if (url) updateDemoContent('about.profile_image_url', url);
    e.target.value = '';
  };

  return (
    <div style={{ backgroundColor: form.bg_color, color: form.text_color, fontFamily: form.ui_font_family }} className="min-h-full">
      <input ref={heroImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
      <input ref={aboutImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleAboutImageUpload} />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between" style={{ background: form.nav_bg, borderBottom: `1px solid ${form.nav_border}` }}>
        <span className="text-sm font-semibold" style={{ fontFamily: form.font_family }}>{form.label || 'Studio'}</span>
        <div className="flex gap-4">
          {['Home', 'About', 'Portfolio', 'Contact'].map(l => (
            <span key={l} className="text-[10px] uppercase tracking-wider opacity-60">{l}</span>
          ))}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative" style={{ minHeight: 360 }}>
        {dc.hero?.image_url ? (
          <img src={dc.hero.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${form.card_bg}, ${form.bg_color})` }} />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-[1] flex flex-col items-center justify-center text-center px-6" style={{ minHeight: 360 }}>
          <EditableText
            value={dc.hero?.tagline || 'Photography'}
            onChange={v => updateDemoContent('hero.tagline', v)}
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: form.text_secondary_color }}
          />
          <EditableText
            value={dc.hero?.headline || 'Your Story'}
            onChange={v => updateDemoContent('hero.headline', v)}
            className="text-3xl font-light leading-tight mb-4"
            style={{ fontFamily: form.font_family, color: '#fff' }}
            tag="h1"
          />
          <button
            className="px-5 py-2 text-[10px] uppercase tracking-wider border rounded-sm mt-2"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
          >
            {dc.hero?.button_text || 'View Portfolio'}
          </button>
          {/* Click to upload hero image */}
          <button
            onClick={() => heroImageInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-[9px] hover:bg-black/80 transition-colors"
          >
            <Camera className="h-3 w-3" /> {dc.hero?.image_url ? 'Replace Hero' : 'Upload Hero'}
          </button>
        </div>
      </section>

      {/* ── About Section ── */}
      {dc.about?.bio && (
        <section className="px-6 py-12">
          <div className="max-w-3xl mx-auto flex gap-8 items-start">
            <div className="w-32 shrink-0">
              {dc.about.profile_image_url ? (
                <div className="relative group">
                  <img src={dc.about.profile_image_url} alt="" className="w-32 h-40 object-cover rounded-lg" />
                  <button
                    onClick={() => aboutImageInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors rounded-lg opacity-0 group-hover:opacity-100"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => aboutImageInputRef.current?.click()}
                  className="w-32 h-40 rounded-lg border-2 border-dashed flex items-center justify-center"
                  style={{ borderColor: form.text_secondary_color + '40' }}
                >
                  <Camera className="h-5 w-5" style={{ color: form.text_secondary_color }} />
                </button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg mb-3" style={{ fontFamily: form.font_family }}>About</h2>
              <EditableText
                value={dc.about.bio}
                onChange={v => updateDemoContent('about.bio', v)}
                className="text-sm leading-relaxed"
                style={{ color: form.text_secondary_color }}
                multiline
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Services ── */}
      {(dc.services || []).length > 0 && (
        <section className="px-6 py-10" style={{ backgroundColor: form.card_bg }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg text-center mb-6" style={{ fontFamily: form.font_family }}>Services</h2>
            <div className="grid grid-cols-2 gap-4">
              {dc.services!.map((svc, i) => (
                <div key={i} className="p-4 rounded-lg border" style={{ borderColor: form.nav_border }}>
                  <h3 className="text-sm font-semibold mb-1">{svc.title}</h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: form.text_secondary_color }}>{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Portfolio Grid ── */}
      {(dc.portfolio?.demo_images || []).length > 0 && (
        <section className="px-6 py-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg text-center mb-6" style={{ fontFamily: form.font_family }}>Portfolio</h2>
            <div className="grid grid-cols-3 gap-2">
              {dc.portfolio!.demo_images!.map((url, i) => (
                <img key={i} src={url} alt="" className="w-full aspect-square object-cover rounded" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contact ── */}
      <section className="px-6 py-10" style={{ backgroundColor: form.card_bg }}>
        <div className="max-w-md mx-auto text-center">
          <EditableText
            value={dc.contact?.heading || 'Get In Touch'}
            onChange={v => updateDemoContent('contact.heading', v)}
            className="text-lg mb-4"
            style={{ fontFamily: form.font_family }}
            tag="h2"
          />
          <div className="space-y-2">
            <div className="h-8 rounded border text-[10px] flex items-center px-3 opacity-40" style={{ borderColor: form.nav_border }}>Name</div>
            <div className="h-8 rounded border text-[10px] flex items-center px-3 opacity-40" style={{ borderColor: form.nav_border }}>Email</div>
            <div className="h-16 rounded border text-[10px] flex items-start p-3 opacity-40" style={{ borderColor: form.nav_border }}>Message</div>
          </div>
          <button className="mt-4 px-5 py-2 text-[10px] uppercase tracking-wider rounded-sm" style={{ backgroundColor: form.text_color, color: form.bg_color }}>
            {dc.contact?.button_text || 'Send Message'}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-6" style={{ backgroundColor: form.footer_bg, color: form.footer_text_color }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <EditableText
            value={dc.footer?.text || '© 2025 Studio'}
            onChange={v => updateDemoContent('footer.text', v)}
            className="text-[10px]"
          />
          {dc.footer?.show_social && (
            <div className="flex gap-3">
              <Instagram className="h-3.5 w-3.5 opacity-60" />
              <Mail className="h-3.5 w-3.5 opacity-60" />
              <Globe className="h-3.5 w-3.5 opacity-60" />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ───────── Inline Editable Text ───────── */

function EditableText({
  value, onChange, className, style, tag, multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'h1' | 'h2' | 'p';
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  if (editing) {
    const common = {
      ref: ref as any,
      value: draft,
      onChange: (e: any) => setDraft(e.target.value),
      onBlur: () => { onChange(draft); setEditing(false); },
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !multiline) { onChange(draft); setEditing(false); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } },
      className: `bg-transparent border border-primary/40 rounded px-1 outline-none w-full ${className}`,
      style,
    };
    return multiline
      ? <textarea {...common} rows={4} />
      : <input {...common} />;
  }

  const Tag = tag || 'span';
  return (
    <Tag
      className={`cursor-text hover:ring-1 hover:ring-primary/30 rounded px-0.5 transition-all ${className}`}
      style={style}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || 'Click to edit...'}
    </Tag>
  );
}

/* ───────── Helper Components ───────── */

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold flex items-center gap-1.5">{title}</h3>
      {children}
    </div>
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
      <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 flex flex-col items-center justify-center gap-1 transition-colors">
        {uploading ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-[9px] text-muted-foreground">{progress.done}/{progress.total}</span>
          </div>
        ) : (
          <><Plus className="h-5 w-5 text-muted-foreground/40" /><span className="text-[8px] text-muted-foreground/40">Add Multiple</span></>
        )}
      </div>
    </label>
  );
}
