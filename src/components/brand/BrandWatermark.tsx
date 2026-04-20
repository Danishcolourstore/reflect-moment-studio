import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, X, Droplets } from 'lucide-react';

const POSITIONS = [
  { value: 'center', label: 'Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'diagonal', label: 'Diagonal Repeat' },
];

const positionStyles: Record<string, React.CSSProperties> = {
  'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'bottom-right': { bottom: '8%', right: '8%' },
  'bottom-left': { bottom: '8%', left: '8%' },
  'top-right': { top: '8%', right: '8%' },
  'top-left': { top: '8%', left: '8%' },
  'diagonal': { top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)' },
};

interface Props {
  watermarkUrl: string | null;
  opacity: number;
  position: string;
  studioName: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onOpacityChange: (v: number) => void;
  onPositionChange: (v: string) => void;
  uploading: boolean;
}

const BrandWatermark = ({ watermarkUrl, opacity, position, studioName, onUpload, onRemove, onOpacityChange, onPositionChange, uploading }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium mb-4">WATERMARK LOGO</p>
        <input ref={fileRef} type="file" accept="image/png,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }} />
        {watermarkUrl ? (
          <div className="space-y-2">
            <div className="bg-[#1a1a1a] rounded-lg p-4 flex items-center justify-center">
              <img src={watermarkUrl} alt="Watermark" className="h-12 object-contain opacity-60" loading="lazy" decoding="async" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-[10px] h-7">
                {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Replace
              </Button>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 text-destructive" onClick={onRemove}>
                <X className="mr-1 h-3 w-3" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-[10px] h-8">
            {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />} Upload Watermark (PNG/SVG)
          </Button>
        )}
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Opacity — {opacity}%</label>
        <Slider
          value={[opacity]}
          onValueChange={([v]) => onOpacityChange(v)}
          min={5}
          max={80}
          step={5}
          className="mt-3"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">Position</label>
        <Select value={position} onValueChange={onPositionChange}>
          <SelectTrigger className="mt-1 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            {POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Live preview */}
      <div className="border border-border rounded-xl overflow-hidden">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/40 font-medium px-4 pt-3 pb-2">PREVIEW</p>
        <div className="relative aspect-[3/2] bg-gradient-to-br from-muted/30 to-muted/10 mx-4 mb-4 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Droplets className="h-8 w-8 text-muted-foreground/10" />
          </div>
          {watermarkUrl ? (
            <img
              src={watermarkUrl}
              alt=""
              className="absolute max-w-[30%] max-h-[20%] object-contain pointer-events-none"
              style={{
                opacity: opacity / 100,
                ...positionStyles[position],
              }} loading="lazy" decoding="async" />
          ) : (
            <p
              className="absolute text-foreground/30 text-[10px] font-medium uppercase tracking-[0.2em] pointer-events-none"
              style={{
                opacity: opacity / 100,
                ...positionStyles[position],
              }}
            >
              {studioName || 'Studio'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandWatermark;
