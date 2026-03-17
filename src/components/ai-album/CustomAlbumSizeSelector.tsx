import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ruler, Save, AlertTriangle, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IndianAlbumSize, AlbumSizeSpec } from "./ai-album-types";
import { INDIAN_ALBUM_SIZES } from "./ai-album-types";

/* ─── Extended presets including square ─── */
const PRESET_CHIPS: Array<{ id: string; label: string; w: number; h: number }> = [
  { id: "12x36", label: "12×36", w: 36, h: 12 },
  { id: "12x30", label: "12×30", w: 30, h: 12 },
  { id: "10x30", label: "10×30", w: 30, h: 10 },
  { id: "12x24", label: "12×24", w: 24, h: 12 },
  { id: "8x24", label: "8×24", w: 24, h: 8 },
  { id: "10x24", label: "10×24", w: 24, h: 10 },
  { id: "12x12", label: "12×12", w: 12, h: 12 },
  { id: "10x10", label: "10×10", w: 10, h: 10 },
];

const MIN_SIZE = 6;
const MAX_SIZE = 48;
const DPI = 300;

export interface CustomSizeState {
  widthIn: number;
  heightIn: number;
  presetId: string | null;
  printMode: boolean;
  bleedMm: number;
  savedPresets: Array<{ name: string; w: number; h: number }>;
}

interface Props {
  value: CustomSizeState;
  onChange: (v: CustomSizeState) => void;
}

export function getDefaultSizeState(autoSize: IndianAlbumSize): CustomSizeState {
  const spec = INDIAN_ALBUM_SIZES[autoSize];
  return {
    widthIn: spec.widthIn,
    heightIn: spec.heightIn,
    presetId: autoSize,
    printMode: false,
    bleedMm: 3,
    savedPresets: [],
  };
}

export function sizeToSpec(state: CustomSizeState): AlbumSizeSpec {
  const { widthIn, heightIn, bleedMm, printMode } = state;
  const bl = printMode ? bleedMm : 0;
  return {
    label: `${heightIn} × ${widthIn} inches`,
    widthIn,
    heightIn,
    widthPx: widthIn * DPI,
    heightPx: heightIn * DPI,
    bleedMm: bl,
    safeMarginMm: printMode ? 5 : 0,
    aspectLabel: `${widthIn / gcd(widthIn, heightIn)}:${heightIn / gcd(widthIn, heightIn)}`,
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export default function CustomAlbumSizeSelector({ value, onChange }: Props) {
  const [unit, setUnit] = useState<"in" | "mm">("in");
  const [customW, setCustomW] = useState(String(value.widthIn));
  const [customH, setCustomH] = useState(String(value.heightIn));
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const isCustom = value.presetId === null;
  const displayW = unit === "mm" ? Math.round(value.widthIn * 25.4) : value.widthIn;
  const displayH = unit === "mm" ? Math.round(value.heightIn * 25.4) : value.heightIn;

  const selectPreset = (chip: typeof PRESET_CHIPS[0]) => {
    setCustomW(String(chip.w));
    setCustomH(String(chip.h));
    onChange({ ...value, widthIn: chip.w, heightIn: chip.h, presetId: chip.id });
  };

  const applyCustom = (wStr: string, hStr: string) => {
    const scale = unit === "mm" ? 1 / 25.4 : 1;
    const w = Math.round(parseFloat(wStr || "0") * scale * 10) / 10;
    const h = Math.round(parseFloat(hStr || "0") * scale * 10) / 10;
    if (w >= MIN_SIZE && w <= MAX_SIZE && h >= MIN_SIZE && h <= MAX_SIZE) {
      onChange({ ...value, widthIn: w, heightIn: h, presetId: null });
    }
  };

  const warnings = useMemo(() => {
    const msgs: string[] = [];
    const ratio = value.widthIn / value.heightIn;
    if (ratio > 4.5) msgs.push("Very wide ratio — layouts may feel stretched");
    if (ratio < 0.8) msgs.push("Portrait-tall ratio — not standard for print albums");
    if (value.widthIn < 8 || value.heightIn < 6) msgs.push("Small dimensions — print quality may suffer");
    return msgs;
  }, [value.widthIn, value.heightIn]);

  const spec = sizeToSpec(value);
  const canvasAR = value.widthIn / value.heightIn;

  const saveAsPreset = () => {
    if (!presetName.trim()) return;
    const newPresets = [...value.savedPresets, { name: presetName.trim(), w: value.widthIn, h: value.heightIn }];
    onChange({ ...value, savedPresets: newPresets });
    setPresetName("");
    setSaveDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Section title */}
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-serif font-semibold text-foreground tracking-wide">Album Size</h3>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {PRESET_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => selectPreset(chip)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all border",
              value.presetId === chip.id
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {chip.label}″
          </button>
        ))}
        {value.savedPresets.map((sp, i) => (
          <button
            key={`saved-${i}`}
            onClick={() => {
              setCustomW(String(sp.w));
              setCustomH(String(sp.h));
              onChange({ ...value, widthIn: sp.w, heightIn: sp.h, presetId: null });
            }}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide transition-all border",
              value.widthIn === sp.w && value.heightIn === sp.h && !value.presetId
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
          >
            {sp.name}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Height {unit === "mm" ? "(mm)" : "(inches)"}
          </Label>
          <Input
            type="number"
            min={unit === "mm" ? MIN_SIZE * 25.4 : MIN_SIZE}
            max={unit === "mm" ? MAX_SIZE * 25.4 : MAX_SIZE}
            step={unit === "mm" ? 10 : 0.5}
            placeholder={unit === "mm" ? "305" : "12"}
            value={customH}
            onChange={(e) => {
              setCustomH(e.target.value);
              applyCustom(customW, e.target.value);
            }}
            className="h-10 bg-transparent border-border/60 text-center font-medium"
          />
        </div>
        <span className="text-muted-foreground text-lg font-light pb-2">×</span>
        <div className="flex-1 space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Width {unit === "mm" ? "(mm)" : "(inches)"}
          </Label>
          <Input
            type="number"
            min={unit === "mm" ? MIN_SIZE * 25.4 : MIN_SIZE}
            max={unit === "mm" ? MAX_SIZE * 25.4 : MAX_SIZE}
            step={unit === "mm" ? 10 : 0.5}
            placeholder={unit === "mm" ? "914" : "36"}
            value={customW}
            onChange={(e) => {
              setCustomW(e.target.value);
              applyCustom(e.target.value, customH);
            }}
            className="h-10 bg-transparent border-border/60 text-center font-medium"
          />
        </div>
        <div className="flex gap-1 pb-0.5">
          <button
            onClick={() => setUnit("in")}
            className={cn("px-2 py-1.5 text-[10px] rounded-md transition-colors", unit === "in" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground")}
          >
            in
          </button>
          <button
            onClick={() => setUnit("mm")}
            className={cn("px-2 py-1.5 text-[10px] rounded-md transition-colors", unit === "mm" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground")}
          >
            mm
          </button>
        </div>
      </div>

      {/* Live Canvas Preview */}
      <div className="flex gap-4 items-start">
        <div className="flex-1">
          <div
            className="relative border border-border/40 bg-card rounded-sm mx-auto transition-all duration-300"
            style={{
              aspectRatio: `${canvasAR}`,
              maxWidth: '100%',
              maxHeight: 120,
              width: canvasAR > 2 ? '100%' : undefined,
              height: canvasAR <= 2 ? 120 : undefined,
            }}
          >
            {/* Bleed area */}
            {value.printMode && (
              <div
                className="absolute inset-0 border border-dashed border-destructive/30 rounded-sm pointer-events-none"
                style={{
                  margin: -((value.bleedMm / 25.4) * DPI / (spec.widthPx / 200)),
                }}
              />
            )}
            {/* Safe margin */}
            {value.printMode && (
              <div
                className="absolute border border-dashed border-primary/25 pointer-events-none"
                style={{ inset: '8%' }}
              />
            )}
            {/* Center info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-medium text-foreground/70">{displayH} × {displayW} {unit}</span>
              <span className="text-[8px] text-muted-foreground">{spec.widthPx} × {spec.heightPx} px</span>
              <span className="text-[8px] text-muted-foreground">300 DPI</span>
            </div>
          </div>

          {/* Labels */}
          {value.printMode && (
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-px border-t border-dashed border-destructive/40" />
                <span className="text-[8px] text-muted-foreground">Bleed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-px border-t border-dashed border-primary/30" />
                <span className="text-[8px] text-muted-foreground">Safe</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="space-y-3 shrink-0 w-36">
          {/* Print Mode Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Printer className="h-3 w-3" /> Print Mode
            </Label>
            <Switch
              checked={value.printMode}
              onCheckedChange={(c) => onChange({ ...value, printMode: c, bleedMm: c ? 3 : 0 })}
              className="scale-75 origin-right"
            />
          </div>

          {value.printMode && (
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Bleed</Label>
              <div className="flex gap-1">
                {[3, 4, 5].map((mm) => (
                  <button
                    key={mm}
                    onClick={() => onChange({ ...value, bleedMm: mm })}
                    className={cn(
                      "flex-1 py-1 text-[10px] rounded-md border transition-colors",
                      value.bleedMm === mm
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mm}mm
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save as Preset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="w-full text-[10px] h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Save className="h-3 w-3" /> Save as Preset
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-amber-500/80">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">Save Custom Size</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Save {value.heightIn}×{value.widthIn}″ as a reusable preset
            </p>
            <Input
              placeholder='e.g. "Kerala Wedding 12×36"'
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="h-10"
              maxLength={40}
              onKeyDown={(e) => e.key === "Enter" && saveAsPreset()}
            />
            <Button onClick={saveAsPreset} disabled={!presetName.trim()} className="w-full">
              Save Preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
