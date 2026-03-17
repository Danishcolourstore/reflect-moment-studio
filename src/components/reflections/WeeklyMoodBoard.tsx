import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Palette, Lightbulb, Camera, Sparkles, BookmarkPlus,
  ChevronRight, Layers, Sun, Eye
} from 'lucide-react';
import { type MoodBoardDrop } from '@/hooks/use-reflections';

const DEMO_DROPS: MoodBoardDrop[] = [
  {
    id: 'mb-1',
    title: 'Velvet Hour',
    subtitle: 'The poetry between sunset and darkness',
    theme: 'Golden Hour Portraits',
    cover_image: null,
    week_number: 12,
    year: 2026,
    lighting_tip: 'Position your subject with the sun at 15° behind their shoulder. Use a white reflector from below to fill under-eye shadows. Shoot at f/1.8 for dreamy bokeh that catches the last golden rays.',
    pose_suggestion: 'Have them walk slowly toward camera, looking down, then glancing up on your count. The transition creates authentic micro-expressions that feel unposed.',
    color_palette: ['#D4AF37', '#8B6914', '#F5E6CC', '#2C1810', '#E8C896'],
    reference_images: [
      { url: '/placeholder.svg', caption: 'Backlit rim light at f/1.4' },
      { url: '/placeholder.svg', caption: 'Warm tones, low sun angle' },
      { url: '/placeholder.svg', caption: 'Silhouette with bokeh' },
    ],
    recommended_preset_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mb-2',
    title: 'Concrete & Grace',
    subtitle: 'Finding beauty in brutalist architecture',
    theme: 'Urban Fashion',
    cover_image: null,
    week_number: 11,
    year: 2026,
    lighting_tip: 'Use harsh midday shadows as compositional elements. The geometric shadows of buildings create dramatic patterns on skin.',
    pose_suggestion: 'Lean against a concrete wall with arms relaxed. Let the architecture dominate the frame — your subject is the accent, not the whole painting.',
    color_palette: ['#808080', '#D4AF37', '#1A1A1A', '#B0B0B0', '#FFFFFF'],
    reference_images: [],
    recommended_preset_id: null,
    created_at: new Date().toISOString(),
  },
];

interface WeeklyMoodBoardProps {
  drops?: MoodBoardDrop[];
  onSaveToCollection?: (drop: MoodBoardDrop) => void;
}

export function WeeklyMoodBoard({ drops: propDrops, onSaveToCollection }: WeeklyMoodBoardProps) {
  const drops = propDrops && propDrops.length > 0 ? propDrops : DEMO_DROPS;
  const [expandedId, setExpandedId] = useState<string | null>(drops[0]?.id || null);

  const currentDrop = drops[0];
  const pastDrops = drops.slice(1);

  if (!currentDrop) return null;

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Palette className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Weekly Mood Board</h2>
            <p className="text-[10px] text-muted-foreground">Drops every Monday · Week {currentDrop.week_number}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-primary/20 text-primary animate-pulse">
          <Sparkles className="h-2.5 w-2.5" /> New Drop
        </Badge>
      </div>

      {/* Current Drop — Hero Card */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        {/* Theme Header */}
        <div className="h-36 bg-gradient-to-br from-primary/20 via-secondary to-card flex items-end p-4 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="relative z-10">
            <Badge className="text-[8px] px-1.5 h-4 bg-primary/80 text-primary-foreground mb-2">
              THIS WEEK
            </Badge>
            <h3
              className="text-foreground leading-tight"
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 600 }}
            >
              {currentDrop.title}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{currentDrop.subtitle}</p>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Color Palette */}
          {currentDrop.color_palette.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1">
                <Palette className="h-2.5 w-2.5" /> Color Palette
              </p>
              <div className="flex gap-1.5">
                {currentDrop.color_palette.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="h-8 w-8 rounded-lg border border-border/50 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[7px] text-muted-foreground/50 font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lighting Tip */}
          {currentDrop.lighting_tip && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1">
                <Sun className="h-2.5 w-2.5" /> Lighting Tip
              </p>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-[11px] text-foreground/80 leading-relaxed">{currentDrop.lighting_tip}</p>
              </div>
            </div>
          )}

          {/* Pose Suggestion */}
          {currentDrop.pose_suggestion && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1">
                <Camera className="h-2.5 w-2.5" /> Pose Direction
              </p>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-[11px] text-foreground/80 leading-relaxed">{currentDrop.pose_suggestion}</p>
              </div>
            </div>
          )}

          {/* Reference Images */}
          {currentDrop.reference_images.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium flex items-center gap-1">
                <Eye className="h-2.5 w-2.5" /> References
              </p>
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  {(currentDrop.reference_images as any[]).map((img: any, i: number) => (
                    <div key={i} className="w-28 shrink-0 space-y-1">
                      <div className="h-20 rounded-lg bg-secondary border border-border/50 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-muted-foreground/20" />
                      </div>
                      <p className="text-[8px] text-muted-foreground/60 line-clamp-1">{img.caption}</p>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-[10px] h-8 gap-1.5 border-primary/20 text-primary hover:bg-primary/10"
              onClick={() => onSaveToCollection?.(currentDrop)}
            >
              <BookmarkPlus className="h-3 w-3" /> Save to Collection
            </Button>
            <Button
              size="sm"
              className="flex-1 text-[10px] h-8 gap-1.5"
            >
              <Sparkles className="h-3 w-3" /> Try This Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Past Drops */}
      {pastDrops.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Previous Drops</p>
          {pastDrops.map(drop => (
            <Card
              key={drop.id}
              className="overflow-hidden hover:border-primary/20 transition-colors cursor-pointer"
              onClick={() => setExpandedId(expandedId === drop.id ? null : drop.id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Palette className="h-4 w-4 text-muted-foreground/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{drop.title}</p>
                  <p className="text-[10px] text-muted-foreground">Week {drop.week_number} · {drop.theme}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
