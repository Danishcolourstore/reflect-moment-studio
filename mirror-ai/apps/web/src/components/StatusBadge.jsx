import { statusTone } from "../lib/utils";

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusTone(status)}`}
    >
      {status ?? "unknown"}
    </span>
  );
}
