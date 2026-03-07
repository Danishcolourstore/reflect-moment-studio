import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, BookOpen, Trash2, Grid3X3 } from 'lucide-react';
import CarouselDesigner from '@/components/CarouselDesigner';
import type { Slide } from '@/components/CarouselDesigner';
import { makeSlide } from '@/components/CarouselDesigner';
import GridBuilder from '@/components/grid-builder/GridBuilder';

export default function StorybookCreator({ standalone = false }: { standalone?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storybooks, setStorybooks] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState('Untitled Story');
  const [eventPhotos, setEventPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialSlides, setInitialSlides] = useState<Slide[]>([]);
  const [showGridBuilder, setShowGridBuilder] = useState(false);

  // Load storybooks list
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: sb } = await (supabase.from('storybooks').select('*') as any)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setStorybooks(sb || []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Load active storybook data + event photos
  useEffect(() => {
    if (!activeId || !user) return;
    const sb = storybooks.find(s => s.id === activeId);
    if (sb) {
      setTitle(sb.title);
      // Parse slides_data from JSON
      const saved = sb.slides_data;
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setInitialSlides(saved as Slide[]);
      } else {
        setInitialSlides([makeSlide()]);
      }
    }

    // Load all event photos for the photo pool
    (async () => {
      const { data: photos } = await (supabase.from('photos').select('url') as any)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setEventPhotos((photos || []).map((p: any) => p.url));
    })();
  }, [activeId, user]);

  const createStorybook = async () => {
    if (!user) return;
    const { data, error } = await (supabase.from('storybooks').insert({
      user_id: user.id,
      title: 'Untitled Story',
      slides_data: [makeSlide()],
    } as any).select().single() as any);
    if (error) { toast.error('Failed to create storybook'); return; }
    setStorybooks(prev => [data, ...prev]);
    setActiveId(data.id);
    setTitle(data.title);
    setInitialSlides([makeSlide()]);
    toast.success('New storybook created');
  };

  const deleteStorybook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await (supabase.from('storybooks').delete() as any).eq('id', id);
    setStorybooks(prev => prev.filter(s => s.id !== id));
    if (activeId === id) setActiveId(null);
    toast.success('Storybook deleted');
  };

  const handleSave = async (slides: Slide[]) => {
    if (!activeId) return;
    setSaving(true);
    // Strip data URLs from slides for storage efficiency — keep only remote URLs
    const cleanSlides = slides.map(s => ({
      ...s,
      elements: s.elements.map(el => ({
        ...el,
        // Keep src only if it's a remote URL, strip base64 data URLs to save space
        src: el.src && !el.src.startsWith('data:') ? el.src : el.src,
      })),
    }));

    await (supabase.from('storybooks').update({
      title,
      slides_data: cleanSlides,
      updated_at: new Date().toISOString(),
    } as any) as any).eq('id', activeId);

    setSaving(false);
    toast.success('Storybook saved');
  };

  const handleClose = () => {
    setActiveId(null);
    setInitialSlides([]);
  };

  // ─── Grid Builder View ───
  if (showGridBuilder) {
    return <GridBuilder onClose={() => setShowGridBuilder(false)} />;
  }

  // ─── Editor View (Carousel Designer) ───
  if (activeId && initialSlides.length > 0) {
    return (
      <CarouselDesigner
        photos={eventPhotos}
        onClose={handleClose}
        onSave={handleSave}
        initialSlides={initialSlides}
        title={title}
        saving={saving}
      />
    );
  }

  // ─── List View ───
  const listContent = (
    <>
      <div className="mb-6">
        <h1 className="font-serif text-foreground" style={{ fontSize: '36px', fontWeight: 400, fontStyle: 'italic' }}>
          Storybook Creator
        </h1>
        <p className="text-muted-foreground mt-2" style={{ fontSize: '13px' }}>
          Design Instagram carousel posts with a professional slide-based editor.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <Button onClick={createStorybook} className="gap-2">
          <Plus className="h-4 w-4" /> New Storybook
        </Button>
        {!standalone && (
          <Button variant="outline" onClick={() => setShowGridBuilder(true)} className="gap-2">
            <Grid3X3 className="h-4 w-4" /> Grid Builder
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : storybooks.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-primary mb-4" strokeWidth={1.5} />
          <p className="font-serif text-foreground text-xl" style={{ fontStyle: 'italic' }}>No storybooks yet</p>
          <p className="text-muted-foreground text-sm mt-2">Create your first Instagram carousel</p>
        </div>
      ) : (
        <div className="space-y-3">
          {storybooks.map(sb => (
            <button
              key={sb.id}
              onClick={() => setActiveId(sb.id)}
              className="w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-serif text-foreground text-lg">{sb.title}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {sb.slides_data && Array.isArray(sb.slides_data) ? `${sb.slides_data.length} slides` : 'Empty'} · {new Date(sb.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[2px] text-primary/60 font-semibold border border-primary/20 rounded-full px-3 py-1">
                    Draft
                  </span>
                  <button
                    onClick={(e) => deleteStorybook(sb.id, e)}
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {listContent}
        </div>
      </div>
    );
  }

  return <DashboardLayout>{listContent}</DashboardLayout>;
}
