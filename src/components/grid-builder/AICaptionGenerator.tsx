/**
 * AI Caption & Hashtag Generator panel for Instagram tools.
 */

import { useState } from 'react';
import { Sparkles, Copy, Check, Hash, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  photoCount?: number;
  onClose?: () => void;
}

export default function AICaptionGenerator({ photoCount = 1, onClose }: Props) {
  const [context, setContext] = useState('');
  const [style, setStyle] = useState('wedding photography');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<'caption' | 'hashtags' | null>(null);

  const STYLES = [
    'wedding photography', 'portrait session', 'engagement shoot',
    'event coverage', 'landscape', 'street photography',
    'product shoot', 'editorial fashion', 'family session',
  ];

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: { context, photoCount, style },
      });
      if (error) throw error;
      setCaption(data.caption || '');
      setHashtags(data.hashtags || '');
    } catch (e: any) {
      if (e?.status === 429) toast.error('Too many requests — try again shortly');
      else if (e?.status === 402) toast.error('AI credits needed');
      else toast.error('Could not generate caption');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'caption' | 'hashtags') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Caption Generator</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X size={16} strokeWidth={1.5} /></button>
        )}
      </div>

      {/* Context input */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mb-1">
          Describe the post
        </label>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          placeholder="e.g. Golden hour couple portraits at vineyard wedding..."
          className="w-full rounded-lg border border-border bg-background text-foreground text-xs p-2.5 resize-none h-16 focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Style chips */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold block mb-1.5">
          Style
        </label>
        <div className="flex flex-wrap gap-1">
          {STYLES.map(s => (
            <button
              key={s}
              onClick={() => setStyle(s)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                style === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generate} disabled={loading} className="w-full gap-2" size="sm">
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? 'Generating…' : 'Generate Caption'}
      </Button>

      {/* Results */}
      {caption && (
        <div className="space-y-3">
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Caption</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {caption}
            </div>
            <button
              onClick={() => copyToClipboard(caption, 'caption')}
              className="absolute top-6 right-2 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === 'caption' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {hashtags && (
            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Hashtags</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-primary/80 leading-relaxed break-all">
                {hashtags}
              </div>
              <button
                onClick={() => copyToClipboard(hashtags, 'hashtags')}
                className="absolute top-6 right-2 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === 'hashtags' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}

          <button
            onClick={() => copyToClipboard(`${caption}\n\n${hashtags}`, 'caption')}
            className="w-full py-2 rounded-lg bg-muted text-foreground text-[10px] font-medium uppercase tracking-widest hover:bg-muted/80 transition-colors"
          >
            Copy All
          </button>
        </div>
      )}
    </div>
  );
}
