import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, Heart, Download } from "lucide-react";

interface Props {
  stats: {
    total: number;
    active: number;
    pending: number;
    totalFavorites: number;
    totalDownloads: number;
  };
  loading: boolean;
}

export function ClientCRMStats({ stats, loading }: Props) {
  const items = [
    { label: "Total Clients", value: stats.total, icon: Users, color: "text-primary" },
    { label: "Active", value: stats.active, icon: UserCheck, color: "text-emerald-600" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
    { label: "Favorites", value: stats.totalFavorites, icon: Heart, color: "text-rose-500" },
    { label: "Downloads", value: stats.totalDownloads, icon: Download, color: "text-blue-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary/50 ${item.color}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold text-foreground leading-none">{item.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{item.label}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
