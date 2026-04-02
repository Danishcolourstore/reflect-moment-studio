import clsx from "clsx";
import type { ProcessingStatus } from "../types/domain";

const statusStyles: Record<ProcessingStatus, string> = {
  queued: "bg-luxe-700/70 text-luxe-200 border-luxe-600",
  processing: "bg-accent-500/20 text-accent-300 border-accent-400/50",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-400/60",
  failed: "bg-rose-500/20 text-rose-300 border-rose-400/60",
};

export function StatusBadge({ status }: { status: ProcessingStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
