import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpreadData {
  spreadIndex: number;
  pages: { id: string; pageNumber: number; bgColor: string }[];
  layers: any[];
}

interface Props {
  albumId: string;
  albumName: string;
  onClose: () => void;
  onSharePreview: () => Promise<string>;
}

export default function AlbumPreviewModal({ albumId, albumName, onClose, onSharePreview }: Props) {
  const [spreads, setSpreads] = useState<SpreadData[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: pagesData } = await (supabase.from('album_pages' as any)
        .select('id, page_number, spread_index, background_color')
        .eq('album_id', albumId).order('page_number', { ascending: true }) as any);
      if (!pagesData) { setLoading(false); return; }

      // Group pages by spread
      const spreadMap = new Map<number, any[]>();
      for (const p of pagesData) {
        const si = p.spread_index;
        if (!spreadMap.has(si)) spreadMap.set(si, []);
        spreadMap.get(si)!.push({ id: p.id, pageNumber: p.page_number, bgColor: p.background_color || '#ffffff' });
      }

      // Load layers for all pages
      const pageIds = pagesData.map((p: any) => p.id);
      const { data: layersData } = await (supabase.from('album_layers' as any)
        .select('*').in('page_id', pageIds).order('z_index', { ascending: true }) as any);

      const layersByPage = new Map<string, any[]>();
      for (const l of (layersData || [])) {
        if (!layersByPage.has(l.page_id)) layersByPage.set(l.page_id, []);
        layersByPage.get(l.page_id)!.push(l);
      }

      const result: SpreadData[] = [];
      for (const [si, pages] of Array.from(spreadMap.entries()).sort((a, b) => a[0] - b[0])) {
        const allLayers = pages.flatMap((p: any) => layersByPage.get(p.id) || []);
        result.push({ spreadIndex: si, pages, layers: allLayers });
      }

      setSpreads(result);
      setLoading(false);
    })();
  }, [albumId]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, spreads.length - 1));
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spreads.length, onClose]);

  const spread = spreads[current];

  // Count placed photos for preview
  const getPhotoUrls = (layers: any[]) =>
    layers.filter(l => l.layer_type === 'photo' && l.settings_json?.imageUrl).map(l => l.settings_json.imageUrl);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 shrink-0">
        <h2 className="text-white/90 text-sm font-medium">{albumName}</h2>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">
            {spreads.length > 0 ? `Spread ${current + 1} of ${spreads.length}` : ''}
          </span>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white gap-1.5 text-xs" onClick={onSharePreview}>
            <Share2 className="h-3.5 w-3.5" /> Share Preview
          </Button>
          <Button variant="ghost" size="icon" className="text-white/70 hover:text-white h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative px-16">
        {loading ? (
          <div className="text-white/50 text-sm animate-pulse">Loading preview…</div>
        ) : spread ? (
          <div className="flex gap-1 max-w-[80vw] max-h-[80vh]">
            {spread.pages.map((page) => {
              const pageLayers = spread.layers.filter(l => l.page_id === page.id);
              const photos = getPhotoUrls(pageLayers);
              return (
                <div
                  key={page.id}
                  className="aspect-square relative rounded-sm overflow-hidden transition-all duration-500"
                  style={{
                    background: page.bgColor,
                    width: spread.pages.length > 1 ? '40vw' : '50vw',
                    maxHeight: '75vh',
                  }}
                >
                  {photos.length > 0 ? (
                    <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                      Page {page.pageNumber}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-white/50 text-sm">No spreads to preview</div>
        )}

        {/* Nav arrows */}
        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)} className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {current < spreads.length - 1 && (
          <button onClick={() => setCurrent(c => c + 1)} className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
