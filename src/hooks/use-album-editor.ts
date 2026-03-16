import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { AlbumSize, AlbumStatus, SpreadFrame, LayoutPreset } from "@/components/album-designer/types";
import { createFrame, ALBUM_PRESETS } from "@/components/album-designer/types";

/* ─── Types ─── */

export interface SpreadSlot {
  id: string;
  spreadIndex: number;
  pageNumber: number;
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

/* ─── Hook ─── */

export function useAlbumEditor(albumId: string | undefined) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [spreads, setSpreads] = useState<SpreadSlot[]>([]);
  const [currentSpreadId, setCurrentSpreadId] = useState<string | null>(null);
  const [frames, setFrames] = useState<SpreadFrame[]>([]);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // View state
  const [zoom, setZoom] = useState(100);
  const [showBleed, setShowBleed] = useState(false);
  const [showSafeMargin, setShowSafeMargin] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [paperTexture, setPaperTexture] = useState("white");

  // Save state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  // Mobile tap-to-place state
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);

  // Album-wide photo tracking
  const [allSpreadsPhotoMap, setAllSpreadsPhotoMap] = useState<Map<string, string[]>>(new Map());
  const [spreadThumbnails, setSpreadThumbnails] = useState<Map<string, string>>(new Map());
  const [uploadingCells, setUploadingCells] = useState<Set<number>>(new Set());

  // Undo/redo
  const [undoStack, setUndoStack] = useState<SpreadFrame[][]>([]);
  const [redoStack, setRedoStack] = useState<SpreadFrame[][]>([]);

  // Refs for save closure
  const framesRef = useRef(frames);
  const bgColorRef = useRef(bgColor);
  const paperTextureRef = useRef(paperTexture);
  const currentSpreadIdRef = useRef(currentSpreadId);
  const currentPresetIdRef = useRef(currentPresetId);
  framesRef.current = frames;
  bgColorRef.current = bgColor;
  paperTextureRef.current = paperTexture;
  currentSpreadIdRef.current = currentSpreadId;
  currentPresetIdRef.current = currentPresetId;

  // Computed
  const currentSpread = spreads.find(s => s.id === currentSpreadId);
  const currentSpreadIndex = currentSpread?.spreadIndex ?? 0;
  const currentPageNumber = currentSpread?.pageNumber ?? 0;

  // Photo tracking
  const placedPhotoCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [spreadId, urls] of allSpreadsPhotoMap) {
      if (spreadId === currentSpreadId) continue;
      for (const url of urls) {
        if (url) counts.set(url, (counts.get(url) || 0) + 1);
      }
    }
    for (const frame of frames) {
      if (frame.imageUrl) counts.set(frame.imageUrl, (counts.get(frame.imageUrl) || 0) + 1);
    }
    return counts;
  }, [allSpreadsPhotoMap, currentSpreadId, frames]);

  const placedPhotoUrls = useMemo(() => new Set(placedPhotoCounts.keys()), [placedPhotoCounts]);

  /* ─── Load Album ─── */

  useEffect(() => {
    if (!albumId || !user) return;
    (async () => {
      setLoading(true);
      const { data: albumData, error } = await supabase
        .from("albums").select("*").eq("id", albumId).single();

      if (error || !albumData) {
        toast.error("Album not found");
        navigate("/dashboard/album-designer");
        return;
      }

      // Map old sizes to new if needed
      let albumSize = albumData.size as AlbumSize;
      const validSizes: AlbumSize[] = ["12x36", "12x24", "10x30", "10x24", "8x24"];
      if (!validSizes.includes(albumSize)) albumSize = "12x36";

      setAlbum({
        id: albumData.id, name: albumData.name, size: albumSize,
        cover_type: albumData.cover_type, leaf_count: albumData.leaf_count,
        page_count: albumData.page_count, status: albumData.status as AlbumStatus,
        share_token: albumData.share_token, event_id: albumData.event_id,
        created_at: albumData.created_at, updated_at: albumData.updated_at,
      });

      const { data: pagesData } = await supabase
        .from("album_pages").select("id, page_number, spread_index, background_color, paper_texture")
        .eq("album_id", albumId).order("page_number", { ascending: true });

      const ss: SpreadSlot[] = (pagesData || []).map(p => ({
        id: p.id, pageNumber: p.page_number, spreadIndex: p.spread_index,
      }));
      setSpreads(ss);

      if (ss.length > 0) {
        setCurrentSpreadId(ss[0].id);
        if (pagesData?.[0]) {
          setBgColor(pagesData[0].background_color || "#ffffff");
          setPaperTexture(pagesData[0].paper_texture || "white");
        }
      }
      setLoading(false);
    })();
  }, [albumId, user, navigate]);

  /* ─── Load All Layers for tracking ─── */

  useEffect(() => {
    if (spreads.length === 0) return;
    (async () => {
      const ids = spreads.map(s => s.id);
      const { data } = await supabase.from("album_layers")
        .select("page_id,settings_json,layer_type").in("page_id", ids).eq("layer_type", "photo");

      const photoMap = new Map<string, string[]>();
      const thumbs = new Map<string, string>();
      for (const l of data || []) {
        const s = l.settings_json as Record<string, any> | null;
        if (!s?.imageUrl) continue;
        if (!photoMap.has(l.page_id)) photoMap.set(l.page_id, []);
        photoMap.get(l.page_id)!.push(s.imageUrl);
        if (!thumbs.has(l.page_id)) thumbs.set(l.page_id, s.imageUrl);
      }
      setAllSpreadsPhotoMap(photoMap);
      setSpreadThumbnails(thumbs);
    })();
  }, [spreads]);

  /* ─── Load Frames on Spread Change ─── */

  useEffect(() => {
    if (!currentSpreadId) return;
    (async () => {
      const { data: layers } = await supabase.from("album_layers")
        .select("*").eq("page_id", currentSpreadId).order("z_index", { ascending: true });

      const { data: pageData } = await supabase.from("album_pages")
        .select("background_color, paper_texture").eq("id", currentSpreadId).single();

      if (pageData) {
        setBgColor(pageData.background_color || "#ffffff");
        setPaperTexture(pageData.paper_texture || "white");
      }

      if (!layers || layers.length === 0) {
        setFrames([]);
        setCurrentPresetId(null);
        return;
      }

      const photoLayers = layers.filter(l => l.layer_type === "photo");
      const restoredFrames: SpreadFrame[] = photoLayers.map(pl => {
        const s = pl.settings_json as Record<string, any> | null;
        return createFrame({
          id: pl.id,
          x: s?.x ?? 0, y: s?.y ?? 0,
          w: s?.w ?? 100, h: s?.h ?? 100,
          imageUrl: s?.imageUrl || null,
          panX: s?.panX || 0, panY: s?.panY || 0,
          zoom: s?.zoom || 1, rotation: pl.rotation || 0,
        });
      });
      setFrames(restoredFrames);
      const firstSettings = photoLayers[0]?.settings_json as Record<string, any> | null;
      setCurrentPresetId(firstSettings?.presetId || null);
    })();
  }, [currentSpreadId]);

  /* ─── Save ─── */

  const saveLayers = useCallback(async () => {
    const spreadId = currentSpreadIdRef.current;
    if (!spreadId || savingRef.current) return;
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      await supabase.from("album_layers").delete().eq("page_id", spreadId);

      const currentFrames = framesRef.current;
      const layersToInsert = currentFrames.map((frame, i) => ({
        page_id: spreadId,
        layer_type: "photo",
        photo_id: null,
        text_content: null,
        x: Math.round(frame.x * 100) / 100,
        y: Math.round(frame.y * 100) / 100,
        width: Math.round(frame.w * 100) / 100,
        height: Math.round(frame.h * 100) / 100,
        rotation: frame.rotation,
        z_index: i,
        settings_json: {
          x: frame.x, y: frame.y, w: frame.w, h: frame.h,
          imageUrl: frame.imageUrl,
          panX: frame.panX, panY: frame.panY,
          zoom: frame.zoom,
          presetId: currentPresetIdRef.current,
        },
      }));

      if (layersToInsert.length > 0) {
        await supabase.from("album_layers").insert(layersToInsert);
      }

      await supabase.from("album_pages").update({
        background_color: bgColorRef.current,
        paper_texture: paperTextureRef.current,
      }).eq("id", spreadId);

      dirtyRef.current = false;
      setSaveStatus("saved");

      const urls = currentFrames.filter(f => f.imageUrl).map(f => f.imageUrl!);
      setAllSpreadsPhotoMap(prev => { const n = new Map(prev); n.set(spreadId, urls); return n; });
      if (urls.length > 0) {
        setSpreadThumbnails(prev => { const n = new Map(prev); n.set(spreadId, urls[0]); return n; });
      }
    } catch (e) {
      console.error("Save failed", e);
      setSaveStatus("unsaved");
      toast.error("Failed to save changes");
    } finally {
      savingRef.current = false;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (dirtyRef.current) saveLayers(); }, 2000);
  }, [saveLayers]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus("unsaved");
    scheduleSave();
  }, [scheduleSave]);

  /* ─── Bug 1 Fix: beforeunload + unmount save ─── */

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save on unmount
      if (dirtyRef.current) {
        saveLayers();
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [saveLayers]);

  /* ─── Undo/Redo ─── */

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-20), [...frames]]);
    setRedoStack([]);
  }, [frames]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    setRedoStack(r => [...r, [...frames]]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setFrames(prev);
    markDirty();
  }, [undoStack, frames, markDirty]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    setUndoStack(s => [...s, [...frames]]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setFrames(next);
    markDirty();
  }, [redoStack, frames, markDirty]);

  /* ─── Actions ─── */

  const updateFrames = useCallback((newFrames: SpreadFrame[]) => {
    pushUndo();
    setFrames(newFrames);
    markDirty();
  }, [pushUndo, markDirty]);

  const applyPreset = useCallback((preset: LayoutPreset) => {
    pushUndo();
    const newFrames = preset.frames.map((f, i) => {
      const existing = frames[i];
      return createFrame({
        ...f,
        imageUrl: existing?.imageUrl || null,
        panX: 0, panY: 0, zoom: 1,
      });
    });
    setFrames(newFrames);
    setCurrentPresetId(preset.id);
    markDirty();
  }, [frames, pushUndo, markDirty]);

  const dropPhoto = useCallback((photo: { url: string }, frameIndex: number) => {
    pushUndo();
    setFrames(prev => {
      const n = [...prev];
      if (frameIndex < n.length) {
        n[frameIndex] = { ...n[frameIndex], imageUrl: photo.url, panX: 0, panY: 0, zoom: 1 };
      }
      return n;
    });
    markDirty();
  }, [pushUndo, markDirty]);

  /* ─── Bug 7 Fix: Tap-to-place for mobile ─── */

  const selectPhotoForPlacement = useCallback((url: string) => {
    setPendingPhotoUrl(url);
    toast.info("Tap a frame to place this photo", { duration: 3000 });
  }, []);

  const placePhotoInFrame = useCallback((frameIndex: number) => {
    if (!pendingPhotoUrl) return false;
    pushUndo();
    setFrames(prev => {
      const n = [...prev];
      if (frameIndex < n.length) {
        n[frameIndex] = { ...n[frameIndex], imageUrl: pendingPhotoUrl, panX: 0, panY: 0, zoom: 1 };
      }
      return n;
    });
    markDirty();
    setPendingPhotoUrl(null);
    toast.success("Photo placed");
    return true;
  }, [pendingPhotoUrl, pushUndo, markDirty]);

  const cancelPhotoPlacement = useCallback(() => {
    setPendingPhotoUrl(null);
  }, []);

  const placePhotoFile = useCallback(async (index: number, file: File) => {
    if (!user || !album) return;
    const blobUrl = URL.createObjectURL(file);
    pushUndo();
    setFrames(prev => {
      const c = [...prev];
      if (index < c.length) c[index] = { ...c[index], imageUrl: blobUrl, panX: 0, panY: 0, zoom: 1 };
      return c;
    });
    markDirty();

    setUploadingCells(prev => new Set(prev).add(index));
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/albums/${album.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("gallery-photos").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("gallery-photos").getPublicUrl(path);
      URL.revokeObjectURL(blobUrl);
      setFrames(prev => {
        const c = [...prev];
        if (c[index]?.imageUrl === blobUrl) c[index] = { ...c[index], imageUrl: data.publicUrl };
        return c;
      });
      markDirty();
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingCells(prev => { const n = new Set(prev); n.delete(index); return n; });
    }
  }, [user, album, pushUndo, markDirty]);

  const updateAlbumName = useCallback(async (name: string) => {
    if (!album) return;
    setAlbum({ ...album, name });
    await supabase.from("albums").update({ name }).eq("id", album.id);
  }, [album]);

  const updateBgColor = useCallback((c: string) => { setBgColor(c); markDirty(); }, [markDirty]);
  const updatePaperTexture = useCallback((t: string) => { setPaperTexture(t); markDirty(); }, [markDirty]);

  /* ─── Spread Management ─── */

  const addSpread = useCallback(async () => {
    if (!album) return;
    const maxIdx = Math.max(...spreads.map(s => s.spreadIndex), 0);
    const newIdx = maxIdx + 1;
    const { data } = await supabase.from("album_pages").insert({
      album_id: album.id, page_number: newIdx, spread_index: newIdx,
    }).select().single();
    if (data) {
      setSpreads(prev => [...prev, { id: data.id, pageNumber: data.page_number, spreadIndex: data.spread_index }]);
      toast.success(`Spread ${newIdx} added`);
    }
  }, [album, spreads]);

  const duplicateSpread = useCallback(async (spreadId: string) => {
    if (!album) return;
    const maxIdx = Math.max(...spreads.map(s => s.spreadIndex), 0) + 1;

    const { data: srcPage } = await supabase.from("album_pages")
      .select("background_color, paper_texture").eq("id", spreadId).single();
    const { data: newPage } = await supabase.from("album_pages").insert({
      album_id: album.id, page_number: maxIdx, spread_index: maxIdx,
      background_color: srcPage?.background_color || "#ffffff",
      paper_texture: srcPage?.paper_texture || "white",
    }).select().single();

    if (newPage) {
      const { data: srcLayers } = await supabase.from("album_layers")
        .select("layer_type, photo_id, text_content, x, y, width, height, rotation, z_index, settings_json")
        .eq("page_id", spreadId).order("z_index", { ascending: true });
      if (srcLayers?.length) {
        await supabase.from("album_layers").insert(srcLayers.map(l => ({ ...l, page_id: newPage.id })));
      }
      setSpreads(prev => [...prev, { id: newPage.id, pageNumber: newPage.page_number, spreadIndex: newPage.spread_index }]);
      toast.success("Spread duplicated");
    }
  }, [album, spreads]);

  const deleteSpread = useCallback(async (spreadId: string) => {
    await supabase.from("album_layers").delete().eq("page_id", spreadId);
    await supabase.from("album_pages").delete().eq("id", spreadId);
    setSpreads(prev => prev.filter(s => s.id !== spreadId));
    if (currentSpreadId === spreadId && spreads.length > 1) {
      const remaining = spreads.filter(s => s.id !== spreadId);
      setCurrentSpreadId(remaining[0]?.id || null);
    }
    toast.success("Spread deleted");
  }, [currentSpreadId, spreads]);

  const selectSpread = useCallback((spreadId: string) => {
    if (dirtyRef.current) saveLayers();
    setCurrentSpreadId(spreadId);
  }, [saveLayers]);

  const reorderSpreads = useCallback(async (draggedId: string, targetIndex: number) => {
    const sorted = [...spreads].sort((a, b) => a.spreadIndex - b.spreadIndex);
    const nonCover = sorted.filter(s => s.spreadIndex > 0);
    const cover = sorted.find(s => s.spreadIndex === 0);
    const fromIdx = nonCover.findIndex(s => s.id === draggedId);
    if (fromIdx === -1 || fromIdx === targetIndex) return;
    const reordered = [...nonCover];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(targetIndex, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, spreadIndex: i + 1, pageNumber: i + 1 }));
    setSpreads(cover ? [cover, ...updated] : [...updated]);
    for (const u of updated) {
      await supabase.from("album_pages")
        .update({ page_number: u.pageNumber, spread_index: u.spreadIndex }).eq("id", u.id);
    }
  }, [spreads]);

  /* ─── Status Workflow ─── */

  const updateStatus = useCallback(async (newStatus: AlbumStatus) => {
    if (!album) return;
    const updates: { status: string; share_token?: string } = { status: newStatus };
    if (newStatus === "review" && !album.share_token) {
      const token = crypto.randomUUID();
      updates.share_token = token;
      setAlbum({ ...album, status: newStatus, share_token: token });
      await supabase.from("albums").update(updates).eq("id", album.id);
      const url = `${window.location.origin}/album-preview/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Review link copied!");
      return;
    }
    setAlbum({ ...album, status: newStatus });
    await supabase.from("albums").update(updates).eq("id", album.id);
    toast.success(`Status updated to ${newStatus}`);
  }, [album]);

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

  const linkEvent = useCallback((eventId: string) => {
    if (!album) return;
    setAlbum({ ...album, event_id: eventId });
  }, [album]);

  const reloadSpreads = useCallback(async () => {
    if (!albumId) return;
    const { data } = await supabase.from("album_pages")
      .select("id, page_number, spread_index").eq("album_id", albumId)
      .order("page_number", { ascending: true });
    const ss: SpreadSlot[] = (data || []).map(p => ({
      id: p.id, pageNumber: p.page_number, spreadIndex: p.spread_index,
    }));
    setSpreads(ss);
    if (ss.length > 0) setCurrentSpreadId(ss[0].id);
  }, [albumId]);

  /* ─── Keyboard Shortcuts ─── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); }
        if (e.key === "y") { e.preventDefault(); redo(); }
        if (e.key === "s") { e.preventDefault(); saveLayers(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, saveLayers]);

  /* ─── Bug 1 Fix: goBack saves immediately and waits ─── */

  const goBack = useCallback(async () => {
    if (dirtyRef.current) {
      await saveLayers();
    }
    navigate("/dashboard/album-designer");
  }, [saveLayers, navigate]);

  const spreadLabel = currentSpread
    ? currentSpread.spreadIndex === 0 ? "Cover Spread" : `Spread ${currentSpread.spreadIndex}`
    : "";

  return {
    album, spreads, currentSpreadId, currentSpreadIndex, currentPageNumber,
    frames, currentPresetId, loading,
    zoom, showBleed, showSafeMargin, showGrid, bgColor, paperTexture, saveStatus,
    canUndo: undoStack.length > 0, canRedo: redoStack.length > 0, undo, redo,
    placedPhotoUrls, placedPhotoCounts, spreadLabel,
    updateFrames, applyPreset, dropPhoto, updateAlbumName,
    updateBgColor, updatePaperTexture,
    setZoom, setShowBleed: (v: boolean) => setShowBleed(v),
    setShowSafeMargin: (v: boolean) => setShowSafeMargin(v),
    setShowGrid: (v: boolean) => setShowGrid(v),
    saveLayers,
    addSpread, duplicateSpread, deleteSpread, selectSpread, reorderSpreads,
    updateStatus, getShareLink, linkEvent, reloadSpreads, goBack,
    placePhotoFile, uploadingCells, spreadThumbnails,
    // Bug 7: tap-to-place
    pendingPhotoUrl, selectPhotoForPlacement, placePhotoInFrame, cancelPhotoPlacement,
  };
}
