import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Camera, Heart, Download, Mail, Phone, Calendar, Trash2, ExternalLink, Plus, Copy, Check, Gift, MessageCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { CRMClient } from "@/pages/Clients";
import { AddMilestoneDialog } from "./AddMilestoneDialog";
import { useClientIntelligence } from "@/hooks/use-client-intelligence";

interface Props {
  client: CRMClient | null;
  onClose: () => void;
  onRemove: (id: string) => void;
  onRefresh: () => void;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  inactive: "bg-muted text-muted-foreground border-border",
};

export function ClientCRMDetail({ client, onClose, onRemove, onRefresh }: Props) {
  const { user } = useAuth();
  const { addMilestone, getWhatsAppLink } = useClientIntelligence();
  const [events, setEvents] = useState<any[]>([]);
  const [assignEventId, setAssignEventId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);

  useEffect(() => {
    if (!user || !client) return;
    (supabase.from("events").select("id, name") as any)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data); });
  }, [user, client]);

  const grantAccess = async () => {
    if (!client || !assignEventId) return;
    setAssigning(true);
    const { error } = await supabase.from("client_events").insert({ client_id: client.id, event_id: assignEventId } as any);
    if (error) {
      if (error.code === "23505") toast.info("Already granted");
      else toast.error("Could not grant access");
    } else {
      toast.success("Access granted");
      onRefresh();
    }
    setAssigning(false);
    setAssignEventId("");
  };

  const copyEmail = () => {
    if (!client) return;
    navigator.clipboard.writeText(client.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!client) return null;

  const initials = client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sheet open={!!client} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* Profile header */}
        <div className="bg-gradient-to-br from-secondary to-secondary/40 px-6 pt-8 pb-6">
          <SheetHeader className="mb-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-card shadow-md">
                <AvatarFallback className="text-lg font-serif font-semibold bg-card text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-serif text-xl truncate">{client.name}</SheetTitle>
                <Badge variant="outline" className={`mt-1.5 text-[9px] uppercase tracking-wider ${statusStyles[client.status]}`}>
                  {client.status}
                </Badge>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Contact</h3>
            <div className="space-y-2">
              <button onClick={copyEmail} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors w-full text-left">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{client.email}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-500 ml-auto" /> : <Copy className="h-3 w-3 text-muted-foreground/40 ml-auto" />}
              </button>
              {client.phone && (
                <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {client.phone}
                </a>
              )}
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Client since {format(new Date(client.created_at), "MMM d, yyyy")}
              </div>
            </div>
          </div>

          <Separator />

          {/* Engagement stats */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Engagement</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Camera, label: "Galleries", value: client.event_count, color: "text-primary" },
                { icon: Heart, label: "Favorites", value: client.favorite_count, color: "text-rose-500" },
                { icon: Download, label: "Downloads", value: client.download_count, color: "text-blue-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-3 text-center">
                    <s.icon className={`h-4 w-4 mx-auto ${s.color} mb-1`} />
                    <p className="text-xl font-serif font-semibold">{s.value}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Assigned galleries */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              Assigned Galleries ({client.events.length})
            </h3>
            {client.events.length > 0 ? (
              <div className="space-y-2">
                {client.events.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border">
                    <div>
                      <p className="text-sm font-medium">{evt.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(evt.event_date), "MMM d, yyyy")} · {evt.photo_count} photos
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => window.open(`/events/${evt.id}`, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No galleries assigned yet</p>
            )}

            {/* Grant access */}
            <div className="flex items-center gap-2">
              <Select value={assignEventId} onValueChange={setAssignEventId}>
                <SelectTrigger className="flex-1 bg-card text-xs">
                  <SelectValue placeholder="Select gallery to grant access" />
                </SelectTrigger>
                <SelectContent>
                  {events
                    .filter((e) => !client.events.some((ce) => ce.id === e.id))
                    .map((evt) => (
                      <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={grantAccess} disabled={!assignEventId || assigning} className="shrink-0 gap-1">
                <Plus className="h-3 w-3" />
                Grant
              </Button>
            </div>
          </div>

          <Separator />

          {/* Milestones & Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Milestones</h3>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setMilestoneOpen(true)}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => setMilestoneOpen(true)}>
                <Heart className="h-3 w-3 text-rose-500" /> Anniversary
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8" onClick={() => setMilestoneOpen(true)}>
                <Gift className="h-3 w-3 text-amber-500" /> Birthday
              </Button>
              {client.phone && (() => {
                const link = getWhatsAppLink(client.phone, `Hi ${client.name}!`);
                return link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                      <MessageCircle className="h-3 w-3 text-emerald-500" /> WhatsApp
                    </Button>
                  </a>
                ) : null;
              })()}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Activity</h3>
            <div className="text-xs text-muted-foreground">
              {client.last_activity ? (
                <p>Last active {formatDistanceToNow(new Date(client.last_activity), { addSuffix: true })}</p>
              ) : (
                <p className="italic">No activity recorded yet</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Danger zone */}
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 text-xs gap-1.5"
            onClick={() => {
              if (confirm(`Remove ${client.name} and revoke all gallery access?`)) {
                onRemove(client.id);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Client
          </Button>
        </div>

        {client && (
          <AddMilestoneDialog
            open={milestoneOpen}
            onOpenChange={setMilestoneOpen}
            clientId={client.id}
            clientName={client.name}
            onSave={addMilestone}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
