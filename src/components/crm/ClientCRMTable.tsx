import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CRMClient } from "@/pages/Clients";

interface Props {
  clients: CRMClient[];
  loading: boolean;
  onSelect: (c: CRMClient) => void;
  onInvite: () => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function ClientCRMTable({ clients, loading, onSelect, onInvite }: Props) {
  if (loading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/50">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/20" />
        <p className="mt-4 font-serif text-xl">No clients yet</p>
        <Button className="mt-5" onClick={onInvite}>Add Your First Client</Button>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-secondary/30 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Client</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-center hidden sm:table-cell">Status</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-center hidden md:table-cell">Galleries</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-center hidden md:table-cell">Favorites</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-center hidden lg:table-cell">Downloads</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium text-muted-foreground hidden sm:table-cell">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelect(c)}
                className="cursor-pointer hover:bg-secondary/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-medium">
                        {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${statusStyles[c.status]}`}>
                    {c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center text-sm hidden md:table-cell">{c.event_count}</td>
                <td className="px-4 py-3 text-center text-sm hidden md:table-cell">{c.favorite_count}</td>
                <td className="px-4 py-3 text-center text-sm hidden lg:table-cell">{c.download_count}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                  {c.last_activity
                    ? formatDistanceToNow(new Date(c.last_activity), { addSuffix: true })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
