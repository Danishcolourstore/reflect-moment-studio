import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { LayoutGrid, Type, Ruler, Palette, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

import type { GridLayout } from "@/components/grid-builder/types";
import type { TextLayer } from "@/components/grid-builder/text-overlay-types";

import { createTextLayer, FONTS, FONT_GROUPS } from "@/components/grid-builder/text-overlay-types";

import { cn } from "@/lib/utils";

/* -----------------------------
ALBUM TEMPLATES (FIXED)
cells must be tuple
[number, number, number, number]
------------------------------ */

const ALBUM_TEMPLATES: {
  id: string;
  name: string;
  desc: string;
  layout: {
    gridCols: number;
    gridRows: number;
    cells: [number, number, number, number][];
  };
}[] = [
  {
    id: "full-bleed",
    name: "1 Photo — Full Bleed",
    desc: "Single photo fills the page",
    layout: {
      gridCols: 1,
      gridRows: 1,
      cells: [[1, 1, 2, 2]],
    },
  },

  {
    id: "h-split",
    name: "2 Photos — H Split",
    desc: "Two photos side by side",
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
    name: "2 Photos — V Split",
    desc: "Two photos stacked",
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
    id: "grid-3",
    name: "3 Photos — Grid",
    desc: "Three photo layout",
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
    id: "collage-4",
    name: "4 Photos — Collage",
    desc: "Four photo grid",
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
    id: "story",
    name: "Story Layout",
    desc: "Large photo + strip",
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
];

/* -----------------------------
PAPER TEXTURES
------------------------------ */

const PAPER_TEXTURES = [
  { id: "white", label: "White", color: "#ffffff" },
  { id: "cream", label: "Cream", color: "#F5F0E8" },
  { id: "linen", label: "Linen", color: "#EDE8DE" },
  { id: "dark", label: "Dark", color: "#1a1a1a" },
];

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

  onToggleBleed: () => void;
  onToggleSafe: () => void;
  onToggleSpine: () => void;

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

  const moveTextLayer = (direction: "up" | "down") => {
    if (!selectedText) return;

    const index = textLayers.findIndex((l) => l.id === selectedText.id);

    const newLayers = [...textLayers];

    if (direction === "up" && index > 0) {
      [newLayers[index - 1], newLayers[index]] = [newLayers[index], newLayers[index - 1]];
    }

    if (direction === "down" && index < textLayers.length - 1) {
      [newLayers[index + 1], newLayers[index]] = [newLayers[index], newLayers[index + 1]];
    }

    onReorderTextLayers(newLayers);
  };

  const textColor = bgColor === "#1a1a1a" ? "#ffffff" : "#1a1a1a";

  return (
    <div className="w-64 xl:w-72 border-l border-border bg-card flex flex-col">
      <Tabs defaultValue="layout" className="flex flex-col h-full">
        {/* Tabs header */}

        <TabsList className="border-b h-10 rounded-none">
          <TabsTrigger value="layout" className="flex-1 text-xs">
            <LayoutGrid className="h-3 w-3 mr-1" />
            Layout
          </TabsTrigger>

          <TabsTrigger value="text" className="flex-1 text-xs">
            <Type className="h-3 w-3 mr-1" />
            Text
          </TabsTrigger>

          <TabsTrigger value="guides" className="flex-1 text-xs">
            <Ruler className="h-3 w-3 mr-1" />
            Guides
          </TabsTrigger>

          <TabsTrigger value="page" className="flex-1 text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Page
          </TabsTrigger>
        </TabsList>

        {/* Layout tab */}

        <TabsContent value="layout" className="p-3 space-y-2">
          {ALBUM_TEMPLATES.map((t) => (
            <Button
              key={t.id}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onApplyTemplate(t.layout)}
            >
              {t.name}
            </Button>
          ))}
        </TabsContent>

        {/* Text tab */}

        <TabsContent value="text" className="p-3 space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              onAddText(
                createTextLayer({
                  text: "New Text",
                  color: textColor,
                }),
              )
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Text
          </Button>

          {selectedText && (
            <div className="space-y-3">
              <Input
                value={selectedText.text}
                onChange={(e) =>
                  onUpdateText(selectedText.id, {
                    text: e.target.value,
                  })
                }
              />

              <Label className="text-xs">Font</Label>

              <Select
                value={selectedText.fontFamily}
                onValueChange={(v) =>
                  onUpdateText(selectedText.id, {
                    fontFamily: v,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {FONT_GROUPS.map((g) => (
                    <div key={g.key}>
                      <div className="text-[10px] px-2 py-1 text-muted-foreground">{g.label}</div>

                      {FONTS.filter((f) => f.group === g.key).map((f) => (
                        <SelectItem key={f.family} value={f.family}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              <Label className="text-xs">Size {selectedText.fontSize}px</Label>

              <Slider
                value={[selectedText.fontSize]}
                min={8}
                max={80}
                step={1}
                onValueChange={([v]) =>
                  onUpdateText(selectedText.id, {
                    fontSize: v,
                  })
                }
              />

              <Label className="text-xs">Color</Label>

              <Input
                type="color"
                value={selectedText.color}
                onChange={(e) =>
                  onUpdateText(selectedText.id, {
                    color: e.target.value,
                  })
                }
              />

              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => moveTextLayer("up")}>
                  <ArrowUp className="h-3 w-3" />
                </Button>

                <Button size="icon" variant="ghost" onClick={() => moveTextLayer("down")}>
                  <ArrowDown className="h-3 w-3" />
                </Button>

                <Button size="icon" variant="ghost" onClick={() => onDeleteText(selectedText.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Guides tab */}

        <TabsContent value="guides" className="p-3 space-y-4">
          <div className="flex justify-between">
            <Label className="text-xs">Bleed</Label>
            <Switch checked={showBleed} onCheckedChange={onToggleBleed} />
          </div>

          <div className="flex justify-between">
            <Label className="text-xs">Safe Margin</Label>
            <Switch checked={showSafeMargin} onCheckedChange={onToggleSafe} />
          </div>

          <div className="flex justify-between">
            <Label className="text-xs">Spine</Label>
            <Switch checked={showSpine} onCheckedChange={onToggleSpine} />
          </div>
        </TabsContent>

        {/* Page tab */}

        <TabsContent value="page" className="p-3 space-y-4">
          <Label className="text-xs">Background</Label>

          <Input type="color" value={bgColor} onChange={(e) => onBgColorChange(e.target.value)} />

          <Label className="text-xs">Paper</Label>

          <div className="grid grid-cols-2 gap-2">
            {PAPER_TEXTURES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onPaperTextureChange(t.id);
                  onBgColorChange(t.color);
                }}
                className={cn("border rounded p-2", paperTexture === t.id && "border-primary")}
              >
                <div className="h-6 rounded" style={{ background: t.color }} />

                <span className="text-[10px]">{t.label}</span>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
