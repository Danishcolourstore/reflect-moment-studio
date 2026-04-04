import { Loader2, Wifi, WifiOff } from "lucide-react";

interface LiveStatusBadgeProps {
  connected: boolean;
  refreshing?: boolean;
}

export const LiveStatusBadge = ({ connected, refreshing }: LiveStatusBadgeProps) => {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        connected
          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/40 bg-red-500/10 text-red-300"
      }`}
    >
      {refreshing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : connected ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      {connected ? "Live Connected" : "Live Offline"}
    </div>
  );
};
