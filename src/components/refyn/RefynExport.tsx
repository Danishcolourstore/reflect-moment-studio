import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SendToMirrorPanel from '@/components/colour-store/SendToMirrorPanel';
import ShareWithClientButton from '@/components/colour-store/ShareWithClientButton';
import { RetouchEngine, EXPORT_PRESETS, type ExportPreset } from '@/lib/retouch-engine';
import type { RefynToolValues } from './refyn-types';
import type { RefynFilter } from './refyn-filters';

interface Props {
  photoUrl: string;
  values: RefynToolValues;
  cssOverrides?: RefynFilter['cssOverrides'];
  onBack: () => void;
  onReset: () => void;
}

export default function RefynExport({ photoUrl, values, cssOverrides, onBack, onReset }: Props) {
  const [watermark, setWatermark] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exported, setExported] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const engineRef = useRef<RetouchEngine>(new RetouchEngine());

  // Load image and render preview
  useEffect(() => {
    const engine = engineRef.current;
    engine.loadImage(photoUrl).then(() => {
      // Generate a preview blob for display
      const webPreset: ExportPreset = {
        name: 'preview', label: '', description: '',
        maxWidth: 600, maxHeight: 800,
        format: 'image/jpeg', quality: 0.85,
      };
      engine.exportBlob(values, cssOverrides, webPreset).then((blob) => {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      });
    });

    return () => {
      engine.dispose();
    };
  }, [photoUrl, values, cssOverrides]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = useCallback(async (preset: ExportPreset) => {
    if (exporting) return;
    setExporting(true);
    setExportProgress(0);

    try {
      const blob = await engineRef.current.exportBlob(
        values,
        cssOverrides,
        preset,
        (p) => setExportProgress(p)
      );

      const url = URL.createObjectURL(blob);
      const ext = preset.format === 'image/png' ? 'png' : 'jpg';
      const a = document.createElement('a');
      a.href = url;
      a.download = `colour-store-${preset.name}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  }, [values, cssOverrides, exporting]);

  const handleSendToMirror = useCallback((destination: 'event' | 'album' | 'grid') => {
    return destination;
  }, []);

  const dims = engineRef.current.getSourceDimensions();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6 gap-6 pt-16 pb-8"
    >
      {/* Preview — rendered from canvas, not original */}
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Export preview"
            className="w-full aspect-[4/3] object-cover"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-[#141414] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#E8C97A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {watermark && (
          <div className="absolute bottom-3 right-3">
            <span
              className="text-[9px] tracking-[0.25em] uppercase text-white/20"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Colour Store
            </span>
          </div>
        )}
      </div>

      {/* Export progress */}
      <AnimatePresence>
        {exporting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-sm"
          >
            <div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
              <motion.div
                className="h-full bg-[#E8C97A] rounded-full"
                style={{ width: `${exportProgress * 100}%` }}
                transition={{ duration: 0.15 }}
              />
            </div>
            <p className="text-[9px] text-center mt-2 text-[#6B6B6B] tracking-wider" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Rendering full resolution...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      <p className="text-[10px] tracking-wider uppercase text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
        Export to Device
      </p>

      {/* Export presets */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {EXPORT_PRESETS.map((preset, i) => (
          <motion.button
            key={preset.name}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleDownload(preset)}
            disabled={exporting}
            className="w-full py-4 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 active:bg-[#1a1a1a] disabled:opacity-50"
            style={{
              background: i === 0 ? '#E8C97A' : '#141414',
              border: i === 0 ? 'none' : '1px solid rgba(240,237,232,0.06)',
            }}
          >
            <span
              className="text-[12px] font-medium"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: i === 0 ? '#0A0A0A' : '#F0EDE8',
              }}
            >
              {preset.label}
            </span>
            <span
              className="text-[10px]"
              style={{
                fontFamily: '"DM Sans", sans-serif',
                color: i === 0 ? 'rgba(10,10,10,0.5)' : '#6B6B6B',
              }}
            >
              {preset.description}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Share with Client */}
      <ShareWithClientButton photoUrl={previewUrl || photoUrl} />

      {/* Watermark toggle */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] tracking-wider text-[#6B6B6B]" style={{ fontFamily: '"DM Sans", sans-serif' }}>
          "Edited with Colour Store" watermark
        </span>
        <button
          onClick={() => setWatermark(!watermark)}
          className="w-10 h-5 rounded-full relative transition-colors duration-300"
          style={{ backgroundColor: watermark ? '#E8C97A' : '#333' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-[#0A0A0A] transition-transform duration-300"
            style={{ left: watermark ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Download confirmation */}
      <AnimatePresence>
        {exported && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-[#E8C97A] tracking-wider"
            style={{ fontFamily: '"DM Sans", sans-serif' }}
          >
            ✓ Exported with all edits applied
          </motion.p>
        )}
      </AnimatePresence>

      {/* Send to Mirror */}
      <SendToMirrorPanel onSend={handleSendToMirror} />

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <button
          onClick={onBack}
          className="text-[10px] tracking-wider uppercase text-[#6B6B6B] hover:text-[#F0EDE8]/70 transition-colors duration-300"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          ← Back to editor
        </button>
        <button
          onClick={onReset}
          className="text-[10px] tracking-wider uppercase text-[#6B6B6B] hover:text-[#F0EDE8]/70 transition-colors duration-300"
          style={{ fontFamily: '"DM Sans", sans-serif' }}
        >
          New photo
        </button>
      </div>
    </motion.div>
  );
}
