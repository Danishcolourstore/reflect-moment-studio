import type { ImageStatus } from "@/types/mirror";

const styleByStatus: Record<ImageStatus, string> = {
  queued: "border-slate-500/40 bg-slate-500/15 text-slate-200",
  processing: "border-amber-400/45 bg-amber-500/15 text-amber-300",
  done: "border-emerald-400/45 bg-emerald-500/15 text-emerald-300",
  failed: "border-rose-400/45 bg-rose-500/15 text-rose-300",
};

export function StatusBadge({ status }: { status: ImageStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${styleByStatus[status]}`}
    >
      {status}
    </span>
  );
}
