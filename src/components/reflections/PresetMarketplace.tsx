import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag, Star, Download, Check, Sparkles, ArrowRight,
  ChevronLeft, ChevronRight, Zap, Crown, Eye
} from 'lucide-react';
import { usePresetMarketplace, type PresetItem } from '@/hooks/use-reflections';

const CATEGORIES = ['All', 'Wedding', 'Portrait', 'Film', 'Dark & Moody', 'Bright & Airy', 'Cinematic'];

const DEMO_PRESETS: PresetItem[] = [
  {
    id: 'demo-1', seller_id: '', name: 'Golden Hour Glow', description: 'Warm golden tones with lifted shadows. Perfect for outdoor portraits and golden hour sessions.',
    category: 'Portrait', preview_images: ['/placeholder.svg'], before_after_pairs: [],
    price_cents: 2900, currency: 'USD', download_count: 1247, rating_avg: 4.9, rating_count: 312,
    tags: ['warm', 'golden', 'portrait'], is_featured: true, created_at: new Date().toISOString(),
  },
  {
    id: 'demo-2', seller_id: '', name: 'Midnight Film', description: 'Deep cinematic tones inspired by 35mm Portra 800. Rich blacks with teal shadows.',
    category: 'Film', preview_images: ['/placeholder.svg'], before_after_pairs: [],
    price_cents: 3900, currency: 'USD', download_count: 892, rating_avg: 4.8, rating_count: 205,
    tags: ['film', 'cinematic', 'dark'], is_featured: true, created_at: new Date().toISOString(),
  },
  {
    id: 'demo-3', seller_id: '', name: 'Bridal White', description: 'Clean, luminous editing for wedding details. Preserves dress textures beautifully.',
    category: 'Wedding', preview_images: ['/placeholder.svg'], before_after_pairs: [],
    price_cents: 4900, currency: 'USD', download_count: 2103, rating_avg: 4.95, rating_count: 487,
    tags: ['wedding', 'bright', 'clean'], is_featured: false, created_at: new Date().toISOString(),
  },
  {
    id: 'demo-4', seller_id: '', name: 'Noir Editorial', description: 'High-contrast black and white with fine grain. Fashion editorial meets fine art.',
    category: 'Dark & Moody', preview_images: ['/placeholder.svg'], before_after_pairs: [],
    price_cents: 1900, currency: 'USD', download_count: 654, rating_avg: 4.7, rating_count: 148,
    tags: ['bw', 'editorial', 'fashion'], is_featured: false, created_at: new Date().toISOString(),
  },
  {
    id: 'demo-5', seller_id: '', name: 'Tropical Pastel', description: 'Soft pastels with lifted greens and warm skin tones. Destination wedding perfection.',
    category: 'Bright & Airy', preview_images: ['/placeholder.svg'], before_after_pairs: [],
    price_cents: 2400, currency: 'USD', download_count: 1891, rating_avg: 4.85, rating_count: 390,
    tags: ['pastel', 'bright', 'destination'], is_featured: true, created_at: new Date().toISOString(),
  },
];

export function PresetMarketplace() {
  const { presets: dbPresets, loading, purchasePreset } = usePresetMarketplace();
  const [category, setCategory] = useState('All');
  const [selectedPreset, setSelectedPreset] = useState<PresetItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const allPresets = dbPresets.length > 0 ? dbPresets : DEMO_PRESETS;
  const filtered = category === 'All' ? allPresets : allPresets.filter(p => p.category === category);
  const featured = allPresets.filter(p => p.is_featured);

  const handlePurchase = async (preset: PresetItem) => {
    setPurchasing(true);
    await purchasePreset(preset.id);
    setTimeout(() => {
      setPurchasing(false);
      setSelectedPreset({ ...preset, purchased: true });
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Preset Marketplace</h2>
            <p className="text-[10px] text-muted-foreground">Signature looks from top photographers</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-primary/20 text-primary">
          <Crown className="h-2.5 w-2.5" /> {allPresets.length} Presets
        </Badge>
      </div>

      {/* Featured Carousel */}
      {featured.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {featured.map(preset => (
              <FeaturedPresetCard
                key={preset.id}
                preset={preset}
                onSelect={() => setSelectedPreset(preset)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Category Pills */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onSelect={() => setSelectedPreset(preset)}
          />
        ))}
      </div>

      {/* Preset Detail Modal */}
      <PresetDetailModal
        preset={selectedPreset}
        open={!!selectedPreset}
        onClose={() => setSelectedPreset(null)}
        onPurchase={handlePurchase}
        purchasing={purchasing}
      />
    </div>
  );
}

function FeaturedPresetCard({ preset, onSelect }: { preset: PresetItem; onSelect: () => void }) {
  return (
    <Card
      className="w-56 shrink-0 overflow-hidden cursor-pointer group hover:border-primary/30 transition-all relative"
      onClick={onSelect}
    >
      <div className="absolute top-2 left-2 z-10">
        <Badge className="text-[8px] px-1.5 py-0 h-4 bg-primary/90 text-primary-foreground gap-0.5">
          <Sparkles className="h-2 w-2" /> Featured
        </Badge>
      </div>
      <div className="h-28 bg-gradient-to-br from-primary/20 via-secondary to-secondary flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-6 w-6 text-primary mx-auto mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Preview</span>
        </div>
      </div>
      <CardContent className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-foreground truncate">{preset.name}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-primary fill-primary" />
            <span className="text-[10px] text-muted-foreground">{preset.rating_avg}</span>
          </div>
          <span className="text-xs font-bold text-primary">
            ${(preset.price_cents / 100).toFixed(0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PresetCard({ preset, onSelect }: { preset: PresetItem; onSelect: () => void }) {
  return (
    <Card
      className="overflow-hidden cursor-pointer group hover:border-primary/20 transition-all"
      onClick={onSelect}
    >
      <div className="h-24 bg-gradient-to-br from-secondary via-card to-secondary flex items-center justify-center relative">
        {preset.purchased && (
          <div className="absolute top-1.5 right-1.5">
            <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3 w-3 text-green-400" />
            </div>
          </div>
        )}
        <Eye className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
      </div>
      <CardContent className="p-2.5 space-y-1">
        <p className="text-[11px] font-semibold text-foreground truncate">{preset.name}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5 text-primary fill-primary" />
            <span className="text-[9px] text-muted-foreground">{preset.rating_avg}</span>
            <span className="text-[8px] text-muted-foreground/50">({preset.rating_count})</span>
          </div>
          {preset.purchased ? (
            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-green-500/30 text-green-400">
              Owned
            </Badge>
          ) : (
            <span className="text-[11px] font-bold text-primary">
              ${(preset.price_cents / 100).toFixed(0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[8px] text-muted-foreground/50">
          <Download className="h-2 w-2" /> {preset.download_count.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

function PresetDetailModal({
  preset, open, onClose, onPurchase, purchasing
}: {
  preset: PresetItem | null;
  open: boolean;
  onClose: () => void;
  onPurchase: (p: PresetItem) => void;
  purchasing: boolean;
}) {
  const [beforeAfterPosition, setBeforeAfterPosition] = useState(50);

  if (!preset) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border">
        {/* Hero */}
        <div className="h-48 bg-gradient-to-br from-primary/15 via-secondary to-card flex items-center justify-center relative">
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Preset Preview</p>
          </div>
          {preset.is_featured && (
            <Badge className="absolute top-3 left-3 text-[9px] bg-primary/90 text-primary-foreground gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Featured
            </Badge>
          )}
        </div>

        <div className="p-5 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-semibold text-foreground">{preset.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">{preset.description}</p>
          </DialogHeader>

          {/* Before/After Slider */}
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Before → After</p>
            <div className="h-32 rounded-lg bg-secondary relative overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-muted/80 to-transparent"
                style={{ width: `${beforeAfterPosition}%` }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20"
                style={{ left: `${beforeAfterPosition}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={beforeAfterPosition}
                onChange={e => setBeforeAfterPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary/80 z-5"
                style={{ left: `${beforeAfterPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <ChevronLeft className="h-2.5 w-2.5 text-primary-foreground" />
                  <ChevronRight className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              </div>
              <div className="absolute bottom-2 left-3 text-[9px] text-muted-foreground font-medium">Before</div>
              <div className="absolute bottom-2 right-3 text-[9px] text-primary font-medium">After</div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-sm font-semibold text-foreground">{preset.rating_avg}</span>
              <span className="text-[10px] text-muted-foreground">({preset.rating_count} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Download className="h-3 w-3" /> {preset.download_count.toLocaleString()} downloads
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {preset.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[9px] h-5 px-2 border-border text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Purchase Button */}
          {preset.purchased ? (
            <Button className="w-full gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/20" disabled>
              <Check className="h-4 w-4" /> In Your Library
            </Button>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={() => onPurchase(preset)}
              disabled={purchasing}
            >
              {purchasing ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Get Preset — ${(preset.price_cents / 100).toFixed(0)}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
