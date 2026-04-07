import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ClientCRMGrid } from "@/components/crm/ClientCRMGrid";
import { ClientCRMTable } from "@/components/crm/ClientCRMTable";
import { ClientCRMDetail } from "@/components/crm/ClientCRMDetail";
import { InviteClientModal } from "@/components/InviteClientModal";
import { ClientRelationshipPanel } from "@/components/crm/ClientRelationshipPanel";
import { Users, Heart, Download, Clock, UserCheck, Search, LayoutGrid, List } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"clients" | "insights">("clients");

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);
    const { data: rawClients } = await (supabase.from("clients").select("id, user_id, name, email, phone, created_at") as any).eq("photographer_id", user.id).order("created_at", { ascending: false });
    if (!rawClients || rawClients.length === 0) { setClients([]); setLoading(false); return; }
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
    setClients(rawClients.map((c: any) => {
      const clientEventIds = eventAccess.filter((a: any) => a.client_id === c.id).map((a: any) => a.event_id);
      const clientFavs = favs.filter((f: any) => f.client_id === c.id);
      const clientDls = dls.filter((d: any) => d.client_id === c.id);
      const clientEvents = clientEventIds.map((eid: string) => eventMap.get(eid)).filter(Boolean);
      const allDates = [...clientFavs.map((f: any) => f.created_at), ...clientDls.map((d: any) => d.downloaded_at)];
      const lastActivity = allDates.length > 0 ? allDates.sort().reverse()[0] : null;
      const daysSinceCreated = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const hasActivity = clientFavs.length > 0 || clientDls.length > 0;
      const status: CRMClient["status"] = hasActivity ? "active" : daysSinceCreated < 7 ? "pending" : "inactive";
      return { ...c, event_count: clientEventIds.length, favorite_count: clientFavs.length, download_count: clientDls.length, events: clientEvents, last_activity: lastActivity, status };
    }));
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

  const STAT_ITEMS = [
    { label: "Total Clients", value: stats.total, icon: Users },
    { label: "Active", value: stats.active, icon: UserCheck },
    { label: "Pending", value: stats.pending, icon: Clock },
    { label: "Favorites", value: stats.totalFavorites, icon: Heart },
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, color: "#1C1C1E", margin: 0 }}>
              Client Hub
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#999999", marginTop: 4 }}>
              Your client relationships
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            style={{
              background: "none",
              border: "1px solid #C8A97E",
              borderRadius: 8,
              padding: "8px 18px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#C8A97E",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#C8A97E"; e.currentTarget.style.color = "#FFFFFF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#C8A97E"; }}
          >
            Add Client +
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, marginBottom: 24, borderBottom: "1px solid #F0EDE8" }}>
          {(["clients", "insights"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: activeTab === tab ? "#1C1C1E" : "#BBBBBB",
                fontWeight: activeTab === tab ? 500 : 400,
                paddingBottom: 12,
                borderBottom: activeTab === tab ? "2px solid #C8A97E" : "2px solid transparent",
                transition: "all 0.2s",
              }}
            >
              {tab === "clients" ? "Clients" : "Insights"}
            </button>
          ))}
        </div>

        {activeTab === "clients" ? (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
              {STAT_ITEMS.map((item) => (
                <div key={item.label} style={{ background: "#FFFFFF", border: "1px solid #F0EDE8", borderRadius: 12, padding: 16 }}>
                  {loading ? (
                    <div style={{ height: 48, background: "#F5F3F0", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FAF8F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <item.icon style={{ width: 16, height: 16, color: "#C8A97E" }} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#1C1C1E", fontWeight: 400, lineHeight: 1, margin: 0 }}>{item.value}</p>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#AAAAAA", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{item.label}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#BBBBBB" }} strokeWidth={1.5} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                style={{
                  width: "100%",
                  background: "#F5F4F2",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 14px 12px 40px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#1C1C1E",
                  outline: "none",
                }}
              />
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 mb-4">
              {([["grid", LayoutGrid], ["table", List]] as const).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as "grid" | "table")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 8,
                    borderRadius: 8,
                    color: viewMode === mode ? "#C8A97E" : "#CCCCCC",
                    transition: "color 0.2s",
                  }}
                >
                  <Icon style={{ width: 18, height: 18 }} strokeWidth={1.5} />
                </button>
              ))}
            </div>

            {viewMode === "grid" ? (
              <ClientCRMGrid clients={filtered} loading={loading} onSelect={setSelectedClient} onInvite={() => setInviteOpen(true)} />
            ) : (
              <ClientCRMTable clients={filtered} loading={loading} onSelect={setSelectedClient} onInvite={() => setInviteOpen(true)} />
            )}
          </>
        ) : (
          <ClientRelationshipPanel />
        )}
      </div>

      <InviteClientModal open={inviteOpen} onOpenChange={setInviteOpen} onInvited={loadClients} />
      <ClientCRMDetail client={selectedClient} onClose={() => setSelectedClient(null)} onRemove={removeClient} onRefresh={loadClients} />
    </DashboardLayout>
  );
};

export default Clients;
