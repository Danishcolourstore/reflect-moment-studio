import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { GridLayout, GridCellData } from '@/components/grid-builder/types';
import { createCellsForLayout } from '@/components/grid-builder/types';
import type { TextLayer } from '@/components/grid-builder/text-overlay-types';
import { createTextLayer } from '@/components/grid-builder/text-overlay-types';
import type { Album, AlbumSize } from '@/components/album-designer/types';
import AlbumEditorToolbar from '@/components/album-designer/AlbumEditorToolbar';
import AlbumPhotoPanel from '@/components/album-designer/AlbumPhotoPanel';
import AlbumCanvas from '@/components/album-designer/AlbumCanvas';
import AlbumRightPanel from '@/components/album-designer/AlbumRightPanel';
import AlbumTimeline, { type PageSlot } from '@/components/album-designer/AlbumTimeline';
import AlbumPreviewModal from '@/components/album-designer/AlbumPreviewModal';
import AlbumExportDialog from '@/components/album-designer/AlbumExportDialog';
import AlbumAutoLayoutDialog from '@/components/album-designer/AlbumAutoLayoutDialog';

const DEFAULT_LAYOUT: GridLayout = {
  id: 'full-bleed', name: 'Full Bleed', category: 'single',
  cols: 1, rows: 1, cells: [[1,1,2,2]], gridCols: 1, gridRows: 1,
};

interface LayerRecord {
  id: string;
  page_id: string;
  layer_type: string;
  photo_id: string | null;
  text_content: string | null;
  x: number; y: number; width: number; height: number;
  rotation: number; z_index: number;
  settings_json: any;
}

export default function AlbumEditorPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [album, setAlbum] = useState<Album | null>(null);
  const [pages, setPages] = useState<PageSlot[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [layout, setLayout] = useState<GridLayout>(DEFAULT_LAYOUT);
  const [cells, setCells] = useState<GridCellData[]>(createCellsForLayout(DEFAULT_LAYOUT));
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [spreadView, setSpreadView] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showBleed, setShowBleed] = useState(false);
  const [showSafeMargin, setShowSafeMargin] = useState(false);
  const [showSpine, setShowSpine] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [paperTexture, setPaperTexture] = useState('white');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [loading, setLoading] = useState(true);

  // Modals
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [autoLayoutOpen, setAutoLayoutOpen] = useState(false);

  // Undo/redo stacks
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Use refs for save closure to avoid stale captures
  const cellsRef = useRef(cells);
  const textLayersRef = useRef(textLayers);
  const layoutRef = useRef(layout);
  const bgColorRef = useRef(bgColor);
  const paperTextureRef = useRef(paperTexture);
  const currentPageIdRef = useRef(currentPageId);

  cellsRef.current = cells;
  textLayersRef.current = textLayers;
  layoutRef.current = layout;
  bgColorRef.current = bgColor;
  paperTextureRef.current = paperTexture;
  currentPageIdRef.current = currentPageId;

  // Compute placed photo tracking from cells
  const placedPhotoCounts = new Map<string, number>();
  // Scan ALL layers across all pages would require loading them all; for now track current page cells
  cells.forEach(cell => {
    if (cell.imageUrl) {
      const count = placedPhotoCounts.get(cell.imageUrl) || 0;
      placedPhotoCounts.set(cell.imageUrl, count + 1);
    }
  });
  const placedPhotoUrls = new Set(placedPhotoCounts.keys());

  // Load album
  useEffect(() => {
    if (!albumId || !user) return;
    (async () => {
      setLoading(true);
      const { data: albumData, error } = await (supabase.from('albums' as any).select('*').eq('id', albumId).single() as any);
      if (error || !albumData) { toast.error('Album not found'); navigate('/dashboard/album-designer'); return; }
      setAlbum(albumData as Album);

      const { data: pagesData } = await (supabase.from('album_pages' as any).select('id, page_number, spread_index, background_color, paper_texture')
        .eq('album_id', albumId).order('page_number', { ascending: true }) as any);
      const ps = (pagesData || []).map((p: any) => ({ id: p.id, pageNumber: p.page_number, spreadIndex: p.spread_index }));
      setPages(ps);

      if (ps.length > 0) {
        setCurrentPageId(ps[0].id);
        if (pagesData?.[0]) {
          setBgColor(pagesData[0].background_color || '#ffffff');
          setPaperTexture(pagesData[0].paper_texture || 'white');
        }
      }
      setLoading(false);
    })();
  }, [albumId, user, navigate]);

  // Load layers when page changes
  useEffect(() => {
    if (!currentPageId) return;
    (async () => {
      const { data: layers } = await (supabase.from('album_layers' as any).select('*')
        .eq('page_id', currentPageId).order('z_index', { ascending: true }) as any);

      // Also load page background
      const { data: pageData } = await (supabase.from('album_pages' as any).select('background_color, paper_texture').eq('id', currentPageId).single() as any);
      if (pageData) {
        setBgColor(pageData.background_color || '#ffffff');
        setPaperTexture(pageData.paper_texture || 'white');
      }

      if (!layers || layers.length === 0) {
        setLayout(DEFAULT_LAYOUT);
        setCells(createCellsForLayout(DEFAULT_LAYOUT));
        setTextLayers([]);
        return;
      }

      const photoLayers = (layers as LayerRecord[]).filter(l => l.layer_type === 'photo');
      const textLayerRecords = (layers as LayerRecord[]).filter(l => l.layer_type === 'text');

      const savedLayout = photoLayers[0]?.settings_json?.layout;
      const activeLayout = savedLayout ? { ...DEFAULT_LAYOUT, ...savedLayout } : DEFAULT_LAYOUT;
      setLayout(activeLayout);

      const newCells = createCellsForLayout(activeLayout);
      photoLayers.forEach((pl, i) => {
        if (i < newCells.length && pl.settings_json?.imageUrl) {
          newCells[i] = {
            ...newCells[i],
            imageUrl: pl.settings_json.imageUrl,
            offsetX: pl.settings_json.offsetX || 0,
            offsetY: pl.settings_json.offsetY || 0,
            scale: pl.settings_json.scale || 1,
          };
        }
      });
      setCells(newCells);

      const restoredText: TextLayer[] = textLayerRecords.map(tl => ({
        ...createTextLayer(),
        ...tl.settings_json,
        id: tl.id,
        text: tl.text_content || 'Text',
        x: tl.x,
        y: tl.y,
      }));
      setTextLayers(restoredText);
    })();
  }, [currentPageId]);

  // Save layers using refs to avoid stale closure
  const saveLayers = useCallback(async () => {
    const pageId = currentPageIdRef.current;
    if (!pageId) return;
    setSaveStatus('saving');
    try {
      await (supabase.from('album_layers' as any).delete().eq('page_id', pageId) as any);

      const currentCells = cellsRef.current;
      const currentTextLayers = textLayersRef.current;
      const currentLayout = layoutRef.current;

      const layersToInsert: any[] = [];
      currentCells.forEach((cell, i) => {
        layersToInsert.push({
          page_id: pageId,
          layer_type: 'photo',
          photo_id: null, text_content: null,
          x: 0, y: 0, width: 100, height: 100, rotation: 0, z_index: i,
          settings_json: {
            imageUrl: cell.imageUrl, offsetX: cell.offsetX, offsetY: cell.offsetY,
            scale: cell.scale,
            layout: { gridCols: currentLayout.gridCols, gridRows: currentLayout.gridRows, cells: currentLayout.cells },
          },
        });
      });

      currentTextLayers.forEach((tl, i) => {
        layersToInsert.push({
          page_id: pageId,
          layer_type: 'text', photo_id: null,
          text_content: tl.text,
          x: tl.x, y: tl.y, width: 100, height: 100,
          rotation: tl.rotation, z_index: 100 + i,
          settings_json: { ...tl },
        });
      });

      if (layersToInsert.length > 0) {
        await (supabase.from('album_layers' as any).insert(layersToInsert) as any);
      }

      await (supabase.from('album_pages' as any).update({
        background_color: bgColorRef.current,
        paper_texture: paperTextureRef.current,
      } as any).eq('id', pageId) as any);

      dirtyRef.current = false;
      setSaveStatus('saved');
    } catch (e) {
      console.error('Save failed', e);
      setSaveStatus('unsaved');
    }
  }, []);

  // Debounced auto-save (3s after last change)
  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (dirtyRef.current) saveLayers();
    }, 3000);
  }, [saveLayers]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus('unsaved');
    scheduleSave();
  }, [scheduleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); handleUndo(); }
        if (e.key === 'y') { e.preventDefault(); handleRedo(); }
        if (e.key === 's') { e.preventDefault(); saveLayers(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveLayers]);

  const pushUndo = () => {
    setUndoStack(prev => [...prev.slice(-20), { cells: [...cells], textLayers: [...textLayers], layout }]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, { cells: [...cells], textLayers: [...textLayers], layout }]);
    setUndoStack(s => s.slice(0, -1));
    setCells(prev.cells); setTextLayers(prev.textLayers); setLayout(prev.layout);
    markDirty();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, { cells: [...cells], textLayers: [...textLayers], layout }]);
    setRedoStack(r => r.slice(0, -1));
    setCells(next.cells); setTextLayers(next.textLayers); setLayout(next.layout);
    markDirty();
  };

  const handleCellsChange = (newCells: GridCellData[]) => { pushUndo(); setCells(newCells); markDirty(); };
  const handleTextLayersChange = (layers: TextLayer[]) => { pushUndo(); setTextLayers(layers); markDirty(); };

  const handleApplyTemplate = (partial: Partial<GridLayout>) => {
    pushUndo();
    const newLayout: GridLayout = {
      ...DEFAULT_LAYOUT, ...partial,
      id: partial.cells ? `template-${partial.cells.length}` : DEFAULT_LAYOUT.id,
      name: 'Custom',
    };
    setLayout(newLayout);
    setCells(createCellsForLayout(newLayout));
    markDirty();
  };

  const handleDropPhoto = (photo: any, cellIndex: number) => {
    pushUndo();
    const newCells = [...cells];
    if (cellIndex < newCells.length) {
      newCells[cellIndex] = { ...newCells[cellIndex], imageUrl: photo.url, file: null, offsetX: 0, offsetY: 0, scale: 1 };
    }
    setCells(newCells);
    markDirty();
  };

  const handleNameChange = async (name: string) => {
    if (!album) return;
    setAlbum({ ...album, name });
    await (supabase.from('albums' as any).update({ name } as any).eq('id', album.id) as any);
  };

  const handleAddPage = async () => {
    if (!album) return;
    const maxPageNum = Math.max(...pages.map(p => p.pageNumber), 0);
    const newPageNum = maxPageNum + 1;
    const { data } = await (supabase.from('album_pages' as any).insert({
      album_id: album.id, page_number: newPageNum, spread_index: Math.ceil(newPageNum / 2),
    } as any).select().single() as any);
    if (data) {
      setPages(prev => [...prev, { id: data.id, pageNumber: data.page_number, spreadIndex: data.spread_index }]);
      toast.success(`Page ${newPageNum} added`);
    }
  };

  const handleDuplicatePage = async (pageId: string) => {
    if (!album) return;
    const maxPageNum = Math.max(...pages.map(p => p.pageNumber), 0) + 1;

    // Get source page data
    const { data: srcPage } = await (supabase.from('album_pages' as any)
      .select('background_color, paper_texture').eq('id', pageId).single() as any);

    const { data: newPage } = await (supabase.from('album_pages' as any).insert({
      album_id: album.id, page_number: maxPageNum, spread_index: Math.ceil(maxPageNum / 2),
      background_color: srcPage?.background_color || '#ffffff',
      paper_texture: srcPage?.paper_texture || 'white',
    } as any).select().single() as any);

    if (newPage) {
      // Copy layers from source page
      const { data: srcLayers } = await (supabase.from('album_layers' as any)
        .select('layer_type, photo_id, text_content, x, y, width, height, rotation, z_index, settings_json')
        .eq('page_id', pageId).order('z_index', { ascending: true }) as any);

      if (srcLayers && srcLayers.length > 0) {
        const copiedLayers = srcLayers.map((l: any) => ({ ...l, page_id: newPage.id }));
        await (supabase.from('album_layers' as any).insert(copiedLayers) as any);
      }

      setPages(prev => [...prev, { id: newPage.id, pageNumber: newPage.page_number, spreadIndex: newPage.spread_index }]);
      toast.success('Page duplicated with all layers');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    await (supabase.from('album_layers' as any).delete().eq('page_id', pageId) as any);
    await (supabase.from('album_pages' as any).delete().eq('id', pageId) as any);
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (currentPageId === pageId && pages.length > 1) {
      const remaining = pages.filter(p => p.id !== pageId);
      setCurrentPageId(remaining[0]?.id || null);
    }
    toast.success('Page deleted');
  };

  const handleSelectPage = (pageId: string) => {
    if (dirtyRef.current) saveLayers();
    setCurrentPageId(pageId);
  };

  // Status workflow
  const handleStatusChange = async (newStatus: string) => {
    if (!album) return;
    const updates: any = { status: newStatus };

    // Auto-generate share link when sending for review
    if (newStatus === 'review' && !album.share_token) {
      const token = crypto.randomUUID();
      updates.share_token = token;
      setAlbum({ ...album, status: newStatus as any, share_token: token });
      await (supabase.from('albums' as any).update(updates).eq('id', album.id) as any);
      const url = `${window.location.origin}/album-preview/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Review link copied to clipboard!');
      return;
    }

    setAlbum({ ...album, status: newStatus as any });
    await (supabase.from('albums' as any).update(updates).eq('id', album.id) as any);
    toast.success(`Status updated to ${newStatus}`);
  };

  // Generate share link
  const handleSharePreview = async (): Promise<string> => {
    if (!album) return '';
    let token = album.share_token;
    if (!token) {
      token = crypto.randomUUID();
      await (supabase.from('albums' as any).update({ share_token: token } as any).eq('id', album.id) as any);
      setAlbum({ ...album, share_token: token });
    }
    const url = `${window.location.origin}/album-preview/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success('Preview link copied!');
    return url;
  };

  // Reload pages after auto layout
  const handleAutoLayoutComplete = async () => {
    if (!albumId) return;
    const { data: pagesData } = await (supabase.from('album_pages' as any).select('id, page_number, spread_index, background_color, paper_texture')
      .eq('album_id', albumId).order('page_number', { ascending: true }) as any);
    const ps = (pagesData || []).map((p: any) => ({ id: p.id, pageNumber: p.page_number, spreadIndex: p.spread_index }));
    setPages(ps);
    if (ps.length > 0) { setCurrentPageId(ps[0].id); }
  };

  // Handle text layer reordering from right panel
  const handleReorderTextLayers = (newLayers: TextLayer[]) => {
    pushUndo();
    setTextLayers(newLayers);
    markDirty();
  };

  // Get current spread page IDs for timeline highlighting
  const currentSpreadIndex = pages.find(p => p.id === currentPageId)?.spreadIndex ?? -1;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Loading album editor…</div>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <AlbumEditorToolbar
        albumName={album.name}
        onNameChange={handleNameChange}
        onBack={() => { if (dirtyRef.current) saveLayers(); navigate('/dashboard/album-designer'); }}
        spreadView={spreadView}
        onToggleSpread={() => setSpreadView(!spreadView)}
        zoom={zoom}
        onZoomChange={setZoom}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        saveStatus={saveStatus}
        albumStatus={album.status}
        onStatusChange={handleStatusChange}
        onAutoLayout={() => setAutoLayoutOpen(true)}
        onPreview={() => setPreviewOpen(true)}
        onExport={() => setExportOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <AlbumPhotoPanel
          albumId={album.id}
          eventId={album.event_id}
          onEventLinked={(eid) => setAlbum({ ...album, event_id: eid })}
          placedPhotoUrls={placedPhotoUrls}
          placedPhotoCounts={placedPhotoCounts}
          onDragStart={() => {}}
        />

        <AlbumCanvas
          layout={layout}
          cells={cells}
          onCellsChange={handleCellsChange}
          textLayers={textLayers}
          onTextLayersChange={handleTextLayersChange}
          selectedTextId={selectedTextId}
          onSelectText={setSelectedTextId}
          albumSize={(album.size as AlbumSize) || '12x12'}
          zoom={zoom}
          onZoomChange={setZoom}
          spreadView={spreadView}
          showBleed={showBleed}
          showSafeMargin={showSafeMargin}
          showSpine={showSpine}
          bgColor={bgColor}
          onDropPhoto={handleDropPhoto}
          currentPageNumber={pages.find(p => p.id === currentPageId)?.pageNumber ?? 0}
        />

        <AlbumRightPanel
          onApplyTemplate={handleApplyTemplate}
          textLayers={textLayers}
          selectedTextId={selectedTextId}
          onAddText={(layer) => { pushUndo(); setTextLayers(prev => [...prev, layer]); setSelectedTextId(layer.id); markDirty(); }}
          onUpdateText={(id, patch) => { pushUndo(); setTextLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l)); markDirty(); }}
          onDeleteText={(id) => { pushUndo(); setTextLayers(prev => prev.filter(l => l.id !== id)); setSelectedTextId(null); markDirty(); }}
          onReorderTextLayers={handleReorderTextLayers}
          showBleed={showBleed}
          showSafeMargin={showSafeMargin}
          showSpine={showSpine}
          onToggleBleed={() => setShowBleed(!showBleed)}
          onToggleSafe={() => setShowSafeMargin(!showSafeMargin)}
          onToggleSpine={() => setShowSpine(!showSpine)}
          bgColor={bgColor}
          onBgColorChange={(c) => { setBgColor(c); markDirty(); }}
          paperTexture={paperTexture}
          onPaperTextureChange={(t) => { setPaperTexture(t); markDirty(); }}
        />
      </div>

      <AlbumTimeline
        pages={pages}
        currentPageId={currentPageId}
        currentSpreadIndex={currentSpreadIndex}
        spreadView={spreadView}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
      />

      {/* Preview Modal */}
      {previewOpen && album && (
        <AlbumPreviewModal
          albumId={album.id}
          albumName={album.name}
          onClose={() => setPreviewOpen(false)}
          onSharePreview={handleSharePreview}
        />
      )}

      {/* Export Dialog */}
      <AlbumExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        album={album}
        pages={pages}
        onSharePreview={handleSharePreview}
      />

      {/* Auto Layout Dialog */}
      <AlbumAutoLayoutDialog
        open={autoLayoutOpen}
        onOpenChange={setAutoLayoutOpen}
        album={album}
        onComplete={handleAutoLayoutComplete}
      />
    </div>
  );
}
