import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import RefynUpload from '@/components/refyn/RefynUpload';
import RefynProcessing from '@/components/refyn/RefynProcessing';
import RefynEditor from '@/components/refyn/RefynEditor';
import RefynExport from '@/components/refyn/RefynExport';
import ProductNav from '@/components/colour-store/ProductNav';
import IntelligenceBar from '@/components/colour-store/IntelligenceBar';
import IntelligenceDot from '@/components/colour-store/IntelligenceDot';
import { analysePhoto, type ColourAnalysis } from '@/lib/colour-intelligence';
import type { RefynToolValues } from '@/components/refyn/refyn-types';

export type RefynScreen = 'upload' | 'processing' | 'editor' | 'export';

export interface RefynPhoto {
  file: File;
  originalUrl: string;
}

export default function ColourStore() {
  const [screen, setScreen] = useState<RefynScreen>('upload');
  const [photo, setPhoto] = useState<RefynPhoto | null>(null);
  const [showIntelBar, setShowIntelBar] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [aiToolValues, setAiToolValues] = useState<RefynToolValues | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPhoto({ file, originalUrl: url });
    setScreen('processing');
    setShowIntelBar(true);
    setDetectedText('Analysing...');

    try {
      const analysis = await analysePhoto(file);

      // Map AI tools to RefynToolValues
      const mapped: RefynToolValues = {
        frequency: analysis.tools.skin,
        lumina: analysis.tools.glow,
        sculpt: analysis.tools.form,
        ghostLight: analysis.tools.light,
        grain: { style: 'film', strength: analysis.tools.grain, shadowsOnly: false },
        layerTexture: analysis.tools.depth.texture,
        layerTone: analysis.tools.depth.tone,
      };

      setAiToolValues(mapped);
      setDetectedText(analysis.detected);
    } catch (err) {
      console.error('AI analysis failed:', err);
      setDetectedText('Portrait detected');
      setAiToolValues(null);
    }

    setScreen('editor');
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
    setShowIntelBar(false);
    setDetectedText('');
    setAiToolValues(null);
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

      {/* Product navigation */}
      <ProductNav />

      {/* Intelligence bar (appears after upload) */}
      <IntelligenceBar visible={showIntelBar} detectedText={detectedText} />

      {/* Intelligence dot */}
      <IntelligenceDot active={screen === 'processing'} />

      <AnimatePresence mode="wait">
        {screen === 'upload' && <RefynUpload key="upload" onUpload={handleUpload} />}
        {screen === 'processing' && photo && <RefynProcessing key="processing" photoUrl={photo.originalUrl} />}
        {screen === 'editor' && photo && (
          <RefynEditor
            key="editor"
            photoUrl={photo.originalUrl}
            onExport={handleExport}
            onReset={handleReset}
            initialValues={aiToolValues ?? undefined}
          />
        )}
        {screen === 'export' && photo && (
          <RefynExport key="export" photoUrl={photo.originalUrl} onBack={handleBack} onReset={handleReset} />
        )}
      </AnimatePresence>
    </div>
  );
}
