import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useAlbumEditor } from "@/hooks/use-album-editor";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import AlbumEditorToolbar from "@/components/album-designer/AlbumEditorToolbar";
import AlbumPhotoPanel from "@/components/album-designer/AlbumPhotoPanel";
import AlbumCanvas from "@/components/album-designer/AlbumCanvas";
import AlbumRightPanel from "@/components/album-designer/AlbumRightPanel";
import AlbumTimeline from "@/components/album-designer/AlbumTimeline";
const AlbumPreviewModal = lazy(() => import("@/components/album-designer/AlbumPreviewModal"));
const AlbumExportDialog = lazy(() => import("@/components/album-designer/AlbumExportDialog"));
const AlbumAutoLayoutDialog = lazy(() => import("@/components/album-designer/AlbumAutoLayoutDialog"));
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ImageIcon, Settings, Layers, ChevronLeft, ChevronRight, Wand2, LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AlbumEditorPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const editor = useAlbumEditor(albumId);
  const device = useDeviceDetect();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [autoLayoutOpen, setAutoLayoutOpen] = useState(false);
  const [photosDrawerOpen, setPhotosDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  // Keyboard shortcuts (desktop/laptop only)
  useEffect(() => {
    if (device.isPhone) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); editor.undo(); }
      if (mod && e.key === "z" && e.shiftKey) { e.preventDefault(); editor.redo(); }
      if (mod && e.key === "y") { e.preventDefault(); editor.redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [device.isPhone, editor]);

  // Bug 5 fix: spread nav via buttons only, no invisible overlays
  const handleSwipeSpread = useCallback((direction: "next" | "prev") => {
    if (!editor.spreads || editor.spreads.length === 0) return;
    const sorted = [...editor.spreads].sort((a, b) => a.spreadIndex - b.spreadIndex);
    const currentIdx = sorted.findIndex(s => s.id === editor.currentSpreadId);
    if (direction === "next" && currentIdx < sorted.length - 1) {
      editor.selectSpread(sorted[currentIdx + 1].id);
    } else if (direction === "prev" && currentIdx > 0) {
      editor.selectSpread(sorted[currentIdx - 1].id);
    }
  }, [editor]);

  if (editor.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading album editor…</p>
        </div>
      </div>
    );
  }

  if (!editor.album) return null;

  const photosPanel = (
    <AlbumPhotoPanel
      albumId={editor.album.id}
      eventId={editor.album.event_id}
      onEventLinked={editor.linkEvent}
      placedPhotoUrls={editor.placedPhotoUrls}
      placedPhotoCounts={editor.placedPhotoCounts}
      onDragStart={() => {}}
      onTapPhoto={device.isPhone ? editor.selectPhotoForPlacement : undefined}
    />
  );

  const settingsPanel = (
    <AlbumRightPanel
      currentPresetId={editor.currentPresetId}
      onApplyPreset={editor.applyPreset}
      showBleed={editor.showBleed}
      showSafeMargin={editor.showSafeMargin}
      showGrid={editor.showGrid}
      onToggleBleed={editor.setShowBleed}
      onToggleSafe={editor.setShowSafeMargin}
      onToggleGrid={editor.setShowGrid}
      bgColor={editor.bgColor}
      onBgColorChange={editor.updateBgColor}
      paperTexture={editor.paperTexture}
      onPaperTextureChange={editor.updatePaperTexture}
    />
  );

  /* ─── PHONE LAYOUT ─── */
  if (device.isPhone) {
    return (
      <div className={cn(
        "h-screen flex flex-col bg-background overflow-hidden",
        device.hasSafeArea && "pb-safe"
      )}>
        <AlbumEditorToolbar
          albumName={editor.album.name}
          onNameChange={editor.updateAlbumName}
          onBack={editor.goBack}
          zoom={editor.zoom}
          onZoomChange={editor.setZoom}
          onUndo={editor.undo}
          onRedo={editor.redo}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          saveStatus={editor.saveStatus}
          albumStatus={editor.album.status}
          onStatusChange={editor.updateStatus}
          onAutoLayout={() => setAutoLayoutOpen(true)}
          onPreview={() => setPreviewOpen(true)}
          onExport={() => setExportOpen(true)}
          showBleed={editor.showBleed}
          showGrid={editor.showGrid}
          onToggleBleed={() => editor.setShowBleed(!editor.showBleed)}
          onToggleGrid={() => editor.setShowGrid(!editor.showGrid)}
        />

        {/* Pending photo placement banner */}
        {editor.pendingPhotoUrl && (
          <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
            <span className="text-xs text-primary font-medium">Tap a frame to place photo</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={editor.cancelPhotoPlacement}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Canvas - no invisible touch overlays (Bug 5 fix) */}
        <div className="flex-1 overflow-hidden relative">
          <AlbumCanvas
            frames={editor.frames}
            onFramesChange={editor.updateFrames}
            albumSize={editor.album.size}
            zoom={editor.zoom}
            onZoomChange={editor.setZoom}
            showBleed={editor.showBleed}
            showSafeMargin={editor.showSafeMargin}
            showGrid={editor.showGrid}
            bgColor={editor.bgColor}
            onDropPhoto={(photo, idx) => {
              if (editor.pendingPhotoUrl) {
                editor.placePhotoInFrame(idx);
              } else {
                editor.dropPhoto(photo, idx);
              }
            }}
            uploadingCells={editor.uploadingCells}
            spreadLabel={editor.spreadLabel}
            enableTouchGestures
          />

          {/* Spread nav buttons only — no invisible overlays */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 z-20">
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full shadow-lg bg-card/90 backdrop-blur-xl"
              onClick={() => handleSwipeSpread("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full shadow-lg bg-card/90 backdrop-blur-xl"
              onClick={() => handleSwipeSpread("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AlbumTimeline
          spreads={editor.spreads}
          currentSpreadId={editor.currentSpreadId}
          onSelectSpread={editor.selectSpread}
          onAddSpread={editor.addSpread}
          onDuplicateSpread={editor.duplicateSpread}
          onDeleteSpread={editor.deleteSpread}
          onReorderSpread={editor.reorderSpreads}
          spreadThumbnails={editor.spreadThumbnails}
          albumSize={editor.album.size}
          compact
        />

        {/* Bottom action bar */}
        <div className={cn(
          "flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-xl shrink-0",
          device.hasSafeArea ? "pb-safe pt-2" : "py-2"
        )}>
          <BottomAction icon={<ImageIcon className="h-5 w-5" />} label="Photos" onClick={() => setPhotosDrawerOpen(true)} />
          <BottomAction icon={<LayoutGrid className="h-5 w-5" />} label="Layout" onClick={() => setSettingsDrawerOpen(true)} />
          <BottomAction icon={<Wand2 className="h-5 w-5" />} label="Auto" onClick={() => setAutoLayoutOpen(true)} />
          <BottomAction icon={<Settings className="h-5 w-5" />} label="Settings" onClick={() => setSettingsDrawerOpen(true)} />
        </div>

        <Sheet open={photosDrawerOpen} onOpenChange={setPhotosDrawerOpen}>
          <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-2xl">
            <SheetHeader className="px-4 pt-3 pb-0">
              <SheetTitle className="text-sm">Photos</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-hidden">{photosPanel}</div>
          </SheetContent>
        </Sheet>
        <Sheet open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
          <SheetContent side="bottom" className="h-[65vh] p-0 rounded-t-2xl">
            <SheetHeader className="px-4 pt-3 pb-0">
              <SheetTitle className="text-sm">Settings</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-hidden">{settingsPanel}</div>
          </SheetContent>
        </Sheet>

        {previewOpen && (
          <AlbumPreviewModal
            albumId={editor.album.id}
            albumName={editor.album.name}
            onClose={() => setPreviewOpen(false)}
            onSharePreview={editor.getShareLink}
          />
        )}
        <AlbumExportDialog open={exportOpen} onOpenChange={setExportOpen} album={editor.album} spreads={editor.spreads} onSharePreview={editor.getShareLink} />
        <AlbumAutoLayoutDialog open={autoLayoutOpen} onOpenChange={setAutoLayoutOpen} album={editor.album} onComplete={editor.reloadSpreads} />
      </div>
    );
  }

  /* ─── TABLET LAYOUT ─── */
  if (device.isTablet || device.isTouchLaptop) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <AlbumEditorToolbar
          albumName={editor.album.name}
          onNameChange={editor.updateAlbumName}
          onBack={editor.goBack}
          zoom={editor.zoom}
          onZoomChange={editor.setZoom}
          onUndo={editor.undo}
          onRedo={editor.redo}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          saveStatus={editor.saveStatus}
          albumStatus={editor.album.status}
          onStatusChange={editor.updateStatus}
          onAutoLayout={() => setAutoLayoutOpen(true)}
          onPreview={() => setPreviewOpen(true)}
          onExport={() => setExportOpen(true)}
          showBleed={editor.showBleed}
          showGrid={editor.showGrid}
          onToggleBleed={() => editor.setShowBleed(!editor.showBleed)}
          onToggleGrid={() => editor.setShowGrid(!editor.showGrid)}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="w-56 xl:w-64 shrink-0 hidden md:block">
            {photosPanel}
          </div>
          <AlbumCanvas
            frames={editor.frames}
            onFramesChange={editor.updateFrames}
            albumSize={editor.album.size}
            zoom={editor.zoom}
            onZoomChange={editor.setZoom}
            showBleed={editor.showBleed}
            showSafeMargin={editor.showSafeMargin}
            showGrid={editor.showGrid}
            bgColor={editor.bgColor}
            onDropPhoto={editor.dropPhoto}
            uploadingCells={editor.uploadingCells}
            spreadLabel={editor.spreadLabel}
            enableTouchGestures
          />
          <div className="w-56 xl:w-64 shrink-0 hidden lg:block">
            {settingsPanel}
          </div>
        </div>

        <AlbumTimeline
          spreads={editor.spreads}
          currentSpreadId={editor.currentSpreadId}
          onSelectSpread={editor.selectSpread}
          onAddSpread={editor.addSpread}
          onDuplicateSpread={editor.duplicateSpread}
          onDeleteSpread={editor.deleteSpread}
          onReorderSpread={editor.reorderSpreads}
          spreadThumbnails={editor.spreadThumbnails}
          albumSize={editor.album.size}
        />

        <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-30 md:hidden">
          <button onClick={() => setPhotosDrawerOpen(true)}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform">
            <ImageIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-30 hidden md:flex lg:hidden">
          <button onClick={() => setSettingsDrawerOpen(true)}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <Sheet open={photosDrawerOpen} onOpenChange={setPhotosDrawerOpen}>
          <SheetContent side="left" className="w-[80vw] max-w-xs p-0">
            <SheetHeader className="px-4 pt-3 pb-0"><SheetTitle className="text-sm">Photos</SheetTitle></SheetHeader>
            <div className="h-full overflow-hidden">{photosPanel}</div>
          </SheetContent>
        </Sheet>
        <Sheet open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
          <SheetContent side="right" className="w-[80vw] max-w-xs p-0">
            <SheetHeader className="px-4 pt-3 pb-0"><SheetTitle className="text-sm">Settings</SheetTitle></SheetHeader>
            <div className="h-full overflow-hidden">{settingsPanel}</div>
          </SheetContent>
        </Sheet>

        {previewOpen && (
          <AlbumPreviewModal albumId={editor.album.id} albumName={editor.album.name} onClose={() => setPreviewOpen(false)} onSharePreview={editor.getShareLink} />
        )}
        <AlbumExportDialog open={exportOpen} onOpenChange={setExportOpen} album={editor.album} spreads={editor.spreads} onSharePreview={editor.getShareLink} />
        <AlbumAutoLayoutDialog open={autoLayoutOpen} onOpenChange={setAutoLayoutOpen} album={editor.album} onComplete={editor.reloadSpreads} />
      </div>
    );
  }

  /* ─── DESKTOP LAYOUT ─── */
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <AlbumEditorToolbar
        albumName={editor.album.name}
        onNameChange={editor.updateAlbumName}
        onBack={editor.goBack}
        zoom={editor.zoom}
        onZoomChange={editor.setZoom}
        onUndo={editor.undo}
        onRedo={editor.redo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        saveStatus={editor.saveStatus}
        albumStatus={editor.album.status}
        onStatusChange={editor.updateStatus}
        onAutoLayout={() => setAutoLayoutOpen(true)}
        onPreview={() => setPreviewOpen(true)}
        onExport={() => setExportOpen(true)}
        showBleed={editor.showBleed}
        showGrid={editor.showGrid}
        onToggleBleed={() => editor.setShowBleed(!editor.showBleed)}
        onToggleGrid={() => editor.setShowGrid(!editor.showGrid)}
      />

      <div className="flex-1 flex overflow-hidden">
        {photosPanel}
        <AlbumCanvas
          frames={editor.frames}
          onFramesChange={editor.updateFrames}
          albumSize={editor.album.size}
          zoom={editor.zoom}
          onZoomChange={editor.setZoom}
          showBleed={editor.showBleed}
          showSafeMargin={editor.showSafeMargin}
          showGrid={editor.showGrid}
          bgColor={editor.bgColor}
          onDropPhoto={editor.dropPhoto}
          uploadingCells={editor.uploadingCells}
          spreadLabel={editor.spreadLabel}
        />
        <div className="w-64 xl:w-72 shrink-0">{settingsPanel}</div>
      </div>

      <AlbumTimeline
        spreads={editor.spreads}
        currentSpreadId={editor.currentSpreadId}
        onSelectSpread={editor.selectSpread}
        onAddSpread={editor.addSpread}
        onDuplicateSpread={editor.duplicateSpread}
        onDeleteSpread={editor.deleteSpread}
        onReorderSpread={editor.reorderSpreads}
        spreadThumbnails={editor.spreadThumbnails}
        albumSize={editor.album.size}
      />

      {previewOpen && (
        <AlbumPreviewModal albumId={editor.album.id} albumName={editor.album.name} onClose={() => setPreviewOpen(false)} onSharePreview={editor.getShareLink} />
      )}
      <AlbumExportDialog open={exportOpen} onOpenChange={setExportOpen} album={editor.album} spreads={editor.spreads} onSharePreview={editor.getShareLink} />
      <AlbumAutoLayoutDialog open={autoLayoutOpen} onOpenChange={setAutoLayoutOpen} album={editor.album} onComplete={editor.reloadSpreads} />
    </div>
  );
}

/* ─── Bottom Action Button (Phone) ─── */
function BottomAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 active:scale-95 transition-transform text-muted-foreground active:text-primary"
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
