import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  LayoutTemplate, Image, Users, Briefcase, MessageSquare, Mail,
  Instagram, Video, GripVertical, Trash2, Plus, Save, Eye, ArrowLeft,
  Settings2, Copy, Globe, Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────────────
   SECTION LIBRARY
─────────────────────────────────────────────────────────────────────── */

const SECTION_LIBRARY = [
  { type: 'hero', label: 'Hero Section', icon: LayoutTemplate, color: 'text-amber-500' },
  { type: 'gallery', label: 'Gallery Section', icon: Camera, color: 'text-rose-500' },
  { type: 'about', label: 'About Section', icon: Users, color: 'text-blue-500' },
  { type: 'services', label: 'Services Section', icon: Briefcase, color: 'text-emerald-500' },
  { type: 'testimonials', label: 'Testimonials Section', icon: MessageSquare, color: 'text-violet-500' },
  { type: 'contact', label: 'Contact Section', icon: Mail, color: 'text-orange-500' },
  { type: 'instagram', label: 'Instagram Feed', icon: Instagram, color: 'text-pink-500' },
  { type: 'video', label: 'Video Section', icon: Video, color: 'text-cyan-500' },
] as const;

type SectionType = typeof SECTION_LIBRARY[number]['type'];

/* ─────────────────────────────────────────────────────────────────────
   TYPES
─────────────────────────────────────────────────────────────────────── */

interface TemplateSectionSettings {
  // Hero
  hero_background_image?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_button_text?: string;

  // Gallery
  gallery_layout?: 'masonry' | 'grid' | 'carousel';
  gallery_columns?: number;
  gallery_image_style?: 'cover' | 'contain';

  // About
  about_profile_image?: string;
  about_bio_text?: string;
  about_social_links?: { platform: string; url: string }[];

  // Services
  services_list?: { title: string; description: string }[];

  // Testimonials
  testimonials_list?: { name: string; text: string; location?: string }[];

  // Contact
  contact_heading?: string;
  contact_email?: string;
  contact_phone?: string;

  // Instagram
  instagram_username?: string;

  // Video
  video_url?: string;
  video_thumbnail?: string;
}

interface TemplateSection {
  id: string;
  type: SectionType;
  settings: TemplateSectionSettings;
}

interface Template {
  id?: string;
  name: string;
  category: string;
  sections: TemplateSection[];
  created_by: string;
  created_at?: string;
  published: boolean;
}

const CATEGORIES = [
  'Wedding', 'Portrait', 'Studio', 'Fashion', 'Commercial', 'Editorial', 'Lifestyle'
];

/* ─────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
─────────────────────────────────────────────────────────────────────── */

export default function TemplateBuilder() {
  const { user } = useAuth();

  // Template metadata
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [templateCategory, setTemplateCategory] = useState('Wedding');
  const [published, setPublished] = useState(false);

  // Sections array
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  /* ────────────────── ACTIONS ────────────────── */

  const handleAddSection = (type: SectionType) => {
    const newSection: TemplateSection = {
      id: crypto.randomUUID(),
      type,
      settings: {},
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    toast.success(`${SECTION_LIBRARY.find(s => s.type === type)?.label} added`);
  };

  const handleRemoveSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const handleDuplicateSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    const duplicate: TemplateSection = { ...section, id: crypto.randomUUID() };
    const index = sections.findIndex(s => s.id === id);
    const newSections = [...sections];
    newSections.splice(index + 1, 0, duplicate);
    setSections(newSections);
    toast.success('Section duplicated');
  };

  const handleUpdateSettings = (key: keyof TemplateSectionSettings, value: any) => {
    if (!selectedSection) return;
    setSections(prev => prev.map(s => s.id === selectedSection.id
      ? { ...s, settings: { ...s.settings, [key]: value } }
      : s
    ));
  };

  const handleSaveTemplate = async () => {
    if (!user) return;
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const template: Template = {
      name: templateName,
      category: templateCategory,
      sections,
      created_by: user.id,
      published,
    };

    const { error } = await supabase.from('templates').insert(template as any);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }

    toast.success('Template saved successfully');
  };

  const handlePublishTemplate = async () => {
    setPublished(prev => !prev);
    toast.success(published ? 'Template unpublished' : 'Template published');
  };

  /* ────────────────── DRAG & DROP ────────────────── */

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, removed);
    setSections(newSections);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  /* ────────────────── RENDER HELPERS ────────────────── */

  const getSectionMeta = (type: SectionType) => SECTION_LIBRARY.find(s => s.type === type);

  const renderSectionPreview = (section: TemplateSection) => {
    const meta = getSectionMeta(section.type);
    if (!meta) return null;

    return (
      <Card
        className={cn(
          'p-6 border-2 cursor-pointer transition-all',
          selectedSectionId === section.id
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-border hover:border-amber-500/30 hover:bg-muted/30'
        )}
        onClick={() => setSelectedSectionId(section.id)}
      >
        <div className="flex items-center gap-3 mb-4">
          <meta.icon className={cn('h-5 w-5', meta.color)} />
          <h3 className="font-semibold text-foreground">{meta.label}</h3>
        </div>

        {/* Mini preview based on type */}
        {section.type === 'hero' && (
          <div className="bg-muted rounded p-4 text-sm text-muted-foreground">
            <p className="font-bold mb-1">{section.settings.hero_title || 'Hero Title'}</p>
            <p className="text-xs">{section.settings.hero_subtitle || 'Subtitle here'}</p>
          </div>
        )}
        {section.type === 'gallery' && (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-muted rounded" />
            ))}
          </div>
        )}
        {section.type === 'about' && (
          <div className="flex gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-3 bg-muted rounded mb-2 w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        )}
        {!['hero', 'gallery', 'about'].includes(section.type) && (
          <div className="bg-muted rounded p-3 text-xs text-muted-foreground">
            Section preview
          </div>
        )}
      </Card>
    );
  };

  const renderSettingsPanel = () => {
    if (!selectedSection) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <Settings2 className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm">Select a section to edit its settings</p>
        </div>
      );
    }

    const meta = getSectionMeta(selectedSection.type);
    if (!meta) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <meta.icon className={cn('h-5 w-5', meta.color)} />
          <h3 className="font-semibold text-foreground">{meta.label}</h3>
        </div>

        {/* Hero Settings */}
        {selectedSection.type === 'hero' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Background Image URL</Label>
              <Input
                value={selectedSection.settings.hero_background_image || ''}
                onChange={(e) => handleUpdateSettings('hero_background_image', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Title</Label>
              <Input
                value={selectedSection.settings.hero_title || ''}
                onChange={(e) => handleUpdateSettings('hero_title', e.target.value)}
                placeholder="Your Studio Name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Subtitle</Label>
              <Input
                value={selectedSection.settings.hero_subtitle || ''}
                onChange={(e) => handleUpdateSettings('hero_subtitle', e.target.value)}
                placeholder="Capturing timeless moments"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Button Text</Label>
              <Input
                value={selectedSection.settings.hero_button_text || ''}
                onChange={(e) => handleUpdateSettings('hero_button_text', e.target.value)}
                placeholder="View Portfolio"
                className="mt-1.5"
              />
            </div>
          </>
        )}

        {/* Gallery Settings */}
        {selectedSection.type === 'gallery' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Layout Type</Label>
              <Select
                value={selectedSection.settings.gallery_layout || 'masonry'}
                onValueChange={(val) => handleUpdateSettings('gallery_layout', val)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Grid Columns</Label>
              <Select
                value={String(selectedSection.settings.gallery_columns || 3)}
                onValueChange={(val) => handleUpdateSettings('gallery_columns', Number(val))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Image Style</Label>
              <Select
                value={selectedSection.settings.gallery_image_style || 'cover'}
                onValueChange={(val) => handleUpdateSettings('gallery_image_style', val)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* About Settings */}
        {selectedSection.type === 'about' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Profile Image URL</Label>
              <Input
                value={selectedSection.settings.about_profile_image || ''}
                onChange={(e) => handleUpdateSettings('about_profile_image', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Bio Text</Label>
              <Textarea
                value={selectedSection.settings.about_bio_text || ''}
                onChange={(e) => handleUpdateSettings('about_bio_text', e.target.value)}
                placeholder="Tell your story..."
                rows={6}
                className="mt-1.5"
              />
            </div>
          </>
        )}

        {/* Contact Settings */}
        {selectedSection.type === 'contact' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Heading</Label>
              <Input
                value={selectedSection.settings.contact_heading || ''}
                onChange={(e) => handleUpdateSettings('contact_heading', e.target.value)}
                placeholder="Get In Touch"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
              <Input
                value={selectedSection.settings.contact_email || ''}
                onChange={(e) => handleUpdateSettings('contact_email', e.target.value)}
                placeholder="hello@studio.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
              <Input
                value={selectedSection.settings.contact_phone || ''}
                onChange={(e) => handleUpdateSettings('contact_phone', e.target.value)}
                placeholder="+1 234 567 8900"
                className="mt-1.5"
              />
            </div>
          </>
        )}

        {/* Instagram Settings */}
        {selectedSection.type === 'instagram' && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Instagram Username</Label>
            <Input
              value={selectedSection.settings.instagram_username || ''}
              onChange={(e) => handleUpdateSettings('instagram_username', e.target.value)}
              placeholder="@yourstudio"
              className="mt-1.5"
            />
          </div>
        )}

        {/* Video Settings */}
        {selectedSection.type === 'video' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Video URL</Label>
              <Input
                value={selectedSection.settings.video_url || ''}
                onChange={(e) => handleUpdateSettings('video_url', e.target.value)}
                placeholder="https://vimeo.com/..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Thumbnail URL</Label>
              <Input
                value={selectedSection.settings.video_thumbnail || ''}
                onChange={(e) => handleUpdateSettings('video_thumbnail', e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </>
        )}

        {/* Generic fallback for other types */}
        {!['hero', 'gallery', 'about', 'contact', 'instagram', 'video'].includes(selectedSection.type) && (
          <p className="text-sm text-muted-foreground">No configurable settings for this section type.</p>
        )}
      </div>
    );
  };

  /* ────────────────── RENDER ────────────────── */

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-64 h-8 bg-background"
            placeholder="Template Name"
          />
          <Select value={templateCategory} onValueChange={setTemplateCategory}>
            <SelectTrigger className="w-40 h-8 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={published ? 'default' : 'secondary'} className="text-xs">
            {published ? 'Published' : 'Draft'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handlePublishTemplate}>
            <Globe className="h-4 w-4 mr-1.5" />
            {published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button size="sm" onClick={handleSaveTemplate}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Template
          </Button>
        </div>
      </header>

      {/* Body: 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Section Library */}
        <aside className="w-64 border-r border-border bg-card/30">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Section Library
              </h3>
              {SECTION_LIBRARY.map(section => (
                <Button
                  key={section.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSection(section.type)}
                  className="w-full justify-start text-sm h-auto py-2.5"
                >
                  <section.icon className={cn('h-4 w-4 mr-2', section.color)} />
                  <span className="truncate">{section.label}</span>
                  <Plus className="h-3.5 w-3.5 ml-auto opacity-50" />
                </Button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* CENTER AREA: Page Builder Canvas */}
        <main className="flex-1 overflow-auto bg-muted/20">
          <ScrollArea className="h-full">
            <div className="p-8 max-w-5xl mx-auto">
              {sections.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <LayoutTemplate className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">
                    No sections yet. Add sections from the library on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, index) => {
                    const meta = getSectionMeta(section.type);
                    if (!meta) return null;

                    return (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'group relative',
                          draggedIndex === index && 'opacity-50'
                        )}
                      >
                        {/* Section Tools */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDuplicateSection(section.id)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleRemoveSection(section.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                          <div className="h-7 w-7 flex items-center justify-center cursor-grab active:cursor-grabbing bg-secondary rounded text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                          </div>
                        </div>

                        {renderSectionPreview(section)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        {/* RIGHT PANEL: Section Settings */}
        <aside className="w-80 border-l border-border bg-card/30">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Section Settings
              </h3>
              {renderSettingsPanel()}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
