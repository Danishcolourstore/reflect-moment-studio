import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, UserPlus, Camera, Shield, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { InviteClientModal } from "@/components/InviteClientModal";
import { StudioBrainCards } from "@/components/entiran/StudioBrainCards";
import { EventLifecycle } from "@/components/entiran/EventLifecycle";
import { useStudioBrain } from "@/hooks/use-studio-brain";

interface ManagedClient {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  event_count: number;
  favorite_count: number;
  download_count: number;
}

const Clients = () => {
  const { user } = useAuth();

  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<ManagedClient | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [assignEventId, setAssignEventId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);

    const { data: rawClients } = await (
      supabase.from("clients").select("id, user_id, name, email, phone, created_at") as any
    )
      .eq("photographer_id", user.id)
      .order("created_at", { ascending: false });

    if (!rawClients || rawClients.length === 0) {
      setClients([]);
      setLoading(false);
      return;
    }

    const clientIds = rawClients.map((c: any) => c.id);

    const { data: eventAccess } = await (supabase.from("client_events").select("client_id") as any).in(
      "client_id",
      clientIds,
    );

    const eventCounts = new Map<string, number>();
    (eventAccess || []).forEach((a: any) => {
      eventCounts.set(a.client_id, (eventCounts.get(a.client_id) || 0) + 1);
    });

    const { data: favs } = await (supabase.from("client_favorites").select("client_id") as any).in(
      "client_id",
      clientIds,
    );

    const favCounts = new Map<string, number>();
    (favs || []).forEach((f: any) => {
      favCounts.set(f.client_id, (favCounts.get(f.client_id) || 0) + 1);
    });

    const { data: dls } = await (supabase.from("client_downloads").select("client_id") as any).in(
      "client_id",
      clientIds,
    );

    const dlCounts = new Map<string, number>();
    (dls || []).forEach((d: any) => {
      dlCounts.set(d.client_id, (dlCounts.get(d.client_id) || 0) + 1);
    });

    setClients(
      rawClients.map((c: any) => ({
        ...c,
        event_count: eventCounts.get(c.id) || 0,
        favorite_count: favCounts.get(c.id) || 0,
        download_count: dlCounts.get(c.id) || 0,
      })),
    );

    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    (supabase.from("events").select("id, name") as any)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        if (data) setEvents(data);
      });
  }, [user]);

  const filtered = clients.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const grantAccess = async () => {
    if (!assignOpen || !assignEventId) return;

    setAssigning(true);

    const { error } = await supabase
      .from("client_events")
      .insert({ client_id: assignOpen.id, event_id: assignEventId } as any);

    if (error) {
      if (error.code === "23505") toast.info("Access already granted");
      else toast.error("Failed to grant access");
    } else {
      toast.success("Gallery access granted");
      loadClients();
    }

    setAssigning(false);
    setAssignOpen(null);
    setAssignEventId("");
  };

  const removeAccess = async (clientId: string) => {
    await (supabase.from("client_events").delete() as any).eq("client_id", clientId);

    toast.success("Gallery access removed");
    loadClients();
  };

  return (
    <DashboardLayout>
      {/* Header */}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-serif text-2xl">Client Manager</h1>
          <p className="text-sm text-muted-foreground">Manage clients and grant access to galleries</p>
        </div>

        <Button onClick={() => setInviteOpen(true)} className="text-[11px] uppercase tracking-wider">
          <UserPlus className="h-4 w-4 mr-1" />
          Add Client
        </Button>
      </div>

      {/* Search */}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="pl-9"
        />
      </div>

      {/* Loading */}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty */

        <div className="text-center py-24 border border-dashed rounded-xl">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/20" />

          <p className="mt-4 font-serif text-lg">No clients added yet</p>

          <p className="text-sm text-muted-foreground">Add clients to grant access to galleries</p>

          <Button className="mt-4" onClick={() => setInviteOpen(true)}>
            Add Client
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-secondary/30 border-b">
              <tr>
                <th className="px-4 py-3 text-xs uppercase">Client</th>
                <th className="px-4 py-3 text-xs uppercase text-center">Galleries</th>
                <th className="px-4 py-3 text-xs uppercase text-center">Favorites</th>
                <th className="px-4 py-3 text-xs uppercase text-center">Downloads</th>
                <th className="px-4 py-3 text-xs uppercase">Last Activity</th>
                <th className="px-4 py-3 text-xs uppercase text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                  </td>

                  <td className="text-center">{c.event_count}</td>

                  <td className="text-center">{c.favorite_count}</td>

                  <td className="text-center">{c.download_count}</td>

                  <td className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                    })}
                  </td>

                  <td className="text-right px-4">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setAssignOpen(c)}>
                        <Camera className="h-3 w-3 mr-1" />
                        Grant Access
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => window.open(`/client/${c.id}`, "_blank")}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>

                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeAccess(c.id)}>
                        <Shield className="h-3 w-3 mr-1" />
                        Remove Access
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InviteClientModal open={inviteOpen} onOpenChange={setInviteOpen} onInvited={loadClients} />

      {/* Grant Access Dialog */}

      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Gallery Access to {assignOpen?.name}</DialogTitle>

            <DialogDescription>Select gallery to grant access</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={assignEventId} onValueChange={setAssignEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select gallery" />
              </SelectTrigger>

              <SelectContent>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>
                    {evt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={grantAccess} disabled={!assignEventId || assigning} className="w-full">
              {assigning ? "Granting..." : "Grant Access"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Clients;
