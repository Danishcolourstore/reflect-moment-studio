// NOTE: Retouching tools are UI shells. Pixel manipulation is CSS-simulated.
// TODO: Implement real canvas-based retouching with WebGL or WASM
import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import RefynUpload from '@/components/refyn/RefynUpload';
import RefynProcessing from '@/components/refyn/RefynProcessing';
import RefynEditor from '@/components/refyn/RefynEditor';
import RefynExport from '@/components/refyn/RefynExport';
import { DEFAULT_TOOL_VALUES, type RefynToolValues } from '@/components/refyn/refyn-types';
import type { RefynFilter } from '@/components/refyn/refyn-filters';

export type RefynScreen = 'splash' | 'upload' | 'processing' | 'editor' | 'export';

export interface RefynPhoto {
  file: File;
  originalUrl: string;
}

const ease = [0.16, 1, 0.3, 1];

/* ─── Splash Screen ─── */
function RefynSplash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease }}
    >
      <motion.p
        className="text-[28px] italic font-light"
        style={{ fontFamily: '"Cormorant Garamond", serif', color: '#E8C97A' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease }}
      >
        Refyn
      </motion.p>
      <motion.p
        className="mt-3 text-[10px] uppercase tracking-[0.3em]"
        style={{ fontFamily: '"DM Sans", sans-serif', color: 'rgba(240,237,232,0.2)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        Retouch with Real Intelligence
      </motion.p>
      <motion.div
        className="mt-8"
        style={{ width: 24, height: 1, background: 'rgba(232,201,122,0.3)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 1.2, ease }}
      />
    </motion.div>
  );
}

/* ─── Install Prompt Hook ─── */
function useInstallPrompt() {
  const deferredPrompt = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome;
  }, []);

  return { canInstall, promptInstall };
}

/* ─── Register Refyn Service Worker ─── */
function useRefynServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-refyn.js', { scope: '/refyn' }).catch(() => {});
    }
  }, []);
}

/* ─── Main Refyn PWA ─── */
export default function Refyn() {
  const [screen, setScreen] = useState<RefynScreen>('splash');
  const [photo, setPhoto] = useState<RefynPhoto | null>(null);
  const [editedValues, setEditedValues] = useState<RefynToolValues | null>(null);
  const [editedOverrides, setEditedOverrides] = useState<RefynFilter['cssOverrides']>({});
  const [hasRetouched, setHasRetouched] = useState(false);
  const { canInstall, promptInstall } = useInstallPrompt();

  useRefynServiceWorker();

  // Show install prompt after first retouch export
  useEffect(() => {
    if (hasRetouched && canInstall) {
      const t = setTimeout(() => promptInstall(), 1500);
      return () => clearTimeout(t);
    }
  }, [hasRetouched, canInstall, promptInstall]);

  const handleUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPhoto({ file, originalUrl: url });
    setScreen('processing');
    setTimeout(() => setScreen('editor'), 3200);
  }, []);

  const handleExport = useCallback((values: RefynToolValues, cssOverrides?: RefynFilter['cssOverrides']) => {
    setEditedValues(values);
    setEditedOverrides(cssOverrides || {});
    setScreen('export');
    setHasRetouched(true);
  }, []);

  const handleBack = useCallback(() => {
    setScreen('editor');
  }, []);

  const handleReset = useCallback(() => {
    if (photo) URL.revokeObjectURL(photo.originalUrl);
    setPhoto(null);
    setScreen('upload');
    setEditedValues(null);
    setEditedOverrides({});
  }, [photo]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.originalUrl);
    };
  }, [photo]);

  // Check if running in standalone PWA mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;

  return (
    <>
      <Helmet>
        <title>Refyn — Retouch with Real Intelligence</title>
        <meta name="description" content="AI-powered photo retouching for professional photographers." />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Refyn" />
        <link rel="apple-touch-icon" href="/icons/refyn-512.png" />
        <link rel="manifest" href="/manifest-refyn.json" />
      </Helmet>

      <div className="refyn-app min-h-[100dvh] bg-[#0A0A0A] text-[#F0EDE8] overflow-hidden relative">
        {/* Film grain */}
        <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.03]">
          <filter id="refyn-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#refyn-grain)" />
        </svg>

        {/* Wordmark — hidden during splash */}
        {screen !== 'splash' && (
          <div className="fixed top-6 left-6 z-40">
            <h1
              className="text-[15px] tracking-[0.35em] uppercase font-light"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Refyn
            </h1>
          </div>
        )}

        <AnimatePresence mode="wait">
          {screen === 'splash' && <RefynSplash key="splash" onDone={() => setScreen('upload')} />}
          {screen === 'upload' && <RefynUpload key="upload" onUpload={handleUpload} />}
          {screen === 'processing' && photo && <RefynProcessing key="processing" photoUrl={photo.originalUrl} />}
          {screen === 'editor' && photo && (
            <RefynEditor key="editor" photoUrl={photo.originalUrl} onExport={() => setScreen('export')} onReset={handleReset} />
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

        {/* Install banner — shows only in browser, not PWA, after first use */}
        {canInstall && !isStandalone && hasRetouched && (
          <motion.button
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full"
            style={{
              background: 'rgba(232,201,122,0.1)',
              border: '1px solid rgba(232,201,122,0.25)',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 11,
              color: '#E8C97A',
              letterSpacing: '0.1em',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            onClick={promptInstall}
          >
            Install Refyn
          </motion.button>
        )}
      </div>
    </>
  );
}
