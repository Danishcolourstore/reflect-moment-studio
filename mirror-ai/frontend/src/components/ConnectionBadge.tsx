import clsx from "clsx";

interface Props {
  value: "connecting" | "live" | "offline";
}

const styleByState: Record<Props["value"], string> = {
  connecting: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  live: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  offline: "bg-red-500/15 text-red-300 border-red-400/30",
};

export function ConnectionBadge({ value }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        styleByState[value],
      )}
    >
      {value}
    </span>
  );
}
