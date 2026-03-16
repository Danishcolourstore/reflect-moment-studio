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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
      onApplyTemplate={editor.applyTemplate}
      textLayers={editor.textLayers}
      selectedTextId={editor.selectedTextId}
      onAddText={editor.addTextLayer}
      onUpdateText={editor.updateText}
      onDeleteText={editor.deleteText}
      onReorderTextLayers={editor.updateTextLayers}
      showBleed={editor.showBleed}
      showSafeMargin={editor.showSafeMargin}
      showSpine={editor.showSpine}
      onToggleBleed={editor.setShowBleed}
      onToggleSafe={editor.setShowSafeMargin}
      onToggleSpine={editor.setShowSpine}
      bgColor={editor.bgColor}
      onBgColorChange={editor.updateBgColor}
      paperTexture={editor.paperTexture}
      onPaperTextureChange={editor.updatePaperTexture}
    />
  );

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <AlbumEditorToolbar
        albumName={editor.album.name}
        onNameChange={editor.updateAlbumName}
        onBack={editor.goBack}
        spreadView={editor.spreadView}
        onToggleSpread={() => editor.setSpreadView(!editor.spreadView)}
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
      />

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Photos — desktop only */}
        {!isMobile && photosPanel}

        {/* Center: Canvas */}
        <AlbumCanvas
          layout={editor.layout}
          cells={editor.cells}
          onCellsChange={editor.updateCells}
          textLayers={editor.textLayers}
          onTextLayersChange={editor.updateTextLayers}
          selectedTextId={editor.selectedTextId}
          onSelectText={editor.setSelectedTextId}
          albumSize={editor.album.size}
          zoom={editor.zoom}
          onZoomChange={editor.setZoom}
          spreadView={editor.spreadView}
          showBleed={editor.showBleed}
          showSafeMargin={editor.showSafeMargin}
          showSpine={editor.showSpine}
          bgColor={editor.bgColor}
          onDropPhoto={editor.dropPhoto}
          onPlacePhotoFile={editor.placePhotoFile}
          uploadingCells={editor.uploadingCells}
          currentPageNumber={editor.currentPageNumber}
        />

        {/* Right: Settings — desktop only */}
        {!isMobile && (
          <div className="w-64 xl:w-72 shrink-0">{settingsPanel}</div>
        )}

        {/* Mobile FABs */}
        {isMobile && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
            <button
              onClick={() => setPhotosDrawerOpen(true)}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSettingsDrawerOpen(true)}
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom: Timeline */}
      <AlbumTimeline
        pages={editor.pages}
        currentPageId={editor.currentPageId}
        currentSpreadIndex={editor.currentSpreadIndex}
        spreadView={editor.spreadView}
        onSelectPage={editor.selectPage}
        onAddPage={editor.addPage}
        onDuplicatePage={editor.duplicatePage}
        onDeletePage={editor.deletePage}
        onReorderPage={editor.reorderPages}
        pageThumbnails={editor.pageThumbnails}
      />

      {/* Mobile Drawers */}
      {isMobile && (
        <>
          <Sheet open={photosDrawerOpen} onOpenChange={setPhotosDrawerOpen}>
            <SheetContent side="bottom" className="h-[70vh] p-0">
              <SheetHeader className="px-4 pt-3 pb-0">
                <SheetTitle className="text-sm">Photos</SheetTitle>
              </SheetHeader>
              <div className="h-full overflow-hidden">{photosPanel}</div>
            </SheetContent>
          </Sheet>

          <Sheet open={settingsDrawerOpen} onOpenChange={setSettingsDrawerOpen}>
            <SheetContent side="right" className="w-[85vw] max-w-xs p-0">
              <SheetHeader className="px-4 pt-3 pb-0">
                <SheetTitle className="text-sm">Settings</SheetTitle>
              </SheetHeader>
              <div className="h-full overflow-hidden">{settingsPanel}</div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Modals */}
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
        pages={editor.pages}
        onSharePreview={editor.getShareLink}
      />

      <AlbumAutoLayoutDialog
        open={autoLayoutOpen}
        onOpenChange={setAutoLayoutOpen}
        album={editor.album}
        onComplete={editor.reloadPages}
      />
    </div>
  );
}
