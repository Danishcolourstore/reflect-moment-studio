import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { ALBUM_SIZES, LEAF_PRESETS, type AlbumSize, type CoverType } from './types';

interface NewAlbumWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; size: AlbumSize; leafCount: number; coverType: CoverType }) => void;
  loading?: boolean;
}

const STEPS = ['Album Name', 'Dimensions', 'Leaf Count', 'Cover Type'];

export default function NewAlbumWizard({ open, onOpenChange, onCreate, loading }: NewAlbumWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [size, setSize] = useState<AlbumSize>('12x12');
  const [leafPreset, setLeafPreset] = useState<string>('30');
  const [customLeaf, setCustomLeaf] = useState('');
  const [coverType, setCoverType] = useState<CoverType>('hardcover');

  const leafCount = leafPreset === 'custom'
    ? Math.max(10, Math.min(200, parseInt(customLeaf) || 10))
    : parseInt(leafPreset);

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 2 && leafPreset === 'custom') return customLeaf && parseInt(customLeaf) >= 10 && parseInt(customLeaf) <= 200;
    return true;
  };

  const handleCreate = () => {
    onCreate({ name: name.trim(), size, leafCount, coverType });
  };

  const reset = () => { setStep(0); setName(''); setSize('12x12'); setLeafPreset('30'); setCustomLeaf(''); setCoverType('hardcover'); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <BookOpen className="h-5 w-5 text-primary" />
            New Album — Step {step + 1} of 4
          </DialogTitle>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/50' : 'w-2 bg-muted'}`} />
          ))}
        </div>

        <div className="min-h-[200px] flex flex-col justify-center">
          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Album Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Aarav & Priya Wedding Album"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg"
                maxLength={100}
              />
            </div>
          )}

          {/* Step 1: Dimensions */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Album Dimensions</Label>
              <RadioGroup value={size} onValueChange={(v) => setSize(v as AlbumSize)} className="grid grid-cols-2 gap-3">
                {(Object.keys(ALBUM_SIZES) as AlbumSize[]).map((key) => {
                  const dim = ALBUM_SIZES[key];
                  return (
                    <label key={key} className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/50 ${size === key ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <RadioGroupItem value={key} className="sr-only" />
                      <div className="w-12 h-12 border-2 border-foreground/20 rounded" style={{ aspectRatio: `${dim.widthIn}/${dim.heightIn}` }} />
                      <span className="text-sm font-medium">{dim.label}</span>
                      <span className="text-xs text-muted-foreground">{dim.widthPx} × {dim.heightPx}px</span>
                    </label>
                  );
                })}
              </RadioGroup>
              <p className="text-xs text-muted-foreground text-center">Bleed: 3mm · Safe margin: 5mm</p>
            </div>
          )}

          {/* Step 2: Leaf Count */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Leaf Count</Label>
              <RadioGroup value={leafPreset} onValueChange={setLeafPreset} className="space-y-2">
                {LEAF_PRESETS.map((p) => (
                  <label key={p.leaves} className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all hover:border-primary/50 ${leafPreset === String(p.leaves) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <RadioGroupItem value={String(p.leaves)} />
                    <span className="font-medium">{p.label}</span>
                  </label>
                ))}
                <label className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all hover:border-primary/50 ${leafPreset === 'custom' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <RadioGroupItem value="custom" />
                  <span className="font-medium">Custom</span>
                  {leafPreset === 'custom' && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        type="number"
                        min={10}
                        max={200}
                        value={customLeaf}
                        onChange={(e) => setCustomLeaf(e.target.value)}
                        className="w-20 h-8 text-center"
                        placeholder="10-200"
                        autoFocus
                      />
                      <span className="text-xs text-muted-foreground">
                        = {(parseInt(customLeaf) || 0) * 2} Pages
                      </span>
                    </div>
                  )}
                </label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground text-center">
                1 Leaf = 2 Pages (front + back) · Cover page is separate
              </p>
            </div>
          )}

          {/* Step 3: Cover Type */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Cover Type</Label>
              <RadioGroup value={coverType} onValueChange={(v) => setCoverType(v as CoverType)} className="space-y-2">
                {([
                  { value: 'hardcover', label: 'Hardcover', desc: 'Premium rigid cover with padded finish' },
                  { value: 'softcover', label: 'Softcover', desc: 'Flexible cover, lightweight and elegant' },
                  { value: 'layflat', label: 'Layflat', desc: 'Pages lay completely flat when opened — ideal for spreads' },
                ] as const).map((opt) => (
                  <label key={opt.value} className={`flex flex-col rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/50 ${coverType === opt.value ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={opt.value} />
                      <span className="font-medium">{opt.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-7">{opt.desc}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)} disabled={loading}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading || !canNext()}>
              {loading ? 'Creating…' : `Create Album · ${leafCount} Leaf`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
