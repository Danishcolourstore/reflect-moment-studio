import clsx from 'clsx';
import type { ProcessingStatus } from '../types/mirror';

const statusClass: Record<ProcessingStatus, string> = {
  queued: 'bg-slate-700/50 text-slate-200 border-slate-500/40',
  processing: 'bg-amber-500/20 text-amber-200 border-amber-300/35',
  done: 'bg-emerald-500/20 text-emerald-200 border-emerald-300/35',
  error: 'bg-rose-500/20 text-rose-200 border-rose-300/35',
};

export const StatusBadge = ({ status }: { status: ProcessingStatus }) => {
  return (
    <span
      className={clsx(
        'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
        statusClass[status],
      )}
    >
      {status}
    </span>
  );
};
