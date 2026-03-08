import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, Type, Ruler, Palette, Plus } from 'lucide-react';
import type { GridLayout } from '@/components/grid-builder/types';
import type { TextLayer } from '@/components/grid-builder/text-overlay-types';
import { createTextLayer, FONTS, FONT_GROUPS } from '@/components/grid-builder/text-overlay-types';
import { cn } from '@/lib/utils';

// Album-specific layout templates
const ALBUM_TEMPLATES: { id: string; name: string; desc: string; layout: Partial<GridLayout> }[] = [
  { id: 'full-bleed', name: '1 Photo — Full Bleed', desc: 'Single photo fills the page', layout: { gridCols: 1, gridRows: 1, cells: [[1,1,2,2]] } },
  { id: 'h-split', name: '2 Photos — H Split', desc: 'Two photos side by side', layout: { gridCols: 2, gridRows: 1, cells: [[1,1,2,2],[1,2,2,3]] } },
  { id: 'v-split', name: '2 Photos — V Split', desc: 'Two photos stacked', layout: { gridCols: 1, gridRows: 2, cells: [[1,1,2,2],[2,1,3,2]] } },
  { id: 'v-grid-3', name: '3 Photos — Grid', desc: 'Three photo vertical grid', layout: { gridCols: 1, gridRows: 3, cells: [[1,1,2,2],[2,1,3,2],[3,1,4,2]] } },
  { id: 'collage-4', name: '4 Photos — Collage', desc: 'Four photos in a grid', layout: { gridCols: 2, gridRows: 2, cells: [[1,1,2,2],[1,2,2,3],[2,1,3,2],[2,2,3,3]] } },
  { id: 'story-1-2', name: 'Story — 1 Large + 2', desc: 'Storytelling layout', layout: { gridCols: 2, gridRows: 3, cells: [[1,1,3,3],[3,1,4,2],[3,2,4,3]] } },
  { id: 'story-1-3', name: 'Story — 1 Large + 3 Strip', desc: 'Hero with strip', layout: { gridCols: 3, gridRows: 3, cells: [[1,1,3,4],[3,1,4,2],[3,2,4,3],[3,3,4,4]] } },
  { id: 'magazine', name: 'Magazine Cover', desc: 'Photo with text area', layout: { gridCols: 3, gridRows: 2, cells: [[1,1,3,2],[1,2,2,4],[2,2,3,3],[2,3,3,4]] } },
];

interface Props {
  onApplyTemplate: (layout: Partial<GridLayout>) => void;
  textLayers: TextLayer[];
  selectedTextId: string | null;
  onAddText: (layer: TextLayer) => void;
  onUpdateText: (id: string, patch: Partial<TextLayer>) => void;
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

const PAPER_TEXTURES = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'cream', label: 'Cream', color: '#F5F0E8' },
  { id: 'linen', label: 'Linen', color: '#EDE8DE' },
  { id: 'dark', label: 'Dark', color: '#1a1a1a' },
];

const TEXT_PRESETS = [
  { label: 'Couple Names', text: 'Aarav & Priya', font: 'Cormorant Garamond', size: 28, style: 'italic' as const },
  { label: 'Wedding Date', text: 'March 15, 2026', font: 'Montserrat', size: 14, style: 'normal' as const },
  { label: 'Venue Name', text: 'The Grand Palace', font: 'Playfair Display', size: 18, style: 'normal' as const },
  { label: 'Custom Quote', text: '"Forever begins today"', font: 'Great Vibes', size: 24, style: 'normal' as const },
];

export default function AlbumRightPanel({
  onApplyTemplate, textLayers, selectedTextId, onAddText, onUpdateText,
  showBleed, showSafeMargin, showSpine, onToggleBleed, onToggleSafe, onToggleSpine,
  bgColor, onBgColorChange, paperTexture, onPaperTextureChange,
}: Props) {
  const selectedText = textLayers.find(l => l.id === selectedTextId);

  return (
    <div className="w-64 xl:w-72 border-l border-border bg-card flex flex-col shrink-0 h-full overflow-hidden">
      <Tabs defaultValue="layout" className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10 shrink-0">
          <TabsTrigger value="layout" className="text-xs gap-1 flex-1 data-[state=active]:shadow-none"><LayoutGrid className="h-3 w-3" /> Layout</TabsTrigger>
          <TabsTrigger value="text" className="text-xs gap-1 flex-1 data-[state=active]:shadow-none"><Type className="h-3 w-3" /> Text</TabsTrigger>
          <TabsTrigger value="guides" className="text-xs gap-1 flex-1 data-[state=active]:shadow-none"><Ruler className="h-3 w-3" /> Guides</TabsTrigger>
          <TabsTrigger value="page" className="text-xs gap-1 flex-1 data-[state=active]:shadow-none"><Palette className="h-3 w-3" /> Page</TabsTrigger>
        </TabsList>

        {/* Layout tab */}
        <TabsContent value="layout" className="flex-1 overflow-y-auto p-3 space-y-2 mt-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Page Templates</p>
          {ALBUM_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => onApplyTemplate(t.layout)}
              className="w-full text-left rounded-lg border border-border p-3 hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <span className="text-xs font-medium">{t.name}</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">{t.desc}</span>
            </button>
          ))}
        </TabsContent>

        {/* Text tab */}
        <TabsContent value="text" className="flex-1 overflow-y-auto p-3 space-y-3 mt-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Quick Insert</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TEXT_PRESETS.map(p => (
              <Button
                key={p.label}
                variant="outline"
                size="sm"
                className="text-[10px] h-7"
                onClick={() => onAddText(createTextLayer({
                  text: p.text, fontFamily: p.font, fontSize: p.size, fontStyle: p.style,
                  color: bgColor === '#1a1a1a' ? '#ffffff' : '#1a1a1a',
                }))}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => onAddText(createTextLayer({ color: bgColor === '#1a1a1a' ? '#ffffff' : '#1a1a1a' }))}>
            <Plus className="h-3 w-3" /> Add Text Layer
          </Button>

          {/* Selected text controls */}
          {selectedText && (
            <div className="space-y-3 border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Text Properties</p>
              <div className="space-y-2">
                <Label className="text-[10px]">Font</Label>
                <Select value={selectedText.fontFamily} onValueChange={(v) => onUpdateText(selectedText.id, { fontFamily: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_GROUPS.map(g => (
                      <div key={g.key}>
                        <div className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 py-1">{g.label}</div>
                        {FONTS.filter(f => f.group === g.key).map(f => (
                          <SelectItem key={f.family} value={f.family} className="text-xs" style={{ fontFamily: f.family }}>{f.label}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-[10px]">Size: {selectedText.fontSize}px</Label>
                <Slider value={[selectedText.fontSize]} min={8} max={72} step={1} onValueChange={([v]) => onUpdateText(selectedText.id, { fontSize: v })} />

                <Label className="text-[10px]">Letter Spacing: {selectedText.letterSpacing}</Label>
                <Slider value={[selectedText.letterSpacing]} min={-2} max={20} step={0.5} onValueChange={([v]) => onUpdateText(selectedText.id, { letterSpacing: v })} />

                <Label className="text-[10px]">Line Height: {selectedText.lineHeight.toFixed(1)}</Label>
                <Slider value={[selectedText.lineHeight * 10]} min={8} max={30} step={1} onValueChange={([v]) => onUpdateText(selectedText.id, { lineHeight: v / 10 })} />

                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} onClick={() => onUpdateText(selectedText.id, { alignment: a })}
                      className={cn('flex-1 py-1 rounded text-[10px] uppercase', selectedText.alignment === a ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}
                    >{a}</button>
                  ))}
                </div>

                <Label className="text-[10px]">Color</Label>
                <Input type="color" value={selectedText.color} onChange={(e) => onUpdateText(selectedText.id, { color: e.target.value })} className="h-8 w-full" />

                <Label className="text-[10px]">Opacity: {Math.round(selectedText.opacity * 100)}%</Label>
                <Slider value={[selectedText.opacity * 100]} min={10} max={100} step={5} onValueChange={([v]) => onUpdateText(selectedText.id, { opacity: v / 100 })} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Guides tab */}
        <TabsContent value="guides" className="flex-1 overflow-y-auto p-3 space-y-4 mt-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Print Guides</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium">Bleed Area</span>
              <span className="text-[10px] text-muted-foreground block">Red border, 3mm</span>
            </div>
            <Switch checked={showBleed} onCheckedChange={onToggleBleed} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium">Safe Margin</span>
              <span className="text-[10px] text-muted-foreground block">Blue border, 5mm</span>
            </div>
            <Switch checked={showSafeMargin} onCheckedChange={onToggleSafe} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium">Center Spine</span>
              <span className="text-[10px] text-muted-foreground block">Spread center line</span>
            </div>
            <Switch checked={showSpine} onCheckedChange={onToggleSpine} />
          </div>
          <p className="text-[10px] text-muted-foreground italic">Guides are visible in editor only — never included in exports.</p>
        </TabsContent>

        {/* Page tab */}
        <TabsContent value="page" className="flex-1 overflow-y-auto p-3 space-y-4 mt-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Background</p>
          <div>
            <Label className="text-[10px]">Color</Label>
            <Input type="color" value={bgColor} onChange={(e) => onBgColorChange(e.target.value)} className="h-8 w-full mt-1" />
          </div>
          <div>
            <Label className="text-[10px]">Paper Texture</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {PAPER_TEXTURES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onPaperTextureChange(t.id); onBgColorChange(t.color); }}
                  className={cn(
                    'rounded-lg border-2 p-3 text-center transition-all',
                    paperTexture === t.id ? 'border-primary' : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className="h-6 w-full rounded" style={{ background: t.color, border: t.id === 'white' ? '1px solid #e5e5e5' : undefined }} />
                  <span className="text-[10px] mt-1 block">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
