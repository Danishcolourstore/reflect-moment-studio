import { useEffect, useState } from 'react';
import { type RealtimeStatus, getRealtimeStatus, REALTIME_STATUS_EVENT } from '@/lib/realtime-status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<
  RealtimeStatus,
  { label: string; dotClass: string; pulseClass: string }
> = {
  connected:    { label: 'Live sync connected',  dotClass: 'bg-emerald-500', pulseClass: 'bg-emerald-500/40' },
  reconnecting: { label: 'Reconnecting…',        dotClass: 'bg-amber-500',   pulseClass: 'bg-amber-500/40' },
  offline:      { label: 'Offline — polling',    dotClass: 'bg-destructive', pulseClass: 'bg-destructive/40' },
};

interface RealtimeStatusIndicatorProps {
  /** Show a text label next to the dot (default: false) */
  showLabel?: boolean;
  className?: string;
}

/**
 * A small animated dot that reflects the current realtime connection state.
 * Green  = subscribed & live
 * Orange = reconnecting
 * Red    = offline / polling fallback
 */
export function RealtimeStatusIndicator({
  showLabel = false,
  className,
}: RealtimeStatusIndicatorProps) {
  const [status, setStatus] = useState<RealtimeStatus>(getRealtimeStatus());

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ status: RealtimeStatus }>).detail;
      if (detail?.status) setStatus(detail.status);
    };

    window.addEventListener(REALTIME_STATUS_EVENT, onUpdate);
    return () => window.removeEventListener(REALTIME_STATUS_EVENT, onUpdate);
  }, []);

  const config = STATUS_CONFIG[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1.5 cursor-default select-none', className)}>
          {/* Dot with ping animation when connected */}
          <span className="relative flex h-2 w-2">
            {status === 'connected' && (
              <span
                className={cn(
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  config.pulseClass
                )}
              />
            )}
            {status === 'reconnecting' && (
              <span
                className={cn(
                  'skeleton-block absolute inline-flex h-full w-full rounded-full opacity-60',
                  config.pulseClass
                )}
              />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                config.dotClass
              )}
            />
          </span>

          {showLabel && (
            <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-widest">
              {config.label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {config.label}
      </TooltipContent>
    </Tooltip>
  );
}
