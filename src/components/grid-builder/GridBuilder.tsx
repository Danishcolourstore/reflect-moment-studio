import { useState } from 'react';
import { ArrowLeft, Grid3X3, Sparkles, MessageSquare, LayoutGrid } from 'lucide-react';
import { useDeviceDetect } from '@/hooks/use-device-detect';
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
  const device = useDeviceDetect();
  const isMobile = device.isPhone;

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
        <div className={cn(
          "flex items-center justify-between h-12",
          isMobile ? "px-3" : "px-4 sm:px-6 lg:px-8 sm:h-14"
        )}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-primary" />
              <h1 className="text-[11px] font-semibold tracking-[0.12em] uppercase text-foreground">Grid Builder</h1>
            </div>
          </div>

          {/* Action pills */}
          <div className="flex items-center gap-1">
            {[
              { active: showAISuggest, onClick: () => { setShowAISuggest(!showAISuggest); setShowCaption(false); }, icon: <LayoutGrid className="h-3.5 w-3.5" />, label: 'AI', ariaLabel: 'AI Layout' },
              { active: showCaption, onClick: () => { setShowCaption(!showCaption); setShowAISuggest(false); }, icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Cap', ariaLabel: 'Caption' },
              { active: false, onClick: () => setShowInspire(true), icon: <Sparkles className="h-3.5 w-3.5" />, label: '✨', ariaLabel: 'Inspire' },
            ].map((btn) => (
              <button
                key={btn.ariaLabel}
                onClick={btn.onClick}
                aria-label={btn.ariaLabel}
                className={cn(
                  'flex items-center justify-center gap-1 rounded-full font-semibold transition-all duration-200 active:scale-95',
                  isMobile
                    ? 'min-h-[40px] min-w-[40px] px-3 text-[10px] tracking-wider uppercase'
                    : 'min-h-[36px] px-2.5 py-1.5 text-[9px] tracking-wider uppercase',
                  btn.active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
                )}
              >
                {btn.icon}
                <span className={isMobile ? 'hidden' : 'hidden sm:inline'}>{btn.ariaLabel}</span>
                <span className={isMobile ? '' : 'sm:hidden'}>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={cn(
        "flex-1 pt-4 pb-24 lg:pb-12",
        isMobile ? "px-3" : "px-4 sm:px-6 lg:px-8 sm:pt-6"
      )}>
        {/* AI panels */}
        {showAISuggest && (
          <div className="mb-4 animate-fade-in">
            <AILayoutSuggestions
              photoCount={4}
              onSelectLayout={(layout) => { setShowAISuggest(false); setInitialTextLayers([]); setSelectedLayout(layout); }}
              onClose={() => setShowAISuggest(false)}
            />
          </div>
        )}
        {showCaption && (
          <div className="mb-4 animate-fade-in">
            <AICaptionGenerator onClose={() => setShowCaption(false)} />
          </div>
        )}

        <p className="text-muted-foreground/60 text-xs tracking-wide mb-3 sm:mb-6">
          Choose a layout to begin designing your grid.
        </p>
        <GridLayoutSelector onSelect={(layout) => { setInitialTextLayers([]); setSelectedLayout(layout); }} />
      </div>
    </div>
  );
}
