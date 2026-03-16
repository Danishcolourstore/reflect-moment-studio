import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { GridLayout, GridCellData } from "@/components/grid-builder/types";
import { createCellsForLayout } from "@/components/grid-builder/types";
import type { TextLayer } from "@/components/grid-builder/text-overlay-types";
import { createTextLayer } from "@/components/grid-builder/text-overlay-types";
import type { AlbumSize, AlbumStatus } from "@/components/album-designer/types";

/* ─── Types ─── */

export interface PageSlot {
  id: string;
  pageNumber: number;
  spreadIndex: number;
}

export interface AlbumData {
  id: string;
  name: string;
  size: AlbumSize;
  cover_type: string;
  leaf_count: number;
  page_count: number;
  status: AlbumStatus;
  share_token: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  cells: GridCellData[];
  textLayers: TextLayer[];
  layout: GridLayout;
}

const DEFAULT_LAYOUT: GridLayout = {
  id: "full-bleed",
  name: "Full Bleed",
  category: "single",
  cols: 1,
  rows: 1,
  cells: [[1, 1, 2, 2]],
  gridCols: 1,
  gridRows: 1,
};

/* ─── Hook ─── */

export function useAlbumEditor(albumId: string | undefined) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [pages, setPages] = useState<PageSlot[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [layout, setLayout] = useState<GridLayout>(DEFAULT_LAYOUT);
  const [cells, setCells] = useState<GridCellData[]>(createCellsForLayout(DEFAULT_LAYOUT));
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [spreadView, setSpreadView] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showBleed, setShowBleed] = useState(false);
  const [showSafeMargin, setShowSafeMargin] = useState(false);
  const [showSpine, setShowSpine] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [paperTexture, setPaperTexture] = useState("white");

  // Save state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Album-wide photo tracking (Bug 6)
  const [allPagesPhotoMap, setAllPagesPhotoMap] = useState<Map<string, string[]>>(new Map());
  const [pageThumbnails, setPageThumbnails] = useState<Map<string, string>>(new Map());
  const [uploadingCells, setUploadingCells] = useState<Set<number>>(new Set());

  // Undo/redo
  const [undoStack, setUndoStack] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  // Refs for save closure
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

  // Computed
  const currentSpreadIndex = pages.find((p) => p.id === currentPageId)?.spreadIndex ?? -1;
  const currentPageNumber = pages.find((p) => p.id === currentPageId)?.pageNumber ?? 0;

  // Bug 6: Album-wide placed photo counts
  const placedPhotoCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [pageId, urls] of allPagesPhotoMap) {
      if (pageId === currentPageId) continue;
      for (const url of urls) {
        if (url) counts.set(url, (counts.get(url) || 0) + 1);
      }
    }
    for (const cell of cells) {
      if (cell.imageUrl) {
        counts.set(cell.imageUrl, (counts.get(cell.imageUrl) || 0) + 1);
      }
    }
    return counts;
  }, [allPagesPhotoMap, currentPageId, cells]);

  const placedPhotoUrls = useMemo(() => new Set(placedPhotoCounts.keys()), [placedPhotoCounts]);

  /* ─── Load Album ─── */

  useEffect(() => {
    if (!albumId || !user) return;
    (async () => {
      setLoading(true);
      const { data: albumData, error } = await supabase
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .single();

      if (error || !albumData) {
        toast.error("Album not found");
        navigate("/dashboard/album-designer");
        return;
      }

      setAlbum({
        id: albumData.id,
        name: albumData.name,
        size: albumData.size as AlbumSize,
        cover_type: albumData.cover_type,
        leaf_count: albumData.leaf_count,
        page_count: albumData.page_count,
        status: albumData.status as AlbumStatus,
        share_token: albumData.share_token,
        event_id: albumData.event_id,
        created_at: albumData.created_at,
        updated_at: albumData.updated_at,
      });

      const { data: pagesData } = await supabase
        .from("album_pages")
        .select("id, page_number, spread_index, background_color, paper_texture")
        .eq("album_id", albumId)
        .order("page_number", { ascending: true });

      const ps: PageSlot[] = (pagesData || []).map((p) => ({
        id: p.id,
        pageNumber: p.page_number,
        spreadIndex: p.spread_index,
      }));
      setPages(ps);

      if (ps.length > 0) {
        setCurrentPageId(ps[0].id);
        if (pagesData?.[0]) {
          setBgColor(pagesData[0].background_color || "#ffffff");
          setPaperTexture(pagesData[0].paper_texture || "white");
        }
      }
      setLoading(false);
    })();
  }, [albumId, user, navigate]);

  /* ─── Load All Layers for Album-Wide Tracking (Bug 6) ─── */

  useEffect(() => {
    if (pages.length === 0) return;
    (async () => {
      const pageIds = pages.map((p) => p.id);
      const { data } = await supabase
        .from("album_layers")
        .select("page_id,settings_json,layer_type")
        .in("page_id", pageIds)
        .eq("layer_type", "photo");

      const photoMap = new Map<string, string[]>();
      const thumbs = new Map<string, string>();

      for (const l of data || []) {
        const s = l.settings_json as Record<string, any> | null;
        if (!s?.imageUrl) continue;
        if (!photoMap.has(l.page_id)) photoMap.set(l.page_id, []);
        photoMap.get(l.page_id)!.push(s.imageUrl);
        if (!thumbs.has(l.page_id)) thumbs.set(l.page_id, s.imageUrl);
      }

      setAllPagesPhotoMap(photoMap);
      setPageThumbnails(thumbs);
    })();
  }, [pages]);

  /* ─── Load Layers on Page Change ─── */

  useEffect(() => {
    if (!currentPageId) return;
    (async () => {
      const { data: layers } = await supabase
        .from("album_layers")
        .select("*")
        .eq("page_id", currentPageId)
        .order("z_index", { ascending: true });

      const { data: pageData } = await supabase
        .from("album_pages")
        .select("background_color, paper_texture")
        .eq("id", currentPageId)
        .single();

      if (pageData) {
        setBgColor(pageData.background_color || "#ffffff");
        setPaperTexture(pageData.paper_texture || "white");
      }

      if (!layers || layers.length === 0) {
        setLayout(DEFAULT_LAYOUT);
        setCells(createCellsForLayout(DEFAULT_LAYOUT));
        setTextLayers([]);
        return;
      }

      const photoLayers = layers.filter((l) => l.layer_type === "photo");
      const textLayerRecords = layers.filter((l) => l.layer_type === "text");

      const settings = photoLayers[0]?.settings_json as Record<string, any> | null;
      const savedLayout = settings?.layout;
      const activeLayout: GridLayout = savedLayout
        ? { ...DEFAULT_LAYOUT, ...savedLayout }
        : DEFAULT_LAYOUT;
      setLayout(activeLayout);

      const newCells = createCellsForLayout(activeLayout);
      photoLayers.forEach((pl, i) => {
        const plSettings = pl.settings_json as Record<string, any> | null;
        if (i < newCells.length && plSettings?.imageUrl) {
          newCells[i] = {
            ...newCells[i],
            imageUrl: plSettings.imageUrl,
            offsetX: plSettings.offsetX || 0,
            offsetY: plSettings.offsetY || 0,
            scale: plSettings.scale || 1,
          };
        }
      });
      setCells(newCells);

      const restoredText: TextLayer[] = textLayerRecords.map((tl) => {
        const tlSettings = tl.settings_json as Record<string, any> | null;
        return {
          ...createTextLayer(),
          ...tlSettings,
          id: tl.id,
          text: tl.text_content || "Text",
          x: tl.x,
          y: tl.y,
        };
      });
      setTextLayers(restoredText);
    })();
  }, [currentPageId]);

  /* ─── Save ─── */

  const saveLayers = useCallback(async () => {
    const pageId = currentPageIdRef.current;
    if (!pageId) return;
    setSaveStatus("saving");
    try {
      await supabase.from("album_layers").delete().eq("page_id", pageId);

      const currentCells = cellsRef.current;
      const currentTextLayers = textLayersRef.current;
      const currentLayout = layoutRef.current;

      const layersToInsert: Array<{
        page_id: string;
        layer_type: string;
        photo_id: string | null;
        text_content: string | null;
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        z_index: number;
        settings_json: Record<string, any>;
      }> = [];

      currentCells.forEach((cell, i) => {
        layersToInsert.push({
          page_id: pageId,
          layer_type: "photo",
          photo_id: null,
          text_content: null,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
          z_index: i,
          settings_json: {
            imageUrl: cell.imageUrl,
            offsetX: cell.offsetX,
            offsetY: cell.offsetY,
            scale: cell.scale,
            layout: {
              gridCols: currentLayout.gridCols,
              gridRows: currentLayout.gridRows,
              cells: currentLayout.cells,
            },
          },
        });
      });

      currentTextLayers.forEach((tl, i) => {
        layersToInsert.push({
          page_id: pageId,
          layer_type: "text",
          photo_id: null,
          text_content: tl.text,
          x: tl.x,
          y: tl.y,
          width: 100,
          height: 100,
          rotation: tl.rotation,
          z_index: 100 + i,
          settings_json: { ...tl },
        });
      });

      if (layersToInsert.length > 0) {
        await supabase.from("album_layers").insert(layersToInsert);
      }

      await supabase
        .from("album_pages")
        .update({
          background_color: bgColorRef.current,
          paper_texture: paperTextureRef.current,
        })
        .eq("id", pageId);

      dirtyRef.current = false;
      setSaveStatus("saved");

      // Update album-wide tracking after save
      const urls = currentCells.filter((c) => c.imageUrl).map((c) => c.imageUrl!);
      setAllPagesPhotoMap((prev) => {
        const n = new Map(prev);
        n.set(pageId, urls);
        return n;
      });
      if (urls.length > 0) {
        setPageThumbnails((prev) => {
          const n = new Map(prev);
          n.set(pageId, urls[0]);
          return n;
        });
      } else {
        setPageThumbnails((prev) => {
          const n = new Map(prev);
          n.delete(pageId);
          return n;
        });
      }
    } catch (e) {
      console.error("Save failed", e);
      setSaveStatus("unsaved");
      toast.error("Failed to save changes");
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (dirtyRef.current) saveLayers();
    }, 2000);
  }, [saveLayers]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus("unsaved");
    scheduleSave();
  }, [scheduleSave]);

  /* ─── Undo/Redo ─── */

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-20),
      { cells: [...cells], textLayers: [...textLayers], layout },
    ]);
    setRedoStack([]);
  }, [cells, textLayers, layout]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, { cells: [...cells], textLayers: [...textLayers], layout }]);
    setUndoStack((s) => s.slice(0, -1));
    setCells(prev.cells);
    setTextLayers(prev.textLayers);
    setLayout(prev.layout);
    markDirty();
  }, [undoStack, cells, textLayers, layout, markDirty]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, { cells: [...cells], textLayers: [...textLayers], layout }]);
    setRedoStack((r) => r.slice(0, -1));
    setCells(next.cells);
    setTextLayers(next.textLayers);
    setLayout(next.layout);
    markDirty();
  }, [redoStack, cells, textLayers, layout, markDirty]);

  /* ─── Actions ─── */

  const updateCells = useCallback(
    (newCells: GridCellData[]) => {
      pushUndo();
      setCells(newCells);
      markDirty();
    },
    [pushUndo, markDirty]
  );

  const updateTextLayers = useCallback(
    (layers: TextLayer[]) => {
      pushUndo();
      setTextLayers(layers);
      markDirty();
    },
    [pushUndo, markDirty]
  );

  const addTextLayer = useCallback(
    (layer: TextLayer) => {
      pushUndo();
      setTextLayers((prev) => [...prev, layer]);
      setSelectedTextId(layer.id);
      markDirty();
    },
    [pushUndo, markDirty]
  );

  const updateText = useCallback(
    (id: string, patch: Partial<TextLayer>) => {
      pushUndo();
      setTextLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
      markDirty();
    },
    [pushUndo, markDirty]
  );

  const deleteText = useCallback(
    (id: string) => {
      pushUndo();
      setTextLayers((prev) => prev.filter((l) => l.id !== id));
      setSelectedTextId(null);
      markDirty();
    },
    [pushUndo, markDirty]
  );

  const applyTemplate = useCallback(
    (partial: Partial<GridLayout>) => {
      pushUndo();
      const newLayout: GridLayout = {
        ...DEFAULT_LAYOUT,
        ...partial,
        id: partial.cells ? `template-${partial.cells.length}` : DEFAULT_LAYOUT.id,
        name: "Custom",
      };
      setLayout(newLayout);
      setCells(createCellsForLayout(newLayout));
      markDirty();
    },
    [pushUndo, markDirty]
  );

  const dropPhoto = useCallback(
    (photo: { url: string }, cellIndex: number) => {
      pushUndo();
      setCells((prev) => {
        const newCells = [...prev];
        if (cellIndex < newCells.length) {
          newCells[cellIndex] = {
            ...newCells[cellIndex],
            imageUrl: photo.url,
            file: null,
            offsetX: 0,
            offsetY: 0,
            scale: 1,
          };
        }
        return newCells;
      });
      markDirty();
    },
    [pushUndo, markDirty]
  );

  /* ─── Bug 7: Place Photo File with Upload ─── */

  const placePhotoFile = useCallback(
    async (index: number, file: File) => {
      if (!user || !album) return;
      const blobUrl = URL.createObjectURL(file);
      pushUndo();
      setCells((prev) => {
        const c = [...prev];
        if (index < c.length)
          c[index] = { ...c[index], imageUrl: blobUrl, file, offsetX: 0, offsetY: 0, scale: 1 };
        return c;
      });
      markDirty();

      setUploadingCells((prev) => new Set(prev).add(index));
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/albums/${album.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("gallery-photos")
          .upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
        URL.revokeObjectURL(blobUrl);
        setCells((prev) => {
          const c = [...prev];
          if (c[index]?.imageUrl === blobUrl)
            c[index] = { ...c[index], imageUrl: data.publicUrl, file: null };
          return c;
        });
        markDirty();
      } catch (e) {
        console.error("Upload failed", e);
        toast.error("Failed to upload photo");
      } finally {
        setUploadingCells((prev) => {
          const n = new Set(prev);
          n.delete(index);
          return n;
        });
      }
    },
    [user, album, pushUndo, markDirty]
  );

  const updateAlbumName = useCallback(
    async (name: string) => {
      if (!album) return;
      setAlbum({ ...album, name });
      await supabase.from("albums").update({ name }).eq("id", album.id);
    },
    [album]
  );

  const updateBgColor = useCallback(
    (c: string) => {
      setBgColor(c);
      markDirty();
    },
    [markDirty]
  );

  const updatePaperTexture = useCallback(
    (t: string) => {
      setPaperTexture(t);
      markDirty();
    },
    [markDirty]
  );

  /* ─── Page Management ─── */

  const addPage = useCallback(async () => {
    if (!album) return;
    const maxPageNum = Math.max(...pages.map((p) => p.pageNumber), 0);
    const newPageNum = maxPageNum + 1;
    const { data } = await supabase
      .from("album_pages")
      .insert({
        album_id: album.id,
        page_number: newPageNum,
        spread_index: Math.ceil(newPageNum / 2),
      })
      .select()
      .single();

    if (data) {
      setPages((prev) => [
        ...prev,
        { id: data.id, pageNumber: data.page_number, spreadIndex: data.spread_index },
      ]);
      toast.success(`Page ${newPageNum} added`);
    }
  }, [album, pages]);

  const duplicatePage = useCallback(
    async (pageId: string) => {
      if (!album) return;
      const maxPageNum = Math.max(...pages.map((p) => p.pageNumber), 0) + 1;

      const { data: srcPage } = await supabase
        .from("album_pages")
        .select("background_color, paper_texture")
        .eq("id", pageId)
        .single();

      const { data: newPage } = await supabase
        .from("album_pages")
        .insert({
          album_id: album.id,
          page_number: maxPageNum,
          spread_index: Math.ceil(maxPageNum / 2),
          background_color: srcPage?.background_color || "#ffffff",
          paper_texture: srcPage?.paper_texture || "white",
        })
        .select()
        .single();

      if (newPage) {
        const { data: srcLayers } = await supabase
          .from("album_layers")
          .select(
            "layer_type, photo_id, text_content, x, y, width, height, rotation, z_index, settings_json"
          )
          .eq("page_id", pageId)
          .order("z_index", { ascending: true });

        if (srcLayers && srcLayers.length > 0) {
          const copiedLayers = srcLayers.map((l) => ({
            page_id: newPage.id,
            layer_type: l.layer_type,
            photo_id: l.photo_id,
            text_content: l.text_content,
            x: l.x,
            y: l.y,
            width: l.width,
            height: l.height,
            rotation: l.rotation,
            z_index: l.z_index,
            settings_json: l.settings_json,
          }));
          await supabase.from("album_layers").insert(copiedLayers);
        }

        setPages((prev) => [
          ...prev,
          { id: newPage.id, pageNumber: newPage.page_number, spreadIndex: newPage.spread_index },
        ]);
        toast.success("Page duplicated");
      }
    },
    [album, pages]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      await supabase.from("album_layers").delete().eq("page_id", pageId);
      await supabase.from("album_pages").delete().eq("id", pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
      if (currentPageId === pageId && pages.length > 1) {
        const remaining = pages.filter((p) => p.id !== pageId);
        setCurrentPageId(remaining[0]?.id || null);
      }
      toast.success("Page deleted");
    },
    [currentPageId, pages]
  );

  const selectPage = useCallback(
    (pageId: string) => {
      if (dirtyRef.current) saveLayers();
      setCurrentPageId(pageId);
    },
    [saveLayers]
  );

  /* ─── Page Reorder ─── */

  const reorderPages = useCallback(
    async (draggedPageId: string, targetIndex: number) => {
      const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
      const nonCover = sorted.filter((p) => p.pageNumber > 0);
      const cover = sorted.find((p) => p.pageNumber === 0);
      const fromIdx = nonCover.findIndex((p) => p.id === draggedPageId);
      if (fromIdx === -1 || fromIdx === targetIndex) return;
      const reordered = [...nonCover];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(targetIndex, 0, moved);
      const updated = reordered.map((p, i) => ({
        ...p,
        pageNumber: i + 1,
        spreadIndex: Math.ceil((i + 1) / 2),
      }));
      setPages(cover ? [cover, ...updated] : [...updated]);
      for (const u of updated) {
        await supabase
          .from("album_pages")
          .update({ page_number: u.pageNumber, spread_index: u.spreadIndex })
          .eq("id", u.id);
      }
    },
    [pages]
  );

  /* ─── Status Workflow ─── */

  const updateStatus = useCallback(
    async (newStatus: AlbumStatus) => {
      if (!album) return;
      const updates: { status: string; share_token?: string } = { status: newStatus };

      if (newStatus === "review" && !album.share_token) {
        const token = crypto.randomUUID();
        updates.share_token = token;
        setAlbum({ ...album, status: newStatus, share_token: token });
        await supabase.from("albums").update(updates).eq("id", album.id);
        const url = `${window.location.origin}/album-preview/${token}`;
        await navigator.clipboard.writeText(url);
        toast.success("Review link copied to clipboard!");
        return;
      }

      setAlbum({ ...album, status: newStatus });
      await supabase.from("albums").update(updates).eq("id", album.id);
      toast.success(`Status updated to ${newStatus}`);
    },
    [album]
  );

  const getShareLink = useCallback(async (): Promise<string> => {
    if (!album) return "";
    let token = album.share_token;
    if (!token) {
      token = crypto.randomUUID();
      await supabase.from("albums").update({ share_token: token }).eq("id", album.id);
      setAlbum({ ...album, share_token: token });
    }
    const url = `${window.location.origin}/album-preview/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Preview link copied!");
    return url;
  }, [album]);

  const linkEvent = useCallback(
    (eventId: string) => {
      if (!album) return;
      setAlbum({ ...album, event_id: eventId });
    },
    [album]
  );

  const reloadPages = useCallback(async () => {
    if (!albumId) return;
    const { data: pagesData } = await supabase
      .from("album_pages")
      .select("id, page_number, spread_index")
      .eq("album_id", albumId)
      .order("page_number", { ascending: true });

    const ps: PageSlot[] = (pagesData || []).map((p) => ({
      id: p.id,
      pageNumber: p.page_number,
      spreadIndex: p.spread_index,
    }));
    setPages(ps);
    if (ps.length > 0) setCurrentPageId(ps[0].id);
  }, [albumId]);

  /* ─── Keyboard Shortcuts ─── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        }
        if (e.key === "y") {
          e.preventDefault();
          redo();
        }
        if (e.key === "s") {
          e.preventDefault();
          saveLayers();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, saveLayers]);

  /* ─── Navigate Back ─── */

  const goBack = useCallback(() => {
    if (dirtyRef.current) saveLayers();
    navigate("/dashboard/album-designer");
  }, [saveLayers, navigate]);

  return {
    // Data
    album,
    pages,
    currentPageId,
    currentPageNumber,
    currentSpreadIndex,
    layout,
    cells,
    textLayers,
    selectedTextId,
    loading,

    // View
    spreadView,
    zoom,
    showBleed,
    showSafeMargin,
    showSpine,
    bgColor,
    paperTexture,
    saveStatus,

    // Undo/redo
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undo,
    redo,

    // Computed
    placedPhotoUrls,
    placedPhotoCounts,

    // Actions
    updateCells,
    updateTextLayers,
    addTextLayer,
    updateText,
    deleteText,
    applyTemplate,
    dropPhoto,
    updateAlbumName,
    updateBgColor,
    updatePaperTexture,
    setSelectedTextId,
    setSpreadView,
    setZoom,
    setShowBleed: (v: boolean) => setShowBleed(v),
    setShowSafeMargin: (v: boolean) => setShowSafeMargin(v),
    setShowSpine: (v: boolean) => setShowSpine(v),
    saveLayers,

    // Page management
    addPage,
    duplicatePage,
    deletePage,
    selectPage,
    reorderPages,

    // Status/sharing
    updateStatus,
    getShareLink,
    linkEvent,
    reloadPages,
    goBack,

    // Bug 7: Upload
    placePhotoFile,
    uploadingCells,

    // Thumbnails
    pageThumbnails,
  };
}
