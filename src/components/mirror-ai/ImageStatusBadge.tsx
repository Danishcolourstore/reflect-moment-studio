import type { MirrorImageStatus } from "@/lib/mirror-ai/types";

const statusClasses: Record<MirrorImageStatus, string> = {
  queued: "border-amber-400/40 bg-amber-500/10 text-amber-300",
  processing: "border-sky-400/40 bg-sky-500/10 text-sky-300",
  done: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  failed: "border-rose-400/40 bg-rose-500/10 text-rose-300",
};

export const ImageStatusBadge = ({ status }: { status: MirrorImageStatus }) => {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[status]}`}>
      {status}
    </span>
  );
};
