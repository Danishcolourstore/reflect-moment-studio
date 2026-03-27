export function statusTone(status) {
  switch (status) {
    case "done":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
    case "processing":
      return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30";
    case "failed":
      return "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-200 ring-1 ring-zinc-500/30";
  }
}

export function prettyDate(value) {
  if (!value) {
    return "-";
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
