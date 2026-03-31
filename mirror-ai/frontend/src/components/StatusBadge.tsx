import clsx from "clsx";
import type { ProcessingStatus } from "../types";

interface Props {
  value: ProcessingStatus;
}

const styleByStatus: Record<ProcessingStatus, string> = {
  uploaded: "bg-sky-500/15 border-sky-400/30 text-sky-200",
  processing: "bg-violet-500/15 border-violet-400/30 text-violet-200",
  done: "bg-emerald-500/15 border-emerald-400/30 text-emerald-200",
  failed: "bg-red-500/15 border-red-400/30 text-red-200",
};

export function StatusBadge({ value }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        styleByStatus[value],
      )}
    >
      {value}
    </span>
  );
}
