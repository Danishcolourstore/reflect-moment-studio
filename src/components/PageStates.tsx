import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/** Premium skeleton loading — maintains layout while content loads */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="skeleton-shimmer h-7 w-40 rounded" />
      <div className="skeleton-shimmer h-4 w-64 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-shimmer rounded-xl" style={{ aspectRatio: '4/3' }} />
        ))}
      </div>
    </div>
  );
}

/** Soft inline error — never full-screen */
export function PageError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <span className="text-destructive text-lg">!</span>
      </div>
      <div>
        <h3 className="font-serif text-lg text-foreground mb-1">Something went wrong</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {message || 'We couldn\'t load this page. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
}

/** Branded empty state — feels intentional, not broken */
export function EmptyState({
  heading = "Nothing here yet",
  subtext = "Get started by creating something new.",
  ctaLabel,
  onAction,
}: {
  heading?: string;
  subtext?: string;
  ctaLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4 text-center">
      <h2 className="font-serif text-2xl text-foreground tracking-wide" style={{ fontWeight: 300 }}>
        {heading}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">{subtext}</p>
      {ctaLabel && onAction && (
        <Button onClick={onAction} className="mt-4 px-8">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
