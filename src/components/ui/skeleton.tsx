import { cn } from "@/lib/utils";

/**
 * Skeleton — UI Parameter System v2 §10
 * Pulse 0.5 ↔ 1.0, 1200ms ease-in-out, infinite. --wash-strong base.
 * Skeleton shape MUST match actual content shape exactly.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-block", className)} {...props} />;
}

/**
 * Shimmer — alias of Skeleton, named per the design spec.
 * Use this in new code. Both render identically.
 */
function Shimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-block", className)} {...props} />;
}

export { Skeleton, Shimmer };
