import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { LayoutGrid, Ruler, Palette } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ALBUM_PRESETS, type LayoutPreset, type SpreadFrame, createFrame } from "./types";

/* ─── Preset Mini Preview ─── */

function PresetMini({ preset, active }: { preset: LayoutPreset; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded border-2 transition-colors flex-shrink-0 relative",
        active ? "border-primary bg-primary/10" : "border-border bg-muted/30"
      )}
      style={{ width: "72px", height: "24px" }}
    >
      {preset.frames.map((f, i) => (
        <div
          key={i}
          className={cn("absolute rounded-[1px]", active ? "bg-primary/50" : "bg-foreground/25")}
          style={{
            left: `${f.x}%`, top: `${f.y}%`,
            width: `${f.w}%`, height: `${f.h}%`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Paper Textures ─── */

const PAPER_TEXTURES = [
  { id: "white", label: "White", color: "#ffffff" },
  { id: "cream", label: "Cream", color: "#F5F0E8" },
  { id: "linen", label: "Linen", color: "#EDE8DE" },
  { id: "dark", label: "Dark", color: "#1a1a1a" },
];

/* ─── Props ─── */

interface Props {
  currentPresetId: string | null;
  onApplyPreset: (preset: LayoutPreset) => void;
  showBleed: boolean;
  showSafeMargin: boolean;
  showGrid: boolean;
  onToggleBleed: (v: boolean) => void;
  onToggleSafe: (v: boolean) => void;
  onToggleGrid: (v: boolean) => void;
  bgColor: string;
  onBgColorChange: (c: string) => void;
  paperTexture: string;
  onPaperTextureChange: (t: string) => void;
}

export default function AlbumRightPanel({
  currentPresetId,
  onApplyPreset,
  showBleed,
  showSafeMargin,
  showGrid,
  onToggleBleed,
  onToggleSafe,
  onToggleGrid,
  bgColor,
  onBgColorChange,
  paperTexture,
  onPaperTextureChange,
}: Props) {
  const categories = [
    { key: "hero", label: "Hero" },
    { key: "grid", label: "Grid" },
    { key: "portrait", label: "Portrait" },
    { key: "panorama", label: "Panorama" },
    { key: "collage", label: "Collage" },
    { key: "mixed", label: "Mixed" },
  ];

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <Tabs defaultValue="layout" className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b h-9 bg-muted/30 flex-shrink-0">
          <TabsTrigger value="layout" className="flex-1 text-xs gap-1">
            <LayoutGrid className="h-3 w-3" /> Presets
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex-1 text-xs gap-1">
            <Ruler className="h-3 w-3" /> Guides
          </TabsTrigger>
          <TabsTrigger value="page" className="flex-1 text-xs gap-1">
            <Palette className="h-3 w-3" /> Page
          </TabsTrigger>
        </TabsList>

        {/* ─── Presets Tab ─── */}
        <TabsContent value="layout" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {categories.map(cat => {
                const presets = ALBUM_PRESETS.filter(p => p.category === cat.key);
                if (presets.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                      {cat.label}
                    </p>
                    <div className="space-y-1">
                      {presets.map(p => (
                        <button
                          key={p.id}
                          onClick={() => onApplyPreset(p)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-lg px-2 py-2 transition-colors text-left group border",
                            currentPresetId === p.id
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:border-border hover:bg-accent/50"
                          )}
                        >
                          <PresetMini preset={p} active={currentPresetId === p.id} />
                          <div>
                            <p className="text-xs font-medium group-hover:text-primary transition-colors">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {p.photoCount} {p.photoCount === 1 ? "photo" : "photos"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Guides Tab ─── */}
        <TabsContent value="guides" className="m-0">
          <div className="p-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Bleed Line</Label>
                <p className="text-[10px] text-muted-foreground">3mm bleed area</p>
              </div>
              <Switch checked={showBleed} onCheckedChange={onToggleBleed} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Safe Margin</Label>
                <p className="text-[10px] text-muted-foreground">5mm safe zone</p>
              </div>
              <Switch checked={showSafeMargin} onCheckedChange={onToggleSafe} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Grid Overlay</Label>
                <p className="text-[10px] text-muted-foreground">10% grid lines</p>
              </div>
              <Switch checked={showGrid} onCheckedChange={onToggleGrid} />
            </div>
          </div>
        </TabsContent>

        {/* ─── Page Tab ─── */}
        <TabsContent value="page" className="m-0">
          <div className="p-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Background Color</Label>
              <Input
                type="color"
                value={bgColor}
                onChange={e => onBgColorChange(e.target.value)}
                className="h-8 w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Paper Texture</Label>
              <div className="grid grid-cols-4 gap-2">
                {PAPER_TEXTURES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onPaperTextureChange(t.id);
                      onBgColorChange(t.color);
                    }}
                    className={cn(
                      "rounded-lg border-2 p-2 text-center transition-all",
                      paperTexture === t.id
                        ? "border-primary"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <div
                      className="h-6 w-full rounded"
                      style={{ background: t.color }}
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
