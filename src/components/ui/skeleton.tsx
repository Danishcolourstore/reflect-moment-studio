import { cn } from "@/lib/utils";

/**
 * Skeleton — left-to-right shimmer on --wash base.
 * No pulse. No radius. The single loading primitive.
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
