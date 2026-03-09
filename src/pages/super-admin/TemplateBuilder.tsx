import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LayoutTemplate,
  Camera,
  Users,
  Briefcase,
  MessageSquare,
  Mail,
  Instagram,
  Video,
  GripVertical,
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Settings2,
  Copy,
  Globe,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SECTION_LIBRARY = [
  { type: 'hero', label: 'Hero Section', icon: LayoutTemplate, tone: 'text-primary' },
  { type: 'gallery', label: 'Gallery Section', icon: Camera, tone: 'text-accent-foreground' },
  { type: 'about', label: 'About Section', icon: Users, tone: 'text-foreground' },
  { type: 'services', label: 'Services Section', icon: Briefcase, tone: 'text-muted-foreground' },
  { type: 'testimonials', label: 'Testimonials Section', icon: MessageSquare, tone: 'text-foreground' },
  { type: 'contact', label: 'Contact Section', icon: Mail, tone: 'text-accent-foreground' },
  { type: 'instagram', label: 'Instagram Feed Section', icon: Instagram, tone: 'text-primary' },
  { type: 'video', label: 'Video Section', icon: Video, tone: 'text-foreground' },
] as const;

type SectionType = (typeof SECTION_LIBRARY)[number]['type'];

interface TemplateSectionSettings {
  hero_background_image?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_button_text?: string;

  gallery_layout?: 'masonry' | 'grid' | 'carousel';
  gallery_columns?: number;
  gallery_image_style?: 'cover' | 'contain';

  about_profile_image?: string;
  about_bio_text?: string;
  about_social_links?: { platform: string; url: string }[];

  contact_heading?: string;
  contact_email?: string;
  contact_phone?: string;

  instagram_username?: string;
  video_url?: string;
  video_thumbnail?: string;
}

interface TemplateSection {
  id: string;
  type: SectionType;
  settings: TemplateSectionSettings;
}

const CATEGORIES = ['Wedding', 'Portrait', 'Studio', 'Fashion', 'Commercial', 'Editorial', 'Lifestyle'];

export default function TemplateBuilder() {
  const { user } = useAuth();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [templateCategory, setTemplateCategory] = useState('Wedding');
  const [published, setPublished] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? null,
    [sections, selectedSectionId]
  );

  const getMeta = (type: SectionType) => SECTION_LIBRARY.find((item) => item.type === type);

  const addSection = (type: SectionType) => {
    const next: TemplateSection = { id: crypto.randomUUID(), type, settings: {} };
    setSections((prev) => [...prev, next]);
    setSelectedSectionId(next.id);
    toast.success(`${getMeta(type)?.label ?? 'Section'} added`);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const duplicateSection = (id: string) => {
    const source = sections.find((section) => section.id === id);
    if (!source) return;
    const duplicate: TemplateSection = {
      ...source,
      id: crypto.randomUUID(),
      settings: { ...source.settings },
    };
    const sourceIndex = sections.findIndex((section) => section.id === id);
    setSections((prev) => {
      const next = [...prev];
      next.splice(sourceIndex + 1, 0, duplicate);
      return next;
    });
    toast.success('Section duplicated');
  };

  const updateSelectedSettings = (key: keyof TemplateSectionSettings, value: unknown) => {
    if (!selectedSection) return;
    setSections((prev) =>
      prev.map((section) =>
        section.id === selectedSection.id
          ? { ...section, settings: { ...section.settings, [key]: value } }
          : section
      )
    );
  };

  const persistTemplate = async (nextPublished = published) => {
    if (!user) return false;
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return false;
    }

    setSaving(true);
    const payload = {
      name: templateName.trim(),
      category: templateCategory,
      sections,
      created_by: user.id,
      published: nextPublished,
    };

    try {
      if (templateId) {
        const { error } = await (supabase.from('templates' as any) as any).update(payload).eq('id', templateId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase.from('templates' as any) as any)
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setTemplateId(data.id);
      }

      setPublished(nextPublished);
      toast.success('Template saved');
      return true;
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to save template');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    await persistTemplate(published);
  };

  const onPublish = async () => {
    const next = !published;
    const success = await persistTemplate(next);
    if (success) toast.success(next ? 'Template published' : 'Template unpublished');
  };

  const onDragStart = (index: number) => setDraggedIndex(index);

  const onDragOver = (event: React.DragEvent, overIndex: number) => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;

    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });

    setDraggedIndex(overIndex);
  };

  const renderSectionPreview = (section: TemplateSection) => {
    const meta = getMeta(section.type);
    if (!meta) return null;

    return (
      <Card
        className={cn(
          'p-6 border-2 transition-all cursor-pointer',
          selectedSectionId === section.id
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30 hover:bg-muted/30'
        )}
        onClick={() => setSelectedSectionId(section.id)}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <meta.icon className={cn('h-5 w-5', meta.tone)} />
          <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
        </div>

        {section.type === 'hero' && (
          <div className="rounded-md border border-border bg-card p-4">
            <div className="h-24 rounded bg-muted mb-3" />
            <p className="text-sm font-medium text-foreground">{section.settings.hero_title || 'Studio Name'}</p>
            <p className="text-xs text-muted-foreground mt-1">{section.settings.hero_subtitle || 'Tagline goes here'}</p>
            <div className="mt-3 inline-flex rounded px-3 py-1 text-xs bg-primary text-primary-foreground">
              {section.settings.hero_button_text || 'Book Now'}
            </div>
          </div>
        )}

        {section.type === 'gallery' && (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="aspect-square rounded bg-muted" />
            ))}
          </div>
        )}

        {section.type === 'about' && (
          <div className="flex items-start gap-3">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-3/4 rounded bg-muted" />
              <div className="h-2.5 w-full rounded bg-muted" />
              <div className="h-2.5 w-2/3 rounded bg-muted" />
            </div>
          </div>
        )}

        {!['hero', 'gallery', 'about'].includes(section.type) && (
          <div className="rounded-md border border-border bg-card px-3 py-4 text-xs text-muted-foreground">Section placeholder layout</div>
        )}
      </Card>
    );
  };

  const settingsPanel = () => {
    if (!selectedSection) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
          <Settings2 className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Select a section to edit settings.</p>
        </div>
      );
    }

    const meta = getMeta(selectedSection.type);
    if (!meta) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <meta.icon className={cn('h-4 w-4', meta.tone)} />
          <p className="text-sm font-semibold text-foreground">{meta.label} Settings</p>
        </div>

        {selectedSection.type === 'hero' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Background Image</Label>
              <Input
                className="mt-1.5"
                value={selectedSection.settings.hero_background_image || ''}
                onChange={(event) => updateSelectedSettings('hero_background_image', event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                className="mt-1.5"
                value={selectedSection.settings.hero_title || ''}
                onChange={(event) => updateSelectedSettings('hero_title', event.target.value)}
                placeholder="Studio Name"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Subtitle</Label>
              <Input
                className="mt-1.5"
                value={selectedSection.settings.hero_subtitle || ''}
                onChange={(event) => updateSelectedSettings('hero_subtitle', event.target.value)}
                placeholder="Capturing timeless moments"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Button Text</Label>
              <Input
                className="mt-1.5"
                value={selectedSection.settings.hero_button_text || ''}
                onChange={(event) => updateSelectedSettings('hero_button_text', event.target.value)}
                placeholder="View Portfolio"
              />
            </div>
          </>
        )}

        {selectedSection.type === 'gallery' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Layout Type</Label>
              <Select
                value={selectedSection.settings.gallery_layout || 'masonry'}
                onValueChange={(value) => updateSelectedSettings('gallery_layout', value)}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Grid Columns</Label>
              <Select
                value={String(selectedSection.settings.gallery_columns || 3)}
                onValueChange={(value) => updateSelectedSettings('gallery_columns', Number(value))}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Image Style</Label>
              <Select
                value={selectedSection.settings.gallery_image_style || 'cover'}
                onValueChange={(value) => updateSelectedSettings('gallery_image_style', value)}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {selectedSection.type === 'about' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">Profile Image</Label>
              <Input
                className="mt-1.5"
                value={selectedSection.settings.about_profile_image || ''}
                onChange={(event) => updateSelectedSettings('about_profile_image', event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Bio Text</Label>
              <Textarea
                className="mt-1.5"
                rows={5}
                value={selectedSection.settings.about_bio_text || ''}
                onChange={(event) => updateSelectedSettings('about_bio_text', event.target.value)}
                placeholder="Write a short studio bio"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Social Links (one URL per line)</Label>
              <Textarea
                className="mt-1.5"
                rows={4}
                value={(selectedSection.settings.about_social_links || []).map((item) => item.url).join('\n')}
                onChange={(event) =>
                  updateSelectedSettings(
                    'about_social_links',
                    event.target.value
                      .split('\n')
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .map((url) => ({ platform: 'social', url }))
                  )
                }
                placeholder="https://instagram.com/yourstudio"
              />
            </div>
          </>
        )}

        {!['hero', 'gallery', 'about'].includes(selectedSection.type) && (
          <p className="text-sm text-muted-foreground">Settings for this section can be added as needed.</p>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border bg-card/50 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            className="h-8 w-64"
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            placeholder="Template Name"
          />
          <Select value={templateCategory} onValueChange={setTemplateCategory}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={published ? 'default' : 'secondary'}>{published ? 'Published' : 'Draft'}</Badge>
          <Button variant="outline" size="sm" onClick={() => setPreviewMode((prev) => !prev)}>
            <Eye className="h-4 w-4 mr-1.5" />
            {previewMode ? 'Exit Preview' : 'Preview Template'}
          </Button>
          <Button variant="outline" size="sm" onClick={onPublish} disabled={saving}>
            <Globe className="h-4 w-4 mr-1.5" />
            Publish Template
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Template
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!previewMode && (
          <aside className="w-64 border-r border-border bg-card/30">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section Library</h3>
                {SECTION_LIBRARY.map((section) => (
                  <Button
                    key={section.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-auto py-2.5"
                    onClick={() => addSection(section.type)}
                  >
                    <section.icon className={cn('h-4 w-4 mr-2', section.tone)} />
                    <span className="truncate">{section.label}</span>
                    <Plus className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        <main className="flex-1 overflow-auto bg-muted/20">
          <ScrollArea className="h-full">
            <div className="p-8 max-w-5xl mx-auto">
              {sections.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <LayoutTemplate className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Add sections from the left panel to start building this template.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => {
                    const meta = getMeta(section.type);
                    if (!meta) return null;

                    return (
                      <div
                        key={section.id}
                        draggable={!previewMode}
                        onDragStart={() => onDragStart(index)}
                        onDragOver={(event) => onDragOver(event, index)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={cn('relative group', draggedIndex === index && 'opacity-60')}
                      >
                        {!previewMode && (
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => duplicateSection(section.id)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="secondary" size="sm" className="h-7 w-7 p-0" onClick={() => removeSection(section.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                            <div className="h-7 w-7 rounded bg-secondary flex items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing">
                              <GripVertical className="h-4 w-4" />
                            </div>
                          </div>
                        )}

                        {renderSectionPreview(section)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        {!previewMode && (
          <aside className="w-80 border-l border-border bg-card/30">
            <ScrollArea className="h-full">
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Section Settings</h3>
                {settingsPanel()}
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
}
