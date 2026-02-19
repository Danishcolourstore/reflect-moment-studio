import { Camera, Cloud, Users, Radio, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { LivePhoto } from '@/hooks/use-livesync';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useState } from 'react';

interface LiveSyncPanelProps {
  isLive: boolean;
  cameraConnected: boolean;
  syncing: boolean;
  guestViewers: number;
  livePhotos: LivePhoto[];
  onStart: () => void;
  onStop: () => void;
}

function RelativeTime({ date }: { date: Date }) {
  const [label, setLabel] = useState('just now');
  useEffect(() => {
    const tick = () => {
      const diff = Date.now() - date.getTime();
      setLabel(diff < 5000 ? 'just now' : formatDistanceToNowStrict(date, { addSuffix: true }));
    };
    tick();
    const i = setInterval(tick, 5000);
    return () => clearInterval(i);
  }, [date]);
  return <>{label}</>;
}

export function LiveSyncStatusBar({ isLive, cameraConnected, syncing, guestViewers, onStart, onStop }: Omit<LiveSyncPanelProps, 'livePhotos'>) {
  if (!isLive) {
    return (
      <div className="mb-4 border border-border bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-foreground">LiveSync™</span>
          <span className="text-[10px] text-muted-foreground/50">Ready</span>
        </div>
        <Button
          onClick={onStart}
          size="sm"
          className="bg-primary hover:bg-primary/85 text-primary-foreground h-7 px-3 text-[10px] uppercase tracking-[0.08em] font-medium"
        >
          <Radio className="mr-1 h-3 w-3" />Go Live
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 border border-primary/30 bg-primary/5 px-4 py-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(142_71%_45%)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(142_71%_45%)]" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-foreground">LiveSync™ Active</span>
        </div>
        <Button
          onClick={onStop}
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 h-7 px-3 text-[10px] uppercase tracking-[0.08em]"
        >
          End Session
        </Button>
      </div>

      <div className="flex items-center gap-5">
        {/* Camera */}
        <div className="flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 text-[hsl(142_71%_45%)]" />
          <span className="text-[10px] text-foreground/70">
            {cameraConnected ? 'Camera Connected' : 'Connecting…'}
          </span>
        </div>

        {/* Cloud sync */}
        <div className="flex items-center gap-1.5">
          <Cloud className={`h-3.5 w-3.5 ${syncing ? 'text-primary animate-pulse' : 'text-muted-foreground/40'}`} />
          <span className="text-[10px] text-foreground/70">
            {syncing ? 'Syncing to Cloud' : 'Synced'}
          </span>
        </div>

        {/* Viewers */}
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] text-foreground/70">
            {guestViewers} Guest{guestViewers !== 1 ? 's' : ''} Viewing
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveFeedGrid({ photos }: { photos: LivePhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
        <h3 className="text-[11px] uppercase tracking-[0.1em] font-medium text-foreground">Live Feed</h3>
        <span className="text-[10px] text-muted-foreground/50">{photos.length} photos</span>
      </div>

      <div className="columns-2 sm:columns-3 lg:columns-4 gap-[6px]">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative mb-[6px] break-inside-avoid animate-fade-in group"
          >
            <img
              src={photo.url}
              alt=""
              className="w-full block"
              loading="lazy"
            />

            {/* LIVE badge */}
            {photo.isNew && (
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-destructive/90 text-destructive-foreground px-2 py-0.5 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive-foreground" />
                </span>
                <span className="text-[9px] uppercase tracking-[0.12em] font-semibold">LIVE</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[9px] text-card tracking-wide">
                Captured <RelativeTime date={photo.timestamp} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
