import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Plus, Save, Trash2, GripVertical, ChevronDown, Image as ImageIcon,
  BookOpen, Type, Columns, Film, Grid3X3, Maximize, Quote, ArrowLeft
} from 'lucide-react';

type LayoutType = 'hero-cover' | 'split-editorial' | 'film-strip' | 'minimal-grid' | 'fullscreen-story' | 'quote-page';

interface StoryBlock {
  id: string;
  layout_type: LayoutType;
  sort_order: number;
  caption: string;
  subtitle: string;
  photo_urls: string[];
  event_id: string | null;
}

interface EventOption {
  id: string;
  name: string;
  photos: { url: string; id: string }[];
}

const LAYOUT_TEMPLATES: { type: LayoutType; label: string; icon: any; description: string; photoCount: number }[] = [
  { type: 'hero-cover', label: 'Hero Cover', icon: Maximize, description: 'Full-width cinematic cover image', photoCount: 1 },
  { type: 'split-editorial', label: 'Split Editorial', icon: Columns, description: 'Image + text side by side', photoCount: 1 },
  { type: 'film-strip', label: 'Film Strip', icon: Film, description: 'Horizontal scrolling strip', photoCount: 4 },
  { type: 'minimal-grid', label: 'Minimal Grid', icon: Grid3X3, description: '2×2 clean photo grid', photoCount: 4 },
  { type: 'fullscreen-story', label: 'Fullscreen Story', icon: ImageIcon, description: 'Immersive full-bleed image', photoCount: 1 },
  { type: 'quote-page', label: 'Quote Page', icon: Quote, description: 'Centered text with no images', photoCount: 0 },
];

export default function StorybookCreator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storybooks, setStorybooks] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Story');
  const [blocks, setBlocks] = useState<StoryBlock[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Load storybooks list + events
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: sb } = await (supabase.from('storybooks').select('*') as any).eq('user_id', user.id).order('updated_at', { ascending: false });
      setStorybooks(sb || []);

      const { data: evts } = await (supabase.from('events').select('id, name') as any).eq('user_id', user.id).order('created_at', { ascending: false });
      if (evts) setEvents(evts.map((e: any) => ({ ...e, photos: [] })));
      setLoading(false);
    };
    load();
  }, [user]);

  // Load active storybook blocks
  useEffect(() => {
    if (!activeId) return;
    const sb = storybooks.find(s => s.id === activeId);
    if (sb) setTitle(sb.title);
    (async () => {
      const { data } = await (supabase.from('storybook_blocks').select('*') as any).eq('storybook_id', activeId).order('sort_order');
      setBlocks((data || []).map((b: any) => ({ ...b, photo_urls: b.photo_urls || [] })));
    })();
  }, [activeId]);

  const loadEventPhotos = async (eventId: string) => {
    const existing = events.find(e => e.id === eventId);
    if (existing && existing.photos.length > 0) return existing.photos;
    const { data } = await (supabase.from('photos').select('id, url') as any).eq('event_id', eventId).order('sort_order').limit(50);
    const photos = data || [];
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, photos } : e));
    return photos;
  };

  const createStorybook = async () => {
    if (!user) return;
    const { data, error } = await (supabase.from('storybooks').insert({ user_id: user.id, title: 'Untitled Story' } as any).select().single() as any);
    if (error) { toast.error('Failed to create storybook'); return; }
    setStorybooks(prev => [data, ...prev]);
    setActiveId(data.id);
    setTitle(data.title);
    setBlocks([]);
    toast.success('New storybook created');
  };

  const saveStorybook = async () => {
    if (!activeId) return;
    setSaving(true);
    await (supabase.from('storybooks').update({ title } as any) as any).eq('id', activeId);
    // Delete existing blocks and re-insert
    await (supabase.from('storybook_blocks').delete() as any).eq('storybook_id', activeId);
    if (blocks.length > 0) {
      const rows = blocks.map((b, i) => ({
        storybook_id: activeId,
        layout_type: b.layout_type,
        sort_order: i,
        caption: b.caption || null,
        subtitle: b.subtitle || null,
        photo_urls: b.photo_urls,
        event_id: b.event_id || null,
      }));
      await (supabase.from('storybook_blocks').insert(rows as any) as any);
    }
    setSaving(false);
    toast.success('Storybook saved');
  };

  const deleteStorybook = async () => {
    if (!activeId) return;
    await (supabase.from('storybooks').delete() as any).eq('id', activeId);
    setStorybooks(prev => prev.filter(s => s.id !== activeId));
    setActiveId(null);
    setBlocks([]);
    toast.success('Storybook deleted');
  };

  const addBlock = (type: LayoutType) => {
    const newBlock: StoryBlock = {
      id: crypto.randomUUID(),
      layout_type: type,
      sort_order: blocks.length,
      caption: '',
      subtitle: '',
      photo_urls: [],
      event_id: null,
    };
    setBlocks(prev => [...prev, newBlock]);
    setShowNewBlock(false);
  };

  const updateBlock = (id: string, updates: Partial<StoryBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setBlocks(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const togglePhotoInBlock = (blockId: string, url: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const has = b.photo_urls.includes(url);
      const tpl = LAYOUT_TEMPLATES.find(t => t.type === b.layout_type);
      const max = tpl?.photoCount || 10;
      if (has) return { ...b, photo_urls: b.photo_urls.filter(u => u !== url) };
      if (b.photo_urls.length >= max) return b;
      return { ...b, photo_urls: [...b.photo_urls, url] };
    }));
  };

  // ─── List View ───
  if (!activeId) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="font-serif text-foreground" style={{ fontSize: '36px', fontWeight: 400, fontStyle: 'italic' }}>
            Storybook Creator
          </h1>
          <p className="text-muted-foreground mt-2" style={{ fontSize: '13px' }}>
            Create visual storytelling layouts from your event photos. Draft only — not public.
          </p>
        </div>

        <Button onClick={createStorybook} className="mb-6 gap-2">
          <Plus className="h-4 w-4" /> New Storybook
        </Button>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : storybooks.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-primary mb-4" strokeWidth={1.5} />
            <p className="font-serif text-foreground text-xl" style={{ fontStyle: 'italic' }}>No storybooks yet</p>
            <p className="text-muted-foreground text-sm mt-2">Create your first visual story</p>
          </div>
        ) : (
          <div className="space-y-3">
            {storybooks.map(sb => (
              <button
                key={sb.id}
                onClick={() => setActiveId(sb.id)}
                className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif text-foreground text-lg">{sb.title}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Draft · {new Date(sb.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[9px] uppercase tracking-[2px] text-primary/60 font-semibold border border-primary/20 rounded-full px-3 py-1">
                    Draft
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </DashboardLayout>
    );
  }

  // ─── Editor View ───
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setActiveId(null)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-transparent border-none text-foreground font-serif text-2xl p-0 h-auto focus-visible:ring-0"
          style={{ fontStyle: 'italic' }}
        />
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={deleteStorybook} className="gap-1.5 text-destructive border-destructive/30">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <Button size="sm" onClick={saveStorybook} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <p className="text-[9px] uppercase tracking-[2px] text-primary/50 font-semibold mb-6">
        Draft — visible only to you
      </p>

      {/* Blocks */}
      <div className="space-y-4 mb-6">
        {blocks.map((block, idx) => {
          const tpl = LAYOUT_TEMPLATES.find(t => t.type === block.layout_type)!;
          return (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`rounded-2xl border bg-card p-4 transition-all ${dragIdx === idx ? 'border-primary/50 opacity-70' : 'border-border'}`}
            >
              {/* Block header */}
              <div className="flex items-center gap-3 mb-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                <tpl.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-[2px] text-muted-foreground font-semibold flex-1">
                  {tpl.label}
                </span>
                <button onClick={() => removeBlock(block.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Caption / text fields */}
              <div className="space-y-2 mb-3">
                <Input
                  value={block.caption}
                  onChange={e => updateBlock(block.id, { caption: e.target.value })}
                  placeholder={block.layout_type === 'quote-page' ? 'Enter your quote...' : 'Caption (optional)'}
                  className="bg-background/50 text-sm"
                />
                {(block.layout_type === 'split-editorial' || block.layout_type === 'hero-cover' || block.layout_type === 'quote-page') && (
                  <Input
                    value={block.subtitle}
                    onChange={e => updateBlock(block.id, { subtitle: e.target.value })}
                    placeholder="Subtitle (optional)"
                    className="bg-background/50 text-sm"
                  />
                )}
              </div>

              {/* Photo selection */}
              {tpl.photoCount > 0 && (
                <div>
                  {/* Selected photos */}
                  {block.photo_urls.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {block.photo_urls.map((url, pi) => (
                        <div key={pi} className="relative h-16 w-16 rounded-lg overflow-hidden group">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            onClick={() => togglePhotoInBlock(block.id, url)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Event picker */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPicker(showPicker === block.id ? null : block.id)}
                      className="gap-1.5 text-xs"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      {block.photo_urls.length}/{tpl.photoCount} photos
                      <ChevronDown className="h-3 w-3" />
                    </Button>

                    {showPicker === block.id && (
                      <div className="absolute z-20 top-full left-0 mt-2 w-80 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-3">
                        {events.length === 0 ? (
                          <p className="text-muted-foreground text-xs text-center py-4">No events found</p>
                        ) : (
                          events.map(evt => (
                            <EventPhotoSection
                              key={evt.id}
                              event={evt}
                              selectedUrls={block.photo_urls}
                              maxPhotos={tpl.photoCount}
                              onLoadPhotos={() => loadEventPhotos(evt.id)}
                              onToggle={url => togglePhotoInBlock(block.id, url)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              <BlockPreview block={block} />
            </div>
          );
        })}
      </div>

      {/* Add block */}
      {showNewBlock ? (
        <div className="rounded-2xl border border-primary/20 bg-card p-4 mb-20">
          <p className="text-[10px] uppercase tracking-[2px] text-muted-foreground font-semibold mb-3">
            Choose a layout
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_TEMPLATES.map(tpl => (
              <button
                key={tpl.type}
                onClick={() => addBlock(tpl.type)}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
              >
                <tpl.icon className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="text-foreground text-xs font-medium">{tpl.label}</p>
                  <p className="text-muted-foreground text-[10px]">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowNewBlock(false)} className="mt-3 w-full">
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowNewBlock(true)} className="w-full gap-2 mb-20">
          <Plus className="h-4 w-4" /> Add Block
        </Button>
      )}
    </DashboardLayout>
  );
}

// ─── Sub-components ───

function EventPhotoSection({ event, selectedUrls, maxPhotos, onLoadPhotos, onToggle }: {
  event: EventOption;
  selectedUrls: string[];
  maxPhotos: number;
  onLoadPhotos: () => Promise<any>;
  onToggle: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const toggle = async () => {
    if (!loaded) {
      await onLoadPhotos();
      setLoaded(true);
    }
    setOpen(!open);
  };

  return (
    <div className="mb-2">
      <button onClick={toggle} className="flex items-center gap-2 w-full text-left py-1.5 hover:bg-primary/5 rounded-lg px-2 transition-colors">
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
        <span className="text-foreground text-xs font-medium truncate">{event.name}</span>
        <span className="text-muted-foreground text-[10px] ml-auto">{event.photos.length > 0 ? `${event.photos.length} photos` : ''}</span>
      </button>
      {open && (
        <div className="grid grid-cols-5 gap-1.5 mt-1.5 pl-6">
          {event.photos.map(p => {
            const selected = selectedUrls.includes(p.url);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.url)}
                className={`relative h-12 w-12 rounded-md overflow-hidden border-2 transition-all ${selected ? 'border-primary' : 'border-transparent hover:border-primary/30'}`}
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {selected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                  </div>
                )}
              </button>
            );
          })}
          {event.photos.length === 0 && <p className="col-span-5 text-muted-foreground text-[10px] py-2">No photos uploaded</p>}
        </div>
      )}
    </div>
  );
}

function BlockPreview({ block }: { block: StoryBlock }) {
  if (block.photo_urls.length === 0 && block.layout_type !== 'quote-page') return null;

  switch (block.layout_type) {
    case 'hero-cover':
      return (
        <div className="mt-3 rounded-xl overflow-hidden relative" style={{ height: '200px' }}>
          <img src={block.photo_urls[0]} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            {block.caption && <p className="text-white font-serif text-lg" style={{ fontStyle: 'italic' }}>{block.caption}</p>}
            {block.subtitle && <p className="text-white/60 text-xs mt-1">{block.subtitle}</p>}
          </div>
        </div>
      );

    case 'split-editorial':
      return (
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl overflow-hidden">
          <div className="h-40 rounded-xl overflow-hidden">
            {block.photo_urls[0] && <img src={block.photo_urls[0]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex flex-col justify-center px-2">
            {block.caption && <p className="font-serif text-foreground text-sm" style={{ fontStyle: 'italic' }}>{block.caption}</p>}
            {block.subtitle && <p className="text-muted-foreground text-xs mt-2">{block.subtitle}</p>}
          </div>
        </div>
      );

    case 'film-strip':
      return (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {block.photo_urls.map((url, i) => (
            <div key={i} className="shrink-0 h-24 w-36 rounded-lg overflow-hidden">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      );

    case 'minimal-grid':
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {block.photo_urls.slice(0, 4).map((url, i) => (
            <div key={i} className="h-24 rounded-lg overflow-hidden">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      );

    case 'fullscreen-story':
      return (
        <div className="mt-3 rounded-xl overflow-hidden relative" style={{ height: '240px' }}>
          <img src={block.photo_urls[0]} alt="" className="h-full w-full object-cover" />
          {block.caption && (
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white/80 text-xs">{block.caption}</p>
            </div>
          )}
        </div>
      );

    case 'quote-page':
      return (
        <div className="mt-3 rounded-xl bg-background/50 p-8 text-center" style={{ minHeight: '120px' }}>
          {block.caption && (
            <p className="font-serif text-foreground text-lg leading-relaxed" style={{ fontStyle: 'italic' }}>
              "{block.caption}"
            </p>
          )}
          {block.subtitle && <p className="text-muted-foreground text-xs mt-3">— {block.subtitle}</p>}
        </div>
      );

    default:
      return null;
  }
}
