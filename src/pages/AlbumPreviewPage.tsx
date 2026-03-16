import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageData {
  id: string;
  pageNumber: number;
  bgColor: string;
  layers: any[];
}

interface SpreadData {
  spreadIndex: number;
  pages: PageData[];
}

function renderPageContent(layers: any[]) {
  const photos = layers.filter((l: any) => l.layer_type === 'photo');
  if (!photos.length)
    return (
      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
        Empty
      </div>
    );

  // Read layout from first photo layer
  const firstSettings = photos[0]?.settings_json as Record<string, any> | null;
  const layout = firstSettings?.layout;

  if (layout?.gridCols && layout?.gridRows && layout?.cells) {
    return (
      <div
        className="w-full h-full grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
        }}
      >
        {(layout.cells as number[][]).map((area: number[], i: number) => {
          const photo = photos[i];
          const s = photo?.settings_json as Record<string, any> | null;
          const url = s?.imageUrl;
          return (
            <div
              key={i}
              className="overflow-hidden"
              style={{
                gridArea: `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`,
              }}
            >
              {url ? (
                <img src={url} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full bg-white/5" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback
  const cols = Math.ceil(Math.sqrt(photos.length));
  const rows = Math.ceil(photos.length / cols);
  return (
    <div
      className="w-full h-full grid gap-[2px]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {photos.map((p: any, i: number) => {
        const s = p.settings_json as Record<string, any> | null;
        const url = s?.imageUrl;
        return url ? (
          <img key={i} src={url} className="w-full h-full object-cover" alt="" />
        ) : (
          <div key={i} className="w-full h-full bg-white/5" />
        );
      })}
    </div>
  );
}

export default function AlbumPreviewPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [albumName, setAlbumName] = useState('');
  const [spreads, setSpreads] = useState<SpreadData[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareToken) return;
    (async () => {
      setLoading(true);
      const { data: album } = await (supabase.from('albums' as any)
        .select('id, name').eq('share_token', shareToken).single() as any);

      if (!album) { setNotFound(true); setLoading(false); return; }
      setAlbumName(album.name);

      const { data: pagesData } = await (supabase.from('album_pages' as any)
        .select('id, page_number, spread_index, background_color')
        .eq('album_id', album.id).order('page_number', { ascending: true }) as any);

      if (!pagesData) { setLoading(false); return; }

      const pageIds = pagesData.map((p: any) => p.id);
      const { data: layersData } = await (supabase.from('album_layers' as any)
        .select('*').in('page_id', pageIds).order('z_index', { ascending: true }) as any);

      // Group layers by page
      const layersByPage = new Map<string, any[]>();
      for (const l of (layersData || [])) {
        if (!layersByPage.has(l.page_id)) layersByPage.set(l.page_id, []);
        layersByPage.get(l.page_id)!.push(l);
      }

      // Group pages by spread
      const spreadMap = new Map<number, PageData[]>();
      for (const p of pagesData) {
        if (!spreadMap.has(p.spread_index)) spreadMap.set(p.spread_index, []);
        spreadMap.get(p.spread_index)!.push({
          id: p.id,
          pageNumber: p.page_number,
          bgColor: p.background_color || '#ffffff',
          layers: layersByPage.get(p.id) || [],
        });
      }

      const result: SpreadData[] = Array.from(spreadMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([si, pages]) => ({ spreadIndex: si, pages }));

      setSpreads(result);
      setLoading(false);
    })();
  }, [shareToken]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(c + 1, spreads.length - 1));
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spreads.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/50 text-sm animate-pulse">Loading album preview…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-xl font-serif mb-2">Album Not Found</h1>
          <p className="text-white/50 text-sm">This preview link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  const spread = spreads[current];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/10">
        <h1 className="text-white/90 font-serif text-lg">{albumName}</h1>
        <span className="text-white/40 text-xs">
          {spreads.length > 0 ? `Spread ${current + 1} of ${spreads.length}` : ''}
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center relative px-16 py-8">
        {spread ? (
          <div className="flex gap-1 max-w-[85vw] max-h-[80vh]">
            {spread.pages.map((page) => (
              <div
                key={page.id}
                className="aspect-square relative rounded-sm overflow-hidden transition-all duration-500"
                style={{
                  background: page.bgColor,
                  width: spread.pages.length > 1 ? '40vw' : '50vw',
                  maxHeight: '75vh',
                }}
              >
                {renderPageContent(page.layers)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/40 text-sm">No content</p>
        )}

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

      <footer className="h-10 flex items-center justify-center text-white/20 text-[10px] tracking-wider uppercase">
        Album Preview
      </footer>
    </div>
  );
}
