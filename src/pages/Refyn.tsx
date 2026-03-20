import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import RefynUpload from '@/components/refyn/RefynUpload';
import RefynProcessing from '@/components/refyn/RefynProcessing';
import RefynEditor from '@/components/refyn/RefynEditor';
import RefynExport from '@/components/refyn/RefynExport';

export type RefynScreen = 'upload' | 'processing' | 'editor' | 'export';

export interface RefynPhoto {
  file: File;
  originalUrl: string;
}

export default function Refyn() {
  const [screen, setScreen] = useState<RefynScreen>('upload');
  const [photo, setPhoto] = useState<RefynPhoto | null>(null);

  const handleUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPhoto({ file, originalUrl: url });
    setScreen('processing');

    // Simulate AI processing
    setTimeout(() => setScreen('editor'), 3200);
  }, []);

  const handleExport = useCallback(() => {
    setScreen('export');
  }, []);

  const handleBack = useCallback(() => {
    setScreen('editor');
  }, []);

  const handleReset = useCallback(() => {
    if (photo) URL.revokeObjectURL(photo.originalUrl);
    setPhoto(null);
    setScreen('upload');
  }, [photo]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.originalUrl);
    };
  }, [photo]);

  return (
    <div className="refyn-app min-h-[100dvh] bg-[#0A0A0A] text-[#F0EDE8] overflow-hidden relative">
      {/* Film grain overlay */}
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.03]">
        <filter id="refyn-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#refyn-grain)" />
      </svg>

      {/* Logo */}
      <div className="fixed top-6 left-6 z-40">
        <h1
          className="text-[15px] tracking-[0.35em] uppercase font-light"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          Refyn
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'upload' && <RefynUpload key="upload" onUpload={handleUpload} />}
        {screen === 'processing' && photo && <RefynProcessing key="processing" photoUrl={photo.originalUrl} />}
        {screen === 'editor' && photo && (
          <RefynEditor key="editor" photoUrl={photo.originalUrl} onExport={handleExport} onReset={handleReset} />
        )}
        {screen === 'export' && photo && (
          <RefynExport key="export" photoUrl={photo.originalUrl} onBack={handleBack} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}
