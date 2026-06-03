import { useState, lazy, Suspense, useCallback } from 'react';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import { useDeviceDetect } from '@/hooks/use-device-detect';
import type { GridLayout, FreePosition, CanvasFormat } from './types';
import type { TextLayer } from './text-overlay-types';
import type { BackgroundStyle } from './BackgroundStyler';
import GridLayoutSelector from './GridLayoutSelector';
import GridEditor, { type GridEditorSnapshot } from './GridEditor';
import FormatPicker, { FORMAT_PRESETS, type FormatPreset } from './FormatPicker';
import PhotosStep from './PhotosStep';
import ExportStep from './ExportStep';
import { ScrollableTabBar } from '@/components/studio/ScrollableTabBar';
const GridInspireModal = lazy(() => import('./GridInspireModal'));
import { cn } from '@/lib/utils';

type WizardStep = 'format' | 'inspire' | 'photos' | 'design' | 'export';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'format', label: 'Format' },
  { id: 'inspire', label: 'Inspire' },
  { id: 'photos', label: 'Photos' },
  { id: 'design', label: 'Design' },
  { id: 'export', label: 'Export' },
];

interface Props {
  onClose: () => void;
}

export default function GridBuilder({ onClose }: Props) {
  const [step, setStep] = useState<WizardStep>('format');
  const [formatPreset, setFormatPreset] = useState<FormatPreset | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);
  const [initialTextLayers, setInitialTextLayers] = useState<TextLayer[]>([]);
  const [initialBackground, setInitialBackground] = useState<BackgroundStyle | null>(null);
  const [initialFreePositions, setInitialFreePositions] = useState<FreePosition[] | null>(null);
  const [showInspire, setShowInspire] = useState(false);
  const [exportSnapshot, setExportSnapshot] = useState<GridEditorSnapshot | null>(null);
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

  const handleInspireApply = (
    layout: GridLayout,
    textLayers: TextLayer[],
    background?: BackgroundStyle,
    freePositions?: FreePosition[],
  ) => {
    setShowInspire(false);
    setInitialTextLayers(textLayers);
    setInitialBackground(background ?? null);
    setInitialFreePositions(freePositions ?? null);
    setSelectedLayout(layout);
    setStep('design');
  };

  const handleFormatChange = useCallback((f: CanvasFormat) => {
    const preset = FORMAT_PRESETS.find((p) => p.format.id === f.id) ?? formatPreset;
    if (preset) setFormatPreset(preset);
  }, [formatPreset]);

  const handleStepChange = (next: WizardStep) => {
    if (next !== 'format' && !formatPreset) return;
    if (next === 'inspire') {
      setShowInspire(true);
      return;
    }
    setStep(next);
  };

  if (selectedLayout && step === 'design' && formatPreset) {
    return (
      <GridEditor
        layout={selectedLayout}
        onBack={() => setSelectedLayout(null)}
        initialTextLayers={initialTextLayers}
        initialBackground={initialBackground}
        initialFreePositions={initialFreePositions}
        format={formatPreset.format}
        onFormatChange={handleFormatChange}
        hideExportBar={isMobile}
        showEmptyOverlay
        initialPhotoFiles={photos}
        onStateSnapshot={setExportSnapshot}
        onOpenExport={() => setStep('export')}
        wizardTabs={STEPS.map((s) => ({ id: s.id, label: s.label, active: s.id === 'design' }))}
        onWizardTab={(id) => setStep(id as WizardStep)}
      />
    );
  }

  if (showInspire) {
    return (
      <Suspense fallback={null}>
        <GridInspireModal
          onClose={() => {
            setShowInspire(false);
            setStep('format');
          }}
          onLayoutGenerated={handleInspireApply}
        />
      </Suspense>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-grid-noir text-grid-ivory"
      style={{ ['--bg-primary' as string]: '#000000', ['--border-default' as string]: '#222222' }}
    >
      <header className="sticky top-0 z-20 border-b border-grid-border bg-grid-noir/95 backdrop-blur-xl">
        <div className={cn('flex h-12 items-center justify-between px-4 sm:h-14')}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="-ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-grid-muted transition-colors hover:text-grid-ivory"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-grid-gold" />
              <h1 className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em]">
                Grid Builder
              </h1>
            </div>
          </div>
        </div>

        <ScrollableTabBar
          variant="dark"
          tabs={STEPS.map((s) => ({ id: s.id, label: s.label }))}
          activeId={step}
          onChange={(id) => handleStepChange(id as WizardStep)}
        />
      </header>

      <div className="flex-1 px-4 pb-24 pt-4">
        {step === 'format' && (
          <FormatPicker selected={formatPreset} onSelect={setFormatPreset} />
        )}

        {step === 'inspire' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-grid-muted">
              Generate a layout from a reference image
            </p>
            <button
              type="button"
              onClick={() => setShowInspire(true)}
              className="border border-grid-gold px-6 py-3 font-sans text-[11px] uppercase tracking-[0.12em] text-grid-gold"
            >
              Open Inspire
            </button>
          </div>
        )}

        {step === 'photos' && (
          <PhotosStep
            photos={photos}
            onPhotosChange={setPhotos}
            onContinue={() => setStep('design')}
          />
        )}

        {step === 'design' && (
          <div className="flex flex-col gap-4 pb-24">
            <p className="font-sans text-[11px] uppercase tracking-[0.06em] text-grid-hint">
              Choose a layout to begin designing your grid.
            </p>
            <GridLayoutSelector
              onSelect={(layout) => {
                setInitialTextLayers([]);
                setSelectedLayout(layout);
              }}
            />
          </div>
        )}

        {step === 'export' && formatPreset && (
          exportSnapshot ? (
            <ExportStep
              layout={exportSnapshot.layout}
              cells={exportSnapshot.cells}
              textLayers={exportSnapshot.textLayers}
              elements={exportSnapshot.elements}
              logo={exportSnapshot.logo}
              background={exportSnapshot.background}
              format={formatPreset.format}
              formatPreset={formatPreset}
              freePositions={exportSnapshot.freePositions}
              filledCount={exportSnapshot.filledCount}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="font-serif text-lg italic text-[#555555]">Nothing to export yet</p>
              <p className="font-sans text-[11px] uppercase tracking-[0.06em] text-grid-hint">
                Complete the design step first
              </p>
              <button
                type="button"
                onClick={() => setStep('design')}
                className="mt-2 border border-grid-border-muted px-4 py-2 font-sans text-[10px] uppercase tracking-[0.1em] text-grid-muted"
              >
                Go to design
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
