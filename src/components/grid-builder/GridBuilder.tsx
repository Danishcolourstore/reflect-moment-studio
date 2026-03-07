import { useState } from 'react';
import { ArrowLeft, Grid3X3, Sparkles } from 'lucide-react';
import type { GridLayout } from './types';
import type { TextLayer } from './text-overlay-types';
import GridLayoutSelector from './GridLayoutSelector';
import GridEditor from './GridEditor';
import GridInspireModal from './GridInspireModal';

interface Props {
  onClose: () => void;
}

export default function GridBuilder({ onClose }: Props) {
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);
  const [initialTextLayers, setInitialTextLayers] = useState<TextLayer[]>([]);
  const [showInspire, setShowInspire] = useState(false);

  if (selectedLayout) {
    return (
      <GridEditor
        layout={selectedLayout}
        onBack={() => { setSelectedLayout(null); setInitialTextLayers([]); }}
        initialTextLayers={initialTextLayers}
      />
    );
  }

  if (showInspire) {
    return (
      <GridInspireModal
        onClose={() => setShowInspire(false)}
        onLayoutGenerated={(layout, textLayers) => {
          setShowInspire(false);
          setInitialTextLayers(textLayers);
          setSelectedLayout(layout);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-semibold tracking-wider uppercase text-foreground">Grid Builder</h1>
            </div>
          </div>
          <button
            onClick={() => setShowInspire(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] tracking-wider uppercase font-semibold hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Inspire
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-5 pb-24">
        <p className="text-muted-foreground text-xs tracking-wide mb-5">
          Choose a layout to begin designing your photo grid.
        </p>
        <GridLayoutSelector onSelect={(layout) => { setInitialTextLayers([]); setSelectedLayout(layout); }} />
      </div>
    </div>
  );
}
