import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  LayoutGrid,
  Type,
  Ruler,
  Palette,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import type { GridLayout } from "@/components/grid-builder/types";
import type { TextLayer } from "@/components/grid-builder/text-overlay-types";
import {
  createTextLayer,
  FONTS,
  FONT_GROUPS,
} from "@/components/grid-builder/text-overlay-types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ─── Album Layout Templates ─── */

const ALBUM_TEMPLATES: {
  id: string;
  name: string;
  photoCount: number;
  layout: {
    gridCols: number;
    gridRows: number;
    cells: [number, number, number, number][];
  };
}[] = [
  {
    id: "full-bleed",
    name: "Full Bleed",
    photoCount: 1,
    layout: { gridCols: 1, gridRows: 1, cells: [[1, 1, 2, 2]] },
  },
  {
    id: "h-split",
    name: "2 — Side by Side",
    photoCount: 2,
    layout: {
      gridCols: 2,
      gridRows: 1,
      cells: [
        [1, 1, 2, 2],
        [1, 2, 2, 3],
      ],
    },
  },
  {
    id: "v-split",
    name: "2 — Stacked",
    photoCount: 2,
    layout: {
      gridCols: 1,
      gridRows: 2,
      cells: [
        [1, 1, 2, 2],
        [2, 1, 3, 2],
      ],
    },
  },
  {
    id: "trio",
    name: "3 — Rows",
    photoCount: 3,
    layout: {
      gridCols: 1,
      gridRows: 3,
      cells: [
        [1, 1, 2, 2],
        [2, 1, 3, 2],
        [3, 1, 4, 2],
      ],
    },
  },
  {
    id: "grid-4",
    name: "4 — Grid",
    photoCount: 4,
    layout: {
      gridCols: 2,
      gridRows: 2,
      cells: [
        [1, 1, 2, 2],
        [1, 2, 2, 3],
        [2, 1, 3, 2],
        [2, 2, 3, 3],
      ],
    },
  },
  {
    id: "hero-strip",
    name: "Hero + Strip",
    photoCount: 3,
    layout: {
      gridCols: 2,
      gridRows: 3,
      cells: [
        [1, 1, 3, 3],
        [3, 1, 4, 2],
        [3, 2, 4, 3],
      ],
    },
  },
  {
    id: "hero-4",
    name: "Hero + 4",
    photoCount: 5,
    layout: {
      gridCols: 2,
      gridRows: 3,
      cells: [
        [1, 1, 2, 3],
        [2, 1, 3, 2],
        [2, 2, 3, 3],
        [3, 1, 4, 2],
        [3, 2, 4, 3],
      ],
    },
  },
  {
    id: "magazine",
    name: "Magazine",
    photoCount: 4,
    layout: {
      gridCols: 3,
      gridRows: 2,
      cells: [
        [1, 1, 3, 2],
        [1, 2, 2, 4],
        [2, 2, 3, 3],
        [2, 3, 3, 4],
      ],
    },
  },
  {
    id: "collage-6",
    name: "6 — Collage",
    photoCount: 6,
    layout: {
      gridCols: 3,
      gridRows: 2,
      cells: [
        [1, 1, 2, 2],
        [1, 2, 2, 3],
        [1, 3, 2, 4],
        [2, 1, 3, 2],
        [2, 2, 3, 3],
        [2, 3, 3, 4],
      ],
    },
  },
];

/* ─── Mini Grid Preview ─── */

function LayoutMini({
  layout,
  active,
}: {
  layout: { gridCols: number; gridRows: number; cells: [number, number, number, number][] };
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded border-2 transition-colors flex-shrink-0",
        active ? "border-primary bg-primary/10" : "border-border bg-muted/30"
      )}
      style={{
        width: "56px",
        height: "40px",
        display: "grid",
        gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.gridRows}, 1fr)`,
        gap: "2px",
        padding: "3px",
      }}
    >
      {layout.cells.map((area, i) => (
        <div
          key={i}
          className={cn(
            "rounded-[1px]",
            active ? "bg-primary/50" : "bg-foreground/25"
          )}
          style={{
            gridArea: `${area[0]} / ${area[1]} / ${area[2]} / ${area[3]}`,
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
  onApplyTemplate: (layout: Partial<GridLayout>) => void;
  textLayers: TextLayer[];
  selectedTextId: string | null;
  onAddText: (layer: TextLayer) => void;
  onUpdateText: (id: string, patch: Partial<TextLayer>) => void;
  onDeleteText: (id: string) => void;
  onReorderTextLayers: (layers: TextLayer[]) => void;
  showBleed: boolean;
  showSafeMargin: boolean;
  showSpine: boolean;
  onToggleBleed: (v: boolean) => void;
  onToggleSafe: (v: boolean) => void;
  onToggleSpine: (v: boolean) => void;
  bgColor: string;
  onBgColorChange: (c: string) => void;
  paperTexture: string;
  onPaperTextureChange: (t: string) => void;
}

export default function AlbumRightPanel({
  onApplyTemplate,
  textLayers,
  selectedTextId,
  onAddText,
  onUpdateText,
  onDeleteText,
  onReorderTextLayers,
  showBleed,
  showSafeMargin,
  showSpine,
  onToggleBleed,
  onToggleSafe,
  onToggleSpine,
  bgColor,
  onBgColorChange,
  paperTexture,
  onPaperTextureChange,
}: Props) {
  const selectedText = textLayers.find((l) => l.id === selectedTextId);
  const textColor = "#000000";

  const moveTextLayer = (direction: "up" | "down") => {
    if (!selectedText) return;
    const index = textLayers.findIndex((l) => l.id === selectedText.id);
    const newLayers = [...textLayers];
    if (direction === "up" && index > 0) {
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
    }
    if (direction === "down" && index < textLayers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
    }
    onReorderTextLayers(newLayers);
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <Tabs defaultValue="layout" className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b h-9 bg-muted/30 flex-shrink-0">
          <TabsTrigger value="layout" className="flex-1 text-xs gap-1">
            <LayoutGrid className="h-3 w-3" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1 text-xs gap-1">
            <Type className="h-3 w-3" />
            Text
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex-1 text-xs gap-1">
            <Ruler className="h-3 w-3" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="page" className="flex-1 text-xs gap-1">
            <Palette className="h-3 w-3" />
            Page
          </TabsTrigger>
        </TabsList>

        {/* ─── Layout Tab ─── */}
        <TabsContent value="layout" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Page Layouts
              </p>
              {ALBUM_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onApplyTemplate(t.layout)}
                  className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors text-left group border border-transparent hover:border-border"
                >
                  <LayoutMini layout={t.layout} active={false} />
                  <div>
                    <p className="text-xs font-medium group-hover:text-primary transition-colors">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.photoCount} {t.photoCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Text Tab ─── */}
        <TabsContent value="text" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  onAddText(createTextLayer({ text: "New Text", color: textColor }))
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Text
              </Button>

              {textLayers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Layers
                  </p>
                  {textLayers.map((layer) => (
                    <button
                      key={layer.id}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-xs truncate transition-colors",
                        layer.id === selectedTextId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {layer.text}
                    </button>
                  ))}
                </div>
              )}

              {selectedText && (
                <div className="space-y-3 border-t pt-3">
                  <Input
                    value={selectedText.text}
                    onChange={(e) =>
                      onUpdateText(selectedText.id, { text: e.target.value })
                    }
                    className="text-sm"
                    placeholder="Enter text…"
                  />

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Font</Label>
                    <Select
                      value={selectedText.fontFamily}
                      onValueChange={(v) =>
                        onUpdateText(selectedText.id, { fontFamily: v })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_GROUPS.map((g) => (
                          <div key={g.key}>
                            <div className="text-[10px] px-2 py-1 text-muted-foreground font-medium">
                              {g.label}
                            </div>
                            {FONTS.filter((f) => f.group === g.key).map((f) => (
                              <SelectItem key={f.family} value={f.family}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Size — {selectedText.fontSize}px
                    </Label>
                    <Slider
                      value={[selectedText.fontSize]}
                      min={8}
                      max={80}
                      step={1}
                      onValueChange={([v]) =>
                        onUpdateText(selectedText.id, { fontSize: v })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <Input
                      type="color"
                      value={selectedText.color}
                      onChange={(e) =>
                        onUpdateText(selectedText.id, { color: e.target.value })
                      }
                      className="h-8 w-full"
                    />
                  </div>

                  <div className="flex gap-1 pt-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveTextLayer("up")}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => moveTextLayer("down")}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => onDeleteText(selectedText.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
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
                <Label className="text-xs">Spine Line</Label>
                <p className="text-[10px] text-muted-foreground">Center spine in spread view</p>
              </div>
              <Switch checked={showSpine} onCheckedChange={onToggleSpine} />
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
                onChange={(e) => onBgColorChange(e.target.value)}
                className="h-8 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Paper Texture</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAPER_TEXTURES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onPaperTextureChange(t.id);
                      onBgColorChange(t.color);
                    }}
                    className={cn(
                      "border-2 rounded-lg p-2.5 transition-all text-center",
                      paperTexture === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div
                      className="h-6 rounded mb-1"
                      style={{ background: t.color }}
                    />
                    <span className="text-[10px] font-medium">{t.label}</span>
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