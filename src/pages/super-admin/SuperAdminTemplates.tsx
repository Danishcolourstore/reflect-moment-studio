import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Upload, Save, ArrowLeft, GripVertical, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import browserImageCompression from 'browser-image-compression';

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
  slug: '',
  label: '',
  description: '',
  is_active: true,
  sort_order: 0,
  font_family: '"Cormorant Garamond", Georgia, serif',
  ui_font_family: '"DM Sans", sans-serif',
  bg_color: '#0C0A07',
  text_color: '#F2EDE4',
  text_secondary_color: '#A69E8F',
  nav_bg: 'rgba(12,10,7,0.75)',
  nav_border: 'rgba(242,237,228,0.06)',
  header_style: 'transparent',
  hero_style: 'vows',
  card_bg: '#161310',
  footer_bg: '#0C0A07',
  footer_text_color: '#7A7365',
  demo_content: {
    hero: { headline: 'Your Story', tagline: 'Photography', button_text: 'View Portfolio', image_url: null },
    portfolio: { layout: 'grid', max_images: 20, demo_images: [] },
    about: { bio: '', profile_image_url: null },
    services: [],
    contact: { heading: 'Get In Touch', button_text: 'Send Message' },
    footer: { text: '© 2025 Studio Name', show_social: true },
  },
};

export default function SuperAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
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
    setCreating(true);
    setEditing(null);
  };

  const startEdit = (tmpl: TemplateRow) => {
    setForm({
      slug: tmpl.slug,
      label: tmpl.label,
      description: tmpl.description || '',
      is_active: tmpl.is_active,
      sort_order: tmpl.sort_order,
      font_family: tmpl.font_family,
      ui_font_family: tmpl.ui_font_family,
      bg_color: tmpl.bg_color,
      text_color: tmpl.text_color,
      text_secondary_color: tmpl.text_secondary_color,
      nav_bg: tmpl.nav_bg,
      nav_border: tmpl.nav_border,
      header_style: tmpl.header_style,
      hero_style: tmpl.hero_style,
      card_bg: tmpl.card_bg,
      footer_bg: tmpl.footer_bg,
      footer_text_color: tmpl.footer_text_color,
      demo_content: tmpl.demo_content || EMPTY_TEMPLATE.demo_content,
    });
    setEditing(tmpl);
    setCreating(false);
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
      setEditing(null);
      setCreating(false);
      await loadTemplates();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('website_templates').delete() as any).eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Template deleted');
    loadTemplates();
  };

  const handleToggleActive = async (tmpl: TemplateRow) => {
    await (supabase.from('website_templates').update({ is_active: !tmpl.is_active } as any) as any).eq('id', tmpl.id);
    loadTemplates();
  };

  // Demo image upload helper
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
      const dc = { ...prev.demo_content } as any;
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Editor View ──
  if (editing || creating) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={cancelEdit} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Templates
          </button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {creating ? 'Create Template' : 'Save Changes'}
          </Button>
        </div>

        <h1 className="text-xl font-bold font-serif">{creating ? 'New Template' : `Edit: ${editing?.label}`}</h1>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="styling" className="text-xs">Styling</TabsTrigger>
            <TabsTrigger value="demo" className="text-xs">Demo Content</TabsTrigger>
            <TabsTrigger value="images" className="text-xs">Demo Images</TabsTrigger>
          </TabsList>

          {/* ── General Tab ── */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Template Slug</label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} className="mt-1" placeholder="my-template" disabled={!!editing} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Display Label</label>
                <Input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} className="mt-1" placeholder="My Template" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={2} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <span className="text-sm">Active</span>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 w-24" />
            </div>
          </TabsContent>

          {/* ── Styling Tab ── */}
          <TabsContent value="styling" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Heading Font</label>
                <Input value={form.font_family} onChange={e => setForm(p => ({ ...p, font_family: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">UI Font</label>
                <Input value={form.ui_font_family} onChange={e => setForm(p => ({ ...p, ui_font_family: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {([
                ['bg_color', 'Background'],
                ['text_color', 'Text'],
                ['text_secondary_color', 'Text Secondary'],
                ['card_bg', 'Card BG'],
                ['footer_bg', 'Footer BG'],
                ['footer_text_color', 'Footer Text'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input type="color" value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="h-8 w-8 rounded border border-border cursor-pointer" />
                    <Input value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="h-8 text-xs flex-1" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nav BG</label>
                <Input value={form.nav_bg} onChange={e => setForm(p => ({ ...p, nav_bg: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nav Border</label>
                <Input value={form.nav_border} onChange={e => setForm(p => ({ ...p, nav_border: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Header Style</label>
                <Select value={form.header_style} onValueChange={v => setForm(p => ({ ...p, header_style: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">Transparent</SelectItem>
                    <SelectItem value="solid">Solid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Hero Style</label>
                <Select value={form.hero_style} onValueChange={v => setForm(p => ({ ...p, hero_style: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vows">Vows (Full Bleed)</SelectItem>
                    <SelectItem value="editorial">Editorial (Split)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* ── Demo Content Tab ── */}
          <TabsContent value="demo" className="space-y-6">
            {/* Hero */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">🖼️ Hero Section</h3>
              <Input value={form.demo_content?.hero?.headline || ''} onChange={e => updateDemoContent('hero.headline', e.target.value)} placeholder="Demo Headline" />
              <Input value={form.demo_content?.hero?.tagline || ''} onChange={e => updateDemoContent('hero.tagline', e.target.value)} placeholder="Demo Tagline" />
              <Input value={form.demo_content?.hero?.button_text || ''} onChange={e => updateDemoContent('hero.button_text', e.target.value)} placeholder="Button Text" />
            </div>

            {/* About */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">👤 About Section</h3>
              <Textarea value={form.demo_content?.about?.bio || ''} onChange={e => updateDemoContent('about.bio', e.target.value)} placeholder="Demo biography text" rows={3} />
            </div>

            {/* Services */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">💼 Services</h3>
              {(form.demo_content?.services || []).map((svc, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                  <Input value={svc.title} onChange={e => {
                    const svcs = [...(form.demo_content?.services || [])];
                    svcs[i] = { ...svcs[i], title: e.target.value };
                    updateDemoContent('services', svcs);
                  }} className="flex-1 h-8 text-xs" placeholder="Service title" />
                  <Input value={svc.description} onChange={e => {
                    const svcs = [...(form.demo_content?.services || [])];
                    svcs[i] = { ...svcs[i], description: e.target.value };
                    updateDemoContent('services', svcs);
                  }} className="flex-1 h-8 text-xs" placeholder="Description" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => {
                    const svcs = (form.demo_content?.services || []).filter((_, idx) => idx !== i);
                    updateDemoContent('services', svcs);
                  }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                const svcs = [...(form.demo_content?.services || []), { title: 'New Service', description: '', icon: 'camera' }];
                updateDemoContent('services', svcs);
              }}><Plus className="h-3 w-3 mr-1" /> Add Service</Button>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">✉️ Contact Section</h3>
              <Input value={form.demo_content?.contact?.heading || ''} onChange={e => updateDemoContent('contact.heading', e.target.value)} placeholder="Contact Heading" />
              <Input value={form.demo_content?.contact?.button_text || ''} onChange={e => updateDemoContent('contact.button_text', e.target.value)} placeholder="Button Text" />
            </div>

            {/* Footer */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">🔻 Footer</h3>
              <Input value={form.demo_content?.footer?.text || ''} onChange={e => updateDemoContent('footer.text', e.target.value)} placeholder="Footer text" />
              <div className="flex items-center gap-2">
                <Switch checked={form.demo_content?.footer?.show_social ?? true} onCheckedChange={v => updateDemoContent('footer.show_social', v)} />
                <span className="text-xs text-muted-foreground">Show social icons</span>
              </div>
            </div>

            {/* Portfolio layout */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">📷 Portfolio Defaults</h3>
              <Select value={form.demo_content?.portfolio?.layout || 'grid'} onValueChange={v => updateDemoContent('portfolio.layout', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="large">Full Width</SelectItem>
                </SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Max Portfolio Images</label>
                <Input type="number" value={form.demo_content?.portfolio?.max_images || 20} onChange={e => updateDemoContent('portfolio.max_images', parseInt(e.target.value) || 20)} className="mt-1 w-24" />
              </div>
            </div>
          </TabsContent>

          {/* ── Demo Images Tab ── */}
          <TabsContent value="images" className="space-y-6">
            {/* Hero Image */}
            <DemoImageUploader
              label="Hero Demo Image"
              value={form.demo_content?.hero?.image_url || null}
              onChange={url => updateDemoContent('hero.image_url', url)}
              folder={form.slug || 'new'}
              uploadFn={uploadDemoImage}
            />

            {/* About Profile Image */}
            <DemoImageUploader
              label="About Profile Image"
              value={form.demo_content?.about?.profile_image_url || null}
              onChange={url => updateDemoContent('about.profile_image_url', url)}
              folder={form.slug || 'new'}
              uploadFn={uploadDemoImage}
            />

            {/* Portfolio Demo Images */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Portfolio Demo Images</label>
              <div className="grid grid-cols-3 gap-2">
                {(form.demo_content?.portfolio?.demo_images || []).map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full aspect-square object-cover" />
                    <button
                      onClick={() => {
                        const imgs = (form.demo_content?.portfolio?.demo_images || []).filter((_, idx) => idx !== i);
                        updateDemoContent('portfolio.demo_images', imgs);
                      }}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <DemoImageAddButton
                  folder={form.slug || 'new'}
                  uploadFn={uploadDemoImage}
                  onUploaded={url => {
                    const imgs = [...(form.demo_content?.portfolio?.demo_images || []), url];
                    updateDemoContent('portfolio.demo_images', imgs);
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/40">{(form.demo_content?.portfolio?.demo_images || []).length} demo portfolio images</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ── Template List View ──
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-serif">Template Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage website templates and demo content for photographers</p>
        </div>
        <Button onClick={startCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <div className="space-y-3">
        {templates.map(tmpl => (
          <Card key={tmpl.id} className={`transition-opacity ${!tmpl.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              {/* Color preview */}
              <div className="w-12 h-12 rounded-lg border border-border shrink-0 overflow-hidden" style={{ backgroundColor: tmpl.bg_color }}>
                <div className="w-full h-full flex items-center justify-center" style={{ color: tmpl.text_color }}>
                  <span className="text-[10px] font-bold" style={{ fontFamily: tmpl.font_family }}>Aa</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{tmpl.label}</h3>
                  <Badge variant="outline" className="text-[9px] shrink-0">{tmpl.slug}</Badge>
                  {!tmpl.is_active && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{tmpl.description}</p>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{tmpl.label}". Photographers using this template will fall back to the default.
                      </AlertDialogDescription>
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

// ── Helper Components ──

function DemoImageUploader({ label, value, onChange, folder, uploadFn }: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
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
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border w-48">
          <img src={value} alt="" className="w-full aspect-video object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-[10px]">
                {uploading ? 'Uploading...' : 'Replace'}
              </span>
            </label>
            <button onClick={() => onChange(null)} className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-[10px]">Remove</button>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer block w-48">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 flex flex-col items-center justify-center gap-1 transition-colors">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-[9px] text-muted-foreground/40">Upload image</span>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
}

function DemoImageAddButton({ folder, uploadFn, onUploaded }: {
  folder: string;
  uploadFn: (file: File, folder: string) => Promise<string | null>;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const url = await uploadFn(file, folder);
      if (url) onUploaded(url);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <label className="cursor-pointer">
      <input type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
      <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border hover:border-muted-foreground/30 flex flex-col items-center justify-center gap-1 transition-colors">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
          <>
            <Plus className="h-5 w-5 text-muted-foreground/40" />
            <span className="text-[8px] text-muted-foreground/40">Add Images</span>
          </>
        )}
      </div>
    </label>
  );
}
