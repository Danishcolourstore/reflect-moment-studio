import { cn } from "@/lib/utils";
import type { ProcessingStatus } from "../types";

const labelByStatus: Record<ProcessingStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

const classByStatus: Record<ProcessingStatus, string> = {
  queued: "bg-zinc-700/70 text-zinc-100 border-zinc-600",
  processing: "bg-amber-700/70 text-amber-100 border-amber-500",
  done: "bg-emerald-700/70 text-emerald-100 border-emerald-500",
  failed: "bg-rose-700/70 text-rose-100 border-rose-500",
};

interface StatusBadgeProps {
  status: ProcessingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
        classByStatus[status],
      )}
    >
      {labelByStatus[status]}
    </span>
  );
}
