import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, BookOpen, Trash2, Grid3X3, LayoutGrid, Layers } from 'lucide-react';
import CarouselDesigner from '@/components/CarouselDesigner';
import type { Slide } from '@/components/CarouselDesigner';
import { makeSlide } from '@/components/CarouselDesigner';
import GridBuilder from '@/components/grid-builder/GridBuilder';
import InstagramFeedPlanner from '@/components/InstagramFeedPlanner';
import { StorybookInstallBanner } from '@/components/StorybookInstallBanner';

// Generate a deterministic UUID v5-like ID from an email for standalone mode
function emailToUuid(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-0000-4000-8000-${hex.repeat(3).slice(0, 12)}`;
}

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
  const [showFeedPlanner, setShowFeedPlanner] = useState(false);

  // Resolve effective user ID
  const effectiveUserId = standalone
    ? emailToUuid(sessionStorage.getItem('storybook_email') || 'anonymous')
    : user?.id;

  const hasAccess = standalone ? !!sessionStorage.getItem('storybook_access_verified') : !!user;

  // Swap manifest to storybook-specific one for PWA install
  useEffect(() => {
    if (!standalone) return;
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    const original = link?.getAttribute('href');
    if (link) link.setAttribute('href', '/manifest-storybook.json');
    return () => {
      if (link && original) link.setAttribute('href', original);
    };
  }, [standalone]);

  // Load storybooks list
  useEffect(() => {
    if (!hasAccess || !effectiveUserId) return;
    const load = async () => {
      setLoading(true);
      const { data: sb } = await (supabase.from('storybooks').select('*') as any)
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false });
      setStorybooks(sb || []);
      setLoading(false);
    };
    load();
  }, [hasAccess, effectiveUserId]);

  // Load active storybook data + event photos
  useEffect(() => {
    if (!activeId || !hasAccess || !effectiveUserId) return;
    const sb = storybooks.find(s => s.id === activeId);
    if (sb) {
      setTitle(sb.title);
      const saved = sb.slides_data;
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setInitialSlides(saved as Slide[]);
      } else {
        setInitialSlides([makeSlide()]);
      }
    }

    if (!standalone) {
      (async () => {
        const { data: photos } = await (supabase.from('photos').select('url') as any)
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: false })
          .limit(100);
        setEventPhotos((photos || []).map((p: any) => p.url));
      })();
    }
  }, [activeId, hasAccess, effectiveUserId]);

  const createStorybook = async () => {
    if (!hasAccess || !effectiveUserId) return;
    const { data, error } = await (supabase.from('storybooks').insert({
      user_id: effectiveUserId,
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
    const cleanSlides = slides.map(s => ({
      ...s,
      elements: s.elements.map(el => ({
        ...el,
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

  if (showFeedPlanner) {
    return <InstagramFeedPlanner photos={eventPhotos} onClose={() => setShowFeedPlanner(false)} />;
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

  const tools = [
    { icon: Grid3X3, name: 'Grid Builder', desc: 'Design layouts for galleries', onClick: () => setShowGridBuilder(true) },
    { icon: LayoutGrid, name: 'Feed Planner', desc: 'Plan your feed visually', onClick: () => setShowFeedPlanner(true) },
    { icon: Layers, name: 'Album Designer', desc: 'Design wedding albums', onClick: () => navigate('/dashboard/album-designer') },
  ];

  // ─── List View ───
  const listContent = (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 28, fontWeight: 400, color: '#F0EDE8', letterSpacing: '0.04em' }}>
          Storybook
        </h1>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'rgba(240,237,232,0.35)', letterSpacing: '0.08em', marginTop: 6 }}>
          Design and manage your creative content
        </p>
      </div>

      {/* Primary action */}
      <div className="mb-10">
        <button
          onClick={createStorybook}
          className="flex items-center gap-2 transition-all"
          style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase' as const,
            color: '#080808', background: '#E8C97A',
            padding: '12px 28px', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#d4b56a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#E8C97A')}
        >
          <Plus className="h-4 w-4" /> New Storybook
        </button>
      </div>

      {/* Tools section */}
      <div className="mb-10">
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 9, color: 'rgba(240,237,232,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase' as const, marginBottom: 16, fontWeight: 600 }}>Tools</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.name}
              onClick={tool.onClick}
              className="text-left transition-all group"
              style={{ padding: 20, border: '1px solid rgba(240,237,232,0.06)', background: 'rgba(240,237,232,0.02)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,201,122,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(240,237,232,0.06)')}
            >
              <tool.icon className="h-5 w-5 mb-3" style={{ color: '#E8C97A', opacity: 0.6 }} strokeWidth={1.5} />
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 500, color: '#F0EDE8' }}>{tool.name}</p>
              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'rgba(240,237,232,0.35)', marginTop: 4 }}>{tool.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* My Storybooks section */}
      <div>
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 9, color: 'rgba(240,237,232,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase' as const, marginBottom: 16, fontWeight: 600 }}>My Storybooks</p>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} style={{ height: 72, background: 'rgba(240,237,232,0.03)' }} className="animate-pulse" />)}
          </div>
        ) : storybooks.length === 0 ? (
          <div style={{ border: '1px solid rgba(240,237,232,0.06)', padding: '48px 24px', textAlign: 'center' }}>
            <BookOpen className="mx-auto h-10 w-10 mb-4" style={{ color: '#E8C97A', opacity: 0.5 }} strokeWidth={1.5} />
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 20, color: '#F0EDE8', fontStyle: 'italic' }}>No storybooks yet</p>
            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: 'rgba(240,237,232,0.35)', marginTop: 8 }}>Create your first Instagram carousel</p>
          </div>
        ) : (
          <div className="space-y-3">
            {storybooks.map(sb => (
              <button
                key={sb.id}
                onClick={() => setActiveId(sb.id)}
                className="w-full text-left transition-all group"
                style={{ padding: 20, border: '1px solid rgba(240,237,232,0.06)', background: 'transparent', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,201,122,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(240,237,232,0.06)')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 18, color: '#F0EDE8' }}>{sb.title}</p>
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: 'rgba(240,237,232,0.3)', marginTop: 4 }}>
                      {sb.slides_data && Array.isArray(sb.slides_data) ? `${sb.slides_data.length} slides` : 'Empty'} · {new Date(sb.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: 'rgba(232,201,122,0.5)', fontWeight: 600, border: '1px solid rgba(232,201,122,0.15)', padding: '4px 12px', fontFamily: '"DM Sans", sans-serif' }}>
                      Draft
                    </span>
                    <button
                      onClick={(e) => deleteStorybook(sb.id, e)}
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      style={{ height: 32, width: 32, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <StorybookInstallBanner />
          {listContent}
        </div>
      </div>
    );
  }

  return <DashboardLayout>{listContent}</DashboardLayout>;
}
