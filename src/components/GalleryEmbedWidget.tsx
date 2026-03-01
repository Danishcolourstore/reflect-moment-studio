import { useState } from 'react';
import { Camera, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GalleryEmbedWidgetProps {
  eventSlug: string;
  eventTitle: string;
  coverUrl: string | null;
  photoCount: number;
  eventDate: string;
}

export function GalleryEmbedWidget({ eventSlug, eventTitle, coverUrl, photoCount, eventDate }: GalleryEmbedWidgetProps) {
  const [size, setSize] = useState<'320' | '480' | '640'>('320');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showCount, setShowCount] = useState(true);
  const [showDate, setShowDate] = useState(true);

  const baseUrl = window.location.origin;
  const widgetUrl = `${baseUrl}/widget/${eventSlug}?theme=${theme}&size=${size}&showCount=${showCount}&showDate=${showDate}`;
  const embedCode = `<iframe src="${widgetUrl}" width="${size}" height="400" frameborder="0" style="border-radius:12px" allowfullscreen></iframe>`;

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 font-medium">EMBED GALLERY WIDGET</p>

      {/* Preview */}
      <div className="border border-border rounded-xl overflow-hidden bg-card" style={{ width: '320px' }}>
        <div className="aspect-[3/2] bg-secondary overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full flex items-center justify-center"><Camera className="h-8 w-8 text-muted-foreground/15" /></div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-serif text-sm font-semibold text-foreground">{eventTitle}</h3>
          {showDate && <p className="text-[10px] text-muted-foreground mt-0.5">{eventDate}</p>}
          {showCount && <p className="text-[10px] text-muted-foreground">{photoCount} photos</p>}
          <Button size="sm" className="mt-2 w-full bg-primary text-primary-foreground text-[10px] h-7">View Gallery</Button>
        </div>
      </div>

      {/* Size selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Size:</span>
        {(['320', '480', '640'] as const).map(s => (
          <button key={s} onClick={() => setSize(s)}
            className={`px-3 py-1 rounded-full text-[11px] border transition-colors ${size === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {s}px
          </button>
        ))}
      </div>

      {/* Theme */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Theme:</span>
        {(['light', 'dark'] as const).map(t => (
          <button key={t} onClick={() => setTheme(t)}
            className={`px-3 py-1 rounded-full text-[11px] border transition-colors capitalize ${theme === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-foreground/30'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Embed code */}
      <div className="space-y-2">
        <textarea readOnly value={embedCode} className="w-full h-20 bg-background border border-border rounded-md p-2 text-[11px] font-mono text-muted-foreground resize-none" />
        <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => { navigator.clipboard.writeText(embedCode); toast.success('Embed code copied'); }}>
          <Copy className="h-3 w-3 mr-1" /> Copy Embed Code
        </Button>
      </div>
    </div>
  );
}
