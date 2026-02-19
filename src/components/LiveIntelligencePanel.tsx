import {
  Sparkles, Ban, Star, Image as ImageIcon,
  Eye, Copy, Share2, Check,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AiCullingStats, LivePhoto } from '@/hooks/use-livesync';
import { useState } from 'react';

/* ═══════════════════════════════════════════
   1. AI Culling Stats Panel
   ═══════════════════════════════════════════ */

interface AiCullingPanelProps {
  stats: AiCullingStats;
  isLive: boolean;
}

export function AiCullingPanel({ stats, isLive }: AiCullingPanelProps) {
  if (!isLive) return null;

  return (
    <div className="mb-4 border border-border bg-card px-4 py-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-foreground">
          Live AI Culling
        </span>
        {stats.totalProcessed > 0 && (
          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 tracking-wider uppercase font-medium">
            AI Picks
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatBlock
          icon={<Check className="h-3 w-3 text-[hsl(142_71%_45%)]" />}
          label="Selected"
          value={stats.selected}
          color="text-[hsl(142_71%_45%)]"
        />
        <StatBlock
          icon={<Ban className="h-3 w-3 text-destructive/70" />}
          label="Rejected"
          value={stats.rejectedBlur + stats.rejectedDuplicate}
          sub={`${stats.rejectedBlur} blur · ${stats.rejectedDuplicate} dup`}
          color="text-destructive/70"
        />
        <StatBlock
          icon={<Star className="h-3 w-3 text-primary" />}
          label="Hero Picks"
          value={stats.heroPicks}
          color="text-primary"
        />
        <StatBlock
          icon={<ImageIcon className="h-3 w-3 text-muted-foreground" />}
          label="Processed"
          value={stats.totalProcessed}
          color="text-muted-foreground"
        />
      </div>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className={`text-[16px] font-serif font-semibold ${color}`}>
          {value}
        </span>
      </div>
      <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground/60">{label}</p>
      {sub && <p className="text-[8px] text-muted-foreground/40 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. Live Preset Apply Panel
   ═══════════════════════════════════════════ */

const PRESETS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

interface PresetApplyPanelProps {
  isLive: boolean;
  enabled: boolean;
  activePreset: string;
  onToggle: (v: boolean) => void;
  onPresetChange: (p: string) => void;
}

export function PresetApplyPanel({
  isLive,
  enabled,
  activePreset,
  onToggle,
  onPresetChange,
}: PresetApplyPanelProps) {
  if (!isLive) return null;

  return (
    <div className="mb-4 border border-border bg-card px-4 py-3 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-foreground">
            Live Preset Apply™
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-muted-foreground/60">Enable</Label>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>

      {enabled && (
        <div className="flex items-center gap-1">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => onPresetChange(p)}
              className={`
                w-8 h-8 flex items-center justify-center text-[12px] font-serif font-semibold
                border transition-all duration-200
                ${activePreset === p
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground/50 hover:border-primary/40 hover:text-foreground/70'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. Photo AI Badges (overlays for LiveFeedGrid)
   ═══════════════════════════════════════════ */

interface PhotoAiBadgesProps {
  photo: LivePhoto;
}

export function PhotoAiBadges({ photo }: PhotoAiBadgesProps) {
  const badges: React.ReactNode[] = [];

  if (photo.aiVerdict === 'hero') {
    badges.push(
      <span
        key="hero"
        className="flex items-center gap-1 bg-primary/90 text-primary-foreground px-2 py-0.5 backdrop-blur-sm"
      >
        <Star className="h-2.5 w-2.5" fill="currentColor" />
        <span className="text-[8px] uppercase tracking-[0.12em] font-semibold">Hero Pick</span>
      </span>
    );
  } else if (photo.aiVerdict === 'selected') {
    badges.push(
      <span
        key="selected"
        className="flex items-center gap-1 bg-[hsl(142_71%_45%/0.9)] text-card px-2 py-0.5 backdrop-blur-sm"
      >
        <Sparkles className="h-2.5 w-2.5" />
        <span className="text-[8px] uppercase tracking-[0.12em] font-semibold">AI Selected</span>
      </span>
    );
  } else if (photo.aiVerdict === 'rejected-blur' || photo.aiVerdict === 'rejected-duplicate') {
    badges.push(
      <span
        key="rejected"
        className="flex items-center gap-1 bg-foreground/60 text-card px-2 py-0.5 backdrop-blur-sm opacity-70"
      >
        <Ban className="h-2.5 w-2.5" />
        <span className="text-[8px] uppercase tracking-[0.12em] font-semibold">
          {photo.aiVerdict === 'rejected-blur' ? 'Blur' : 'Duplicate'}
        </span>
      </span>
    );
  }

  if (photo.presetApplied) {
    badges.push(
      <span
        key="enhanced"
        className="flex items-center gap-1 bg-accent/90 text-accent-foreground px-2 py-0.5 backdrop-blur-sm"
      >
        <Sparkles className="h-2.5 w-2.5" />
        <span className="text-[8px] uppercase tracking-[0.12em] font-semibold">Enhanced by MirrorAI</span>
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1 animate-fade-in">
      {badges}
    </div>
  );
}

/* ═══════════════════════════════════════════
   4. Social Share Overlay
   ═══════════════════════════════════════════ */

interface SocialShareOverlayProps {
  photo: LivePhoto;
  onShare: (photoId: string) => void;
}

export function SocialShareOverlay({ photo, onShare }: SocialShareOverlayProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(photo.url).then(() => {
      setCopied(true);
      onShare(photo.id);
      toast({ title: 'Link copied' });
      setTimeout(() => setCopied(false), 2000);
    }).catch((_err) => {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    });
  };

  const handleInstagram = () => {
    onShare(photo.id);
    window.open(`https://www.instagram.com/`, '_blank');
  };

  const handleWhatsApp = () => {
    onShare(photo.id);
    window.open(`https://wa.me/?text=${encodeURIComponent(photo.url)}`, '_blank');
  };

  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      {/* Instagram */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstagram}
        className="h-7 w-7 p-0 bg-card/70 backdrop-blur-sm hover:bg-card/90"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-foreground/80" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      </Button>

      {/* WhatsApp */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleWhatsApp}
        className="h-7 w-7 p-0 bg-card/70 backdrop-blur-sm hover:bg-card/90"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-foreground/80" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </Button>

      {/* Copy Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 w-7 p-0 bg-card/70 backdrop-blur-sm hover:bg-card/90"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[hsl(142_71%_45%)]" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-foreground/80" />
        )}
      </Button>

      {/* Share counter */}
      {(photo.shareCount ?? 0) > 0 && (
        <span className="text-[9px] bg-card/70 backdrop-blur-sm px-1.5 py-0.5 text-foreground/70 font-medium">
          <Share2 className="inline h-2.5 w-2.5 mr-0.5" />
          {photo.shareCount}
        </span>
      )}
    </div>
  );
}
