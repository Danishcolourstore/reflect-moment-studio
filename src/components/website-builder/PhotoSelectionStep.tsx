import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';
import type { WebsiteProfile } from '@/pages/WebsiteBuilder';

const SAMPLE_PHOTOS = [
  { id: '1', url: '/placeholder.svg', tag: 'Wedding' },
  { id: '2', url: '/placeholder.svg', tag: 'Portrait' },
  { id: '3', url: '/placeholder.svg', tag: 'Wedding' },
  { id: '4', url: '/placeholder.svg', tag: 'Event' },
  { id: '5', url: '/placeholder.svg', tag: 'Fashion' },
  { id: '6', url: '/placeholder.svg', tag: 'Portrait' },
  { id: '7', url: '/placeholder.svg', tag: 'Travel' },
  { id: '8', url: '/placeholder.svg', tag: 'Commercial' },
  { id: '9', url: '/placeholder.svg', tag: 'Wedding' },
  { id: '10', url: '/placeholder.svg', tag: 'Portrait' },
  { id: '11', url: '/placeholder.svg', tag: 'Event' },
  { id: '12', url: '/placeholder.svg', tag: 'Fashion' },
];

interface Props {
  profile: WebsiteProfile;
  onComplete: (photos: string[]) => void;
  onBack: () => void;
}

export function PhotoSelectionStep({ profile, onComplete, onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="text-center mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
          Select your best work
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Choose photos for your portfolio. Tap to select.
        </p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-6">
        {SAMPLE_PHOTOS.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => toggle(photo.id)}
            className="relative aspect-[4/5] rounded-lg overflow-hidden group transition-all duration-300"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-secondary to-muted transition-all duration-200 ${
              selected.has(photo.id) ? 'ring-2 ring-primary ring-inset' : ''
            }`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-muted-foreground/30 text-xs">{photo.tag}</span>
              </div>
            </div>

            {/* Tag label */}
            <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider bg-background/70 backdrop-blur-sm text-foreground/70 px-2 py-0.5 rounded-full">
              {photo.tag}
            </span>

            {/* Selection indicator */}
            {selected.has(photo.id) && (
              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}

            {/* Hover state */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors" />
          </button>
        ))}
      </div>

      <Button
        onClick={() => onComplete(Array.from(selected))}
        disabled={selected.size === 0}
        className="w-full h-12 text-sm font-medium tracking-wider uppercase bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 disabled:opacity-40"
      >
        Build My Website ({selected.size} photo{selected.size !== 1 ? 's' : ''} selected)
      </Button>
    </div>
  );
}
