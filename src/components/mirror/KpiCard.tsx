import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
}

export function KpiCard({ icon: Icon, label, value, accent = "text-white" }: KpiCardProps) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
