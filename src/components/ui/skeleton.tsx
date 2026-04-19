import { cn } from "@/lib/utils";

/**
 * Skeleton — left-to-right shimmer on --wash base.
 * No pulse. No rounded corners (luxury editorial system).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton-block", className)} {...props} />;
}

export { Skeleton };
