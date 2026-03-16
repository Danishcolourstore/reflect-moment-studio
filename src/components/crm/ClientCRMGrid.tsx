import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Heart, Download, Camera, ChevronRight } from "lucide-react";
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

const avatarColors = [
  "bg-primary/15 text-primary",
  "bg-rose-500/15 text-rose-700",
  "bg-blue-500/15 text-blue-700",
  "bg-emerald-500/15 text-emerald-700",
  "bg-violet-500/15 text-violet-700",
  "bg-amber-500/15 text-amber-700",
];

export function ClientCRMGrid({ clients, loading, onSelect, onInvite }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-xl bg-card/50">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/20" />
        <p className="mt-4 font-serif text-xl text-foreground">No clients yet</p>
        <p className="text-sm text-muted-foreground mt-1">Start building your client relationships</p>
        <Button className="mt-5" onClick={onInvite}>Add Your First Client</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((c, i) => (
        <Card
          key={c.id}
          className="group cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all duration-300"
          onClick={() => onSelect(c)}
        >
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className={`h-11 w-11 ${avatarColors[i % avatarColors.length]}`}>
                  <AvatarFallback className="text-sm font-semibold bg-transparent">
                    {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
              </div>
              <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-medium shrink-0 ${statusStyles[c.status]}`}>
                {c.status}
              </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded-lg bg-secondary/30">
                <Camera className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                <p className="text-sm font-semibold text-foreground">{c.event_count}</p>
                <p className="text-[9px] text-muted-foreground uppercase">Galleries</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/30">
                <Heart className="h-3.5 w-3.5 mx-auto text-rose-500 mb-1" />
                <p className="text-sm font-semibold text-foreground">{c.favorite_count}</p>
                <p className="text-[9px] text-muted-foreground uppercase">Favorites</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/30">
                <Download className="h-3.5 w-3.5 mx-auto text-blue-600 mb-1" />
                <p className="text-sm font-semibold text-foreground">{c.download_count}</p>
                <p className="text-[9px] text-muted-foreground uppercase">Downloads</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground">
                {c.last_activity
                  ? `Active ${formatDistanceToNow(new Date(c.last_activity), { addSuffix: true })}`
                  : `Added ${formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}`}
              </p>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
