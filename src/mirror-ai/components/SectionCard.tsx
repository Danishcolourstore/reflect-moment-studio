import type { PropsWithChildren, ReactNode } from "react";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function SectionCard({ title, subtitle, rightSlot, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101218] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] md:p-5">
      <header className="mb-4 flex flex-col gap-2 border-b border-white/10 pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-zinc-400">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </header>
      {children}
    </section>
  );
}

