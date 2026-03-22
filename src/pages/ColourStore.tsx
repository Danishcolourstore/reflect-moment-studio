import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRetouchSession } from './RetouchLogin';
import RetouchLogin from './RetouchLogin';

import RefynUpload from '@/components/refyn/RefynUpload';
import RefynProcessing from '@/components/refyn/RefynProcessing';
import RefynEditor from '@/components/refyn/RefynEditor';
import RefynExport from '@/components/refyn/RefynExport';
import ProductNav from '@/components/colour-store/ProductNav';
import IntelligenceBar from '@/components/colour-store/IntelligenceBar';
import IntelligenceDot from '@/components/colour-store/IntelligenceDot';
import { analysePhoto, type ColourAnalysis } from '@/lib/colour-intelligence';
import type { RefynToolValues } from '@/components/refyn/refyn-types';
import type { RefynFilter } from '@/components/refyn/refyn-filters';

export type RefynScreen = 'upload' | 'processing' | 'editor' | 'export';

export interface RefynPhoto {
  file: File;
  originalUrl: string;
}

export default function ColourStore() {
  const { needsOtp } = useRetouchSession();
  const [screen, setScreen] = useState<RefynScreen>('upload');
  const [photo, setPhoto] = useState<RefynPhoto | null>(null);
  const [showIntelBar, setShowIntelBar] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [aiToolValues, setAiToolValues] = useState<RefynToolValues | null>(null);
  const [editedValues, setEditedValues] = useState<RefynToolValues | null>(null);
  const [editedOverrides, setEditedOverrides] = useState<RefynFilter['cssOverrides']>({});

  const handleUpload = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPhoto({ file, originalUrl: url });
    setScreen('processing');
    setShowIntelBar(true);
    setDetectedText('Analysing...');

    try {
      const analysis = await analysePhoto(file);
      const mapped: RefynToolValues = {
        frequency: analysis.tools.skin,
        lumina: analysis.tools.glow,
        sculpt: analysis.tools.form,
        ghostLight: analysis.tools.light,
        grain: { style: 'film', strength: analysis.tools.grain, shadowsOnly: false },
        layerTexture: analysis.tools.depth.texture,
        layerTone: analysis.tools.depth.tone,
        outfit: analysis.tools.outfit ?? 0,
        jewellery: analysis.tools.jewellery ?? 0,
        hair: analysis.tools.hair ?? 0,
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

  const handleExport = useCallback((values: RefynToolValues, cssOverrides?: RefynFilter['cssOverrides']) => {
    setEditedValues(values);
    setEditedOverrides(cssOverrides || {});
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
    setEditedValues(null);
    setEditedOverrides({});
  }, [photo]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.originalUrl);
    };
  }, [photo]);

  const isEditorActive = screen === 'editor';

  return (
    <div className="refyn-app min-h-[100dvh] bg-[#0A0A0A] text-[#F0EDE8] overflow-hidden relative">
      <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.03]">
        <filter id="refyn-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#refyn-grain)" />
      </svg>

      {!isEditorActive && <ProductNav />}
      {!isEditorActive && <IntelligenceBar visible={showIntelBar} detectedText={detectedText} />}
      {!isEditorActive && <IntelligenceDot active={screen === 'processing'} />}

      <AnimatePresence mode="wait">
        {screen === 'upload' && <RefynUpload key="upload" onUpload={handleUpload} />}
        {screen === 'processing' && photo && <RefynProcessing key="processing" photoUrl={photo.originalUrl} />}
        {screen === 'editor' && photo && (
          <RefynEditor
            key="editor"
            photoUrl={photo.originalUrl}
            onExport={() => setScreen('export')}
            onReset={handleReset}
          />
        )}
        {screen === 'export' && photo && editedValues && (
          <RefynExport
            key="export"
            photoUrl={photo.originalUrl}
            values={editedValues}
            cssOverrides={editedOverrides}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>

      
    </div>
  );
}
