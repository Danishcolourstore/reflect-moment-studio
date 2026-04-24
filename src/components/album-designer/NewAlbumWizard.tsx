import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronLeft, ChevronRight, BookOpen, Upload, ImageIcon, X } from "lucide-react";
import { useEffect } from "react";
import { SPREAD_SIZES, LEAF_PRESETS, type AlbumSize, type CoverType } from "./types";
import { cn } from "@/lib/utils";

interface NewAlbumWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; size: AlbumSize; leafCount: number; coverType: CoverType; files: File[] }) => void;
  loading?: boolean;
}

const STEPS = ["Album Name", "Photos", "Spread Size", "Leaf Count", "Cover Type"];

export default function NewAlbumWizard({ open, onOpenChange, onCreate, loading }: NewAlbumWizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [size, setSize] = useState<AlbumSize>("12x36");
  const [leafPreset, setLeafPreset] = useState("20");
  const [customLeaf, setCustomLeaf] = useState("");
  const [coverType, setCoverType] = useState<CoverType>("hardcover");

  const reset = () => {
    setStep(0); setName(""); setSize("12x36");
    setFiles([]); setLeafPreset("20"); setCustomLeaf(""); setCoverType("hardcover");
  };

  useEffect(() => { if (!open) reset(); }, [open]);

  const parsedCustom = parseInt(customLeaf) || 0;
  const leafCount = leafPreset === "custom" ? Math.max(10, Math.min(200, parsedCustom || 10)) : parseInt(leafPreset);

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 3 && leafPreset === "custom") return parsedCustom >= 10 && parsedCustom <= 200;
    return true;
  };

  const handleCreate = () => {
    onCreate({ name: name.trim() || "New Album", size, leafCount, coverType, files });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step < 4 && canNext()) setStep(step + 1);
  };

  const addFiles = (list: FileList | null) => {
    const next = Array.from(list || []).filter((file) => file.type.startsWith("image/"));
    if (next.length) setFiles((current) => [...current, ...next]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <BookOpen className="h-5 w-5 text-primary" />
            New Album — Step {step + 1} of 5
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/50" : "w-2 bg-muted"}`} />
          ))}
        </div>

        <div className="min-h-[220px] flex flex-col justify-center" onKeyDown={handleKey}>
          {step === 0 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Album Name</Label>
              <Input autoFocus placeholder="e.g. Aarav & Priya Wedding Album" value={name}
                onChange={e => setName(e.target.value)} className="text-lg" maxLength={100} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Photos</Label>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "w-full min-h-32 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center transition-colors",
                  "hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <Upload className="mx-auto h-6 w-6 text-primary" />
                <span className="mt-3 block text-sm font-medium text-foreground">Upload album photos</span>
                <span className="mt-1 block text-xs text-muted-foreground">You can also skip and add photos later.</span>
              </button>
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    {files.length} selected
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 max-h-28 overflow-y-auto">
                    {files.slice(0, 25).map((file, index) => (
                      <div key={`${file.name}-${file.size}-${index}`} className="relative aspect-square overflow-hidden rounded bg-muted">
                        <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Spread Size (Height × Width)</Label>
              <RadioGroup value={size} onValueChange={v => setSize(v as AlbumSize)} className="grid grid-cols-2 gap-3">
                {(Object.keys(SPREAD_SIZES) as AlbumSize[]).map(key => {
                  const dim = SPREAD_SIZES[key];
                  return (
                    <label key={key} className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/50 ${size === key ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value={key} className="sr-only" />
                      <div className="w-16 border-2 border-foreground/20 rounded" style={{ aspectRatio: `${dim.spreadWidthIn}/${dim.spreadHeightIn}` }} />
                      <span className="text-sm font-medium">{dim.label}</span>
                      <span className="text-xs text-muted-foreground">{dim.spreadWidthPx} × {dim.spreadHeightPx}px</span>
                    </label>
                  );
                })}
              </RadioGroup>
              <p className="text-xs text-muted-foreground text-center">Bleed: 3mm · Safe margin: 5mm</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Leaf Count (1 leaf = 1 spread)</Label>
              <RadioGroup value={leafPreset} onValueChange={setLeafPreset} className="space-y-2">
                {LEAF_PRESETS.map(p => (
                  <label key={p.leaves} className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all hover:border-primary/50 ${leafPreset === String(p.leaves) ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value={String(p.leaves)} />
                    <span className="font-medium">{p.label}</span>
                  </label>
                ))}
                <label className={`flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all hover:border-primary/50 ${leafPreset === "custom" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="custom" />
                  <span className="font-medium">Custom</span>
                  {leafPreset === "custom" && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input type="number" min={10} max={200} value={customLeaf}
                        onChange={e => setCustomLeaf(e.target.value)} className="w-20 h-8 text-center" placeholder="10-200" autoFocus />
                      <span className="text-xs text-muted-foreground">= {(parsedCustom || 0)} Spreads</span>
                    </div>
                  )}
                </label>
              </RadioGroup>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-sm text-muted-foreground">Cover Type</Label>
              <RadioGroup value={coverType} onValueChange={v => setCoverType(v as CoverType)} className="space-y-2">
                {[
                  { value: "hardcover", label: "Hardcover", desc: "Premium rigid cover" },
                  { value: "softcover", label: "Softcover", desc: "Flexible cover" },
                  { value: "layflat", label: "Layflat", desc: "Pages open completely flat" },
                ].map(opt => (
                  <label key={opt.value} className={`flex flex-col rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/50 ${coverType === opt.value ? "border-primary bg-primary/5" : "border-border"}`}>
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

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)} disabled={loading}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading || !canNext()}>
              {loading ? "Creating…" : `Create Album · ${leafCount} Spreads`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
