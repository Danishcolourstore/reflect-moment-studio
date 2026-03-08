/**
 * AI Layout Suggestions panel — suggests optimal grid layouts based on photo count and event type.
 */

import { useState } from 'react';
import { Sparkles, LayoutGrid, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GRID_LAYOUTS, type GridLayout } from './types';

interface Suggestion {
  layoutId: string;
  name: string;
  reason: string;
  tip?: string;
}

interface Props {
  photoCount: number;
  onSelectLayout: (layout: GridLayout) => void;
  onClose?: () => void;
}

export default function AILayoutSuggestions({ photoCount, onSelectLayout, onClose }: Props) {
  const [eventType, setEventType] = useState('wedding');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const EVENT_TYPES = ['wedding', 'portrait', 'engagement', 'event', 'product', 'editorial', 'family', 'landscape'];

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-layout', {
        body: { photoCount, eventType, style: 'editorial' },
      });
      if (error) throw error;
      setSuggestions(data.suggestions || []);
      if (!data.suggestions?.length) toast.info('No suggestions returned — try different options');
    } catch (e: any) {
      if (e?.status === 429) toast.error('Rate limit — try again shortly');
      else if (e?.status === 402) toast.error('AI credits needed');
      else toast.error('Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    const layout = GRID_LAYOUTS.find(l => l.id === suggestion.layoutId);
    if (layout) {
      onSelectLayout(layout);
      toast.success(`Applied "${suggestion.name}" layout`);
    } else {
      toast.info(`Layout "${suggestion.name}" — apply manually from the layout picker`);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Layout Suggestions</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>{photoCount} photo{photoCount !== 1 ? 's' : ''} available</span>
      </div>

      {/* Event type chips */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mb-1.5">
          Event Type
        </label>
        <div className="flex flex-wrap gap-1">
          {EVENT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setEventType(t)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition-colors ${
                eventType === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={getSuggestions} disabled={loading} className="w-full gap-2" size="sm">
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? 'Analyzing…' : 'Get AI Suggestions'}
      </Button>

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full text-left rounded-xl border border-border bg-muted/30 p-3 hover:border-primary/30 hover:bg-muted/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.reason}</p>
                  {s.tip && (
                    <p className="text-[10px] text-primary/70 mt-1">💡 {s.tip}</p>
                  )}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
