import { useState } from 'react';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import type { GridLayout } from './types';
import GridLayoutSelector from './GridLayoutSelector';
import GridEditor from './GridEditor';

interface Props {
  onClose: () => void;
}

export default function GridBuilder({ onClose }: Props) {
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);

  if (selectedLayout) {
    return <GridEditor layout={selectedLayout} onBack={() => setSelectedLayout(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-primary" />
            <h1 className="text-sm font-semibold tracking-wider uppercase text-foreground">Grid Builder</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-5 pb-24">
        <p className="text-muted-foreground text-xs tracking-wide mb-5">
          Choose a layout to begin designing your photo grid.
        </p>
        <GridLayoutSelector onSelect={setSelectedLayout} />
      </div>
    </div>
  );
}
