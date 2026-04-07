import type { ReactNode } from "react";
import { Camera, CircleDot, Cpu, Sparkles } from "lucide-react";

type TopBarProps = {
  processingCount: number;
  doneCount: number;
};

export function TopBar({ processingCount, doneCount }: TopBarProps) {
  return (
    <header className="glass-panel mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[11px] uppercase tracking-widest text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          Mirror AI
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100 md:text-2xl">
          Real-time Photography Assistant
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Stat title="Live Ingest" value={processingCount.toString()} icon={<Camera className="h-3.5 w-3.5" />} />
        <Stat title="Processed" value={doneCount.toString()} icon={<Cpu className="h-3.5 w-3.5" />} />
        <Stat
          title="Realtime"
          value="Online"
          icon={<CircleDot className="h-3.5 w-3.5 text-emerald-300" />}
        />
      </div>
    </header>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-400">
        {icon}
        {title}
      </p>
      <p className="text-sm font-medium text-zinc-100">{value}</p>
    </div>
  );
}
