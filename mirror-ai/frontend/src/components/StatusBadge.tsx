import type { ImageStatus } from "../types";

type StatusBadgeProps = {
  status: ImageStatus;
};

const labels: Record<ImageStatus, string> = {
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

const styles: Record<ImageStatus, string> = {
  processing: "bg-amber-500/15 text-amber-200 border-amber-400/35",
  done: "bg-emerald-500/15 text-emerald-200 border-emerald-400/35",
  failed: "bg-rose-500/15 text-rose-200 border-rose-400/35",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
