import { Camera, RadioTower, Sparkles } from 'lucide-react';

export const TopBar = ({ wsState }: { wsState: 'connecting' | 'connected' | 'disconnected' }) => {
  const wsClass = {
    connecting: 'bg-amber-300',
    connected: 'bg-emerald-300',
    disconnected: 'bg-rose-300',
  }[wsState];

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0d12]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-400 to-fuchsia-400 text-black shadow-[0_16px_50px_rgba(146,117,255,0.28)]">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mirror AI</p>
            <h1 className="text-lg font-semibold text-slate-100">Realtime Photography Assistant</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Premium Studio UI
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-slate-300">
            <RadioTower className="h-3.5 w-3.5" />
            <span className={`h-2 w-2 rounded-full ${wsClass}`} />
            {wsState}
          </div>
        </div>
      </div>
    </header>
  );
};
