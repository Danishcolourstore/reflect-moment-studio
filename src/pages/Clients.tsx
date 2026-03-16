import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ClientCRMHeader } from "@/components/crm/ClientCRMHeader";
import { ClientCRMStats } from "@/components/crm/ClientCRMStats";
import { ClientCRMGrid } from "@/components/crm/ClientCRMGrid";
import { ClientCRMTable } from "@/components/crm/ClientCRMTable";
import { ClientCRMDetail } from "@/components/crm/ClientCRMDetail";
import { InviteClientModal } from "@/components/InviteClientModal";
import { ClientRelationshipPanel } from "@/components/crm/ClientRelationshipPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export interface CRMClient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  event_count: number;
  favorite_count: number;
  download_count: number;
  events: { id: string; name: string; event_date: string; photo_count: number }[];
  last_activity: string | null;
  status: "active" | "pending" | "inactive";
}

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("all");

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);

    const { data: rawClients } = await (
      supabase.from("clients").select("id, user_id, name, email, phone, created_at") as any
    ).eq("photographer_id", user.id).order("created_at", { ascending: false });

    if (!rawClients || rawClients.length === 0) {
      setClients([]);
      setLoading(false);
      return;
    }

    const clientIds = rawClients.map((c: any) => c.id);

    const [eventAccessRes, favsRes, dlsRes, eventsRes] = await Promise.all([
      (supabase.from("client_events").select("client_id, event_id") as any).in("client_id", clientIds),
      (supabase.from("client_favorites").select("client_id, created_at") as any).in("client_id", clientIds),
      (supabase.from("client_downloads").select("client_id, downloaded_at") as any).in("client_id", clientIds),
      (supabase.from("events").select("id, name, event_date, photo_count") as any).eq("user_id", user.id),
    ]);

    const eventAccess = eventAccessRes.data || [];
    const favs = favsRes.data || [];
    const dls = dlsRes.data || [];
    const allEvents = eventsRes.data || [];

    const eventMap = new Map(allEvents.map((e: any) => [e.id, e]));

    setClients(
      rawClients.map((c: any) => {
        const clientEventIds = eventAccess.filter((a: any) => a.client_id === c.id).map((a: any) => a.event_id);
        const clientFavs = favs.filter((f: any) => f.client_id === c.id);
        const clientDls = dls.filter((d: any) => d.client_id === c.id);
        const clientEvents = clientEventIds.map((eid: string) => eventMap.get(eid)).filter(Boolean);

        const allDates = [
          ...clientFavs.map((f: any) => f.created_at),
          ...clientDls.map((d: any) => d.downloaded_at),
        ];
        const lastActivity = allDates.length > 0 ? allDates.sort().reverse()[0] : null;

        const daysSinceCreated = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const hasActivity = clientFavs.length > 0 || clientDls.length > 0;
        const status: CRMClient["status"] = hasActivity ? "active" : daysSinceCreated < 7 ? "pending" : "inactive";

        return {
          ...c,
          event_count: clientEventIds.length,
          favorite_count: clientFavs.length,
          download_count: clientDls.length,
          events: clientEvents,
          last_activity: lastActivity,
          status,
        };
      })
    );

    setLoading(false);
  };

  useEffect(() => { loadClients(); }, [user]);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    pending: clients.filter((c) => c.status === "pending").length,
    totalFavorites: clients.reduce((s, c) => s + c.favorite_count, 0),
    totalDownloads: clients.reduce((s, c) => s + c.download_count, 0),
  }), [clients]);

  const removeClient = async (clientId: string) => {
    await (supabase.from("client_events").delete() as any).eq("client_id", clientId);
    await (supabase.from("client_favorites").delete() as any).eq("client_id", clientId);
    await (supabase.from("client_downloads").delete() as any).eq("client_id", clientId);
    await (supabase.from("clients").delete() as any).eq("id", clientId);
    toast.success("Client removed");
    setSelectedClient(null);
    loadClients();
  };

  return (
    <DashboardLayout>
      <Tabs defaultValue="clients" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="clients" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Clients
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Intelligence
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="clients" className="space-y-6 mt-0">
          <ClientCRMHeader
            search={search}
            onSearchChange={setSearch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onInvite={() => setInviteOpen(true)}
          />

          <ClientCRMStats stats={stats} loading={loading} />

          {viewMode === "grid" ? (
            <ClientCRMGrid
              clients={filtered}
              loading={loading}
              onSelect={setSelectedClient}
              onInvite={() => setInviteOpen(true)}
            />
          ) : (
            <ClientCRMTable
              clients={filtered}
              loading={loading}
              onSelect={setSelectedClient}
              onInvite={() => setInviteOpen(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="mt-0">
          <ClientRelationshipPanel />
        </TabsContent>
      </Tabs>

      <InviteClientModal open={inviteOpen} onOpenChange={setInviteOpen} onInvited={loadClients} />

      <ClientCRMDetail
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onRemove={removeClient}
        onRefresh={loadClients}
      />
    </DashboardLayout>
  );
};

export default Clients;
