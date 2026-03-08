import { useState } from 'react';
import { ArrowLeft, Grid3X3, Sparkles, MessageSquare, LayoutGrid } from 'lucide-react';
import type { GridLayout } from './types';
import type { TextLayer } from './text-overlay-types';
import GridLayoutSelector from './GridLayoutSelector';
import GridEditor from './GridEditor';
import GridInspireModal from './GridInspireModal';
import AICaptionGenerator from './AICaptionGenerator';
import AILayoutSuggestions from './AILayoutSuggestions';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export default function GridBuilder({ onClose }: Props) {
  const [selectedLayout, setSelectedLayout] = useState<GridLayout | null>(null);
  const [initialTextLayers, setInitialTextLayers] = useState<TextLayer[]>([]);
  const [showInspire, setShowInspire] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [showAISuggest, setShowAISuggest] = useState(false);

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
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              <h1 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foreground">Grid Builder</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { active: showAISuggest, onClick: () => { setShowAISuggest(!showAISuggest); setShowCaption(false); }, icon: <LayoutGrid className="h-3 w-3" />, label: 'AI Layout' },
              { active: showCaption, onClick: () => { setShowCaption(!showCaption); setShowAISuggest(false); }, icon: <MessageSquare className="h-3 w-3" />, label: 'Caption' },
              { active: false, onClick: () => setShowInspire(true), icon: <Sparkles className="h-3 w-3" />, label: 'Inspire' },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[9px] tracking-wider uppercase font-semibold transition-all duration-200',
                  btn.active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                )}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 pt-6 pb-24">
        {/* AI panels */}
        {showAISuggest && (
          <div className="mb-6 animate-fade-in">
            <AILayoutSuggestions
              photoCount={4}
              onSelectLayout={(layout) => { setShowAISuggest(false); setInitialTextLayers([]); setSelectedLayout(layout); }}
              onClose={() => setShowAISuggest(false)}
            />
          </div>
        )}
        {showCaption && (
          <div className="mb-6 animate-fade-in">
            <AICaptionGenerator onClose={() => setShowCaption(false)} />
          </div>
        )}

        <p className="text-muted-foreground/60 text-xs tracking-wide mb-6">
          Choose a layout to begin designing your grid.
        </p>
        <GridLayoutSelector onSelect={(layout) => { setInitialTextLayers([]); setSelectedLayout(layout); }} />
      </div>
    </div>
  );
}
