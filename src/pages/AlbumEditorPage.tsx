import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAlbumEditor } from "@/hooks/use-album-editor";
import { useIsMobile } from "@/hooks/use-mobile";
import AlbumEditorToolbar from "@/components/album-designer/AlbumEditorToolbar";
import AlbumPhotoPanel from "@/components/album-designer/AlbumPhotoPanel";
import AlbumCanvas from "@/components/album-designer/AlbumCanvas";
import AlbumRightPanel from "@/components/album-designer/AlbumRightPanel";
import AlbumTimeline from "@/components/album-designer/AlbumTimeline";
import AlbumPreviewModal from "@/components/album-designer/AlbumPreviewModal";
import AlbumExportDialog from "@/components/album-designer/AlbumExportDialog";
import AlbumAutoLayoutDialog from "@/components/album-designer/AlbumAutoLayoutDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ImageIcon, Settings } from "lucide-react";

export default function AlbumEditorPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const editor = useAlbumEditor(albumId);
  const isMobile = useIsMobile();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [autoLayoutOpen, setAutoLayoutOpen] = useState(false);
  const [photosDrawerOpen, setPhotosDrawerOpen] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

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

      <div className="flex-1 flex overflow-hidden relative">
        {!isMobile && photosPanel}

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

        {!isMobile && <div className="w-64 xl:w-72 shrink-0">{settingsPanel}</div>}

        {isMobile && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
            <button onClick={() => setPhotosDrawerOpen(true)}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
              <ImageIcon className="h-5 w-5" />
            </button>
            <button onClick={() => setSettingsDrawerOpen(true)}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        )}
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

      {isMobile && (
        <>
          <Sheet open={photosDrawerOpen} onOpenChange={setPhotosDrawerOpen}>
            <SheetContent side="bottom" className="h-[70vh] p-0">
              <SheetHeader className="px-4 pt-3 pb-0"><SheetTitle className="text-sm">Photos</SheetTitle></SheetHeader>
              <div className="h-full overflow-hidden">{photosPanel}</div>
            </SheetContent>
          </Sheet>
          <Sheet open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
            <SheetContent side="right" className="w-[85vw] max-w-xs p-0">
              <SheetHeader className="px-4 pt-3 pb-0"><SheetTitle className="text-sm">Settings</SheetTitle></SheetHeader>
              <div className="h-full overflow-hidden">{settingsPanel}</div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {previewOpen && (
        <AlbumPreviewModal
          albumId={editor.album.id}
          albumName={editor.album.name}
          onClose={() => setPreviewOpen(false)}
          onSharePreview={editor.getShareLink}
        />
      )}

      <AlbumExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        album={editor.album}
        spreads={editor.spreads}
        onSharePreview={editor.getShareLink}
      />

      <AlbumAutoLayoutDialog
        open={autoLayoutOpen}
        onOpenChange={setAutoLayoutOpen}
        album={editor.album}
        onComplete={editor.reloadSpreads}
      />
    </div>
  );
}
