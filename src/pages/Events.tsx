import { useEffect, useState } from "react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { ShareModal } from "@/components/ShareModal";
import { EventDuplicateModal } from "@/components/EventDuplicateModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Camera, Search, Eye, Share2, Pencil, Trash2, Copy, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Event {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  is_published: boolean;
  cover_url: string | null;
  gallery_pin: string | null;
  photo_count: number;
  is_archived?: boolean;
}

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [duplicateEvent, setDuplicateEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveTab, setArchiveTab] = useState<"active" | "archived">("active");

  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);

    let query = supabase
      .from("events")
      .select(
        `
        id,
        name,
        slug,
        event_date,
        location,
        is_published,
        cover_url,
        gallery_pin,
        is_archived,
        photos(count)
      `,
      )
      .order("created_at", { ascending: false });

    // SUPER ADMIN sees all events
    if (user.role !== "super_admin") {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;

    if (data) {
      setEvents(
        (data as any[]).map((e: any) => ({
          ...e,
          photo_count: e.photos?.[0]?.count ?? 0,
          is_archived: e.is_archived ?? false,
        })),
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const togglePublish = async (evt: Event) => {
    await supabase
      .from("events")
      .update({ is_published: !evt.is_published } as any)
      .eq("id", evt.id);

    toast.success(evt.is_published ? "Gallery unpublished" : "Gallery published");
    fetchEvents();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    await supabase.from("photos").delete().eq("event_id", deleteId);
    await supabase.from("events").delete().eq("id", deleteId);

    toast.success("Event deleted");
    setDeleteId(null);
    fetchEvents();
  };

  const archiveEvent = async (evt: Event) => {
    await supabase
      .from("events")
      .update({ is_archived: true } as any)
      .eq("id", evt.id);

    toast.success("Event archived");
    fetchEvents();
  };

  const restoreEvent = async (evt: Event) => {
    await supabase
      .from("events")
      .update({ is_archived: false } as any)
      .eq("id", evt.id);

    toast.success("Event restored");
    fetchEvents();
  };

  const isArchived = archiveTab === "archived";

  let filtered = events.filter((e) => {
    if (isArchived ? !e.is_archived : e.is_archived) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "published" && !e.is_published) return false;
    if (statusFilter === "draft" && e.is_published) return false;
    return true;
  });

  if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  else if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  const renderEventCard = (evt: Event) => (
    <div key={evt.id} className="group relative">
      <div
        className="relative aspect-[3/2] overflow-hidden rounded-[14px] cursor-pointer"
        onClick={() => navigate(`/dashboard/events/${evt.id}`)}
      >
        {evt.cover_url ? (
          <ProgressiveImage
            src={evt.cover_url}
            alt={evt.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            context="hero"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary rounded-[14px]">
            <Camera className="h-8 w-8 text-muted-foreground/10" />
          </div>
        )}

        <Badge className="absolute bottom-3 left-3 bg-card/80 text-foreground text-[9px] backdrop-blur-sm border-0 tracking-wider uppercase">
          {evt.photo_count} photos
        </Badge>
      </div>

      <div className="pt-4 pb-2">
        <h3 className="font-serif text-lg text-foreground truncate">{evt.name}</h3>

        {/* SHOW GALLERY PIN */}
        <p className="text-[11px] text-muted-foreground">PIN: {evt.gallery_pin || "No PIN"}</p>

        <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase">
          {format(new Date(evt.event_date), "MMM d, yyyy")}
          {evt.location ? ` · ${evt.location}` : ""}
        </p>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-serif">Events</h1>

        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-[3/2] rounded-[14px]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Camera className="h-7 w-7 text-muted-foreground/20" />
          </div>
          <h3 className="font-serif text-lg text-foreground/70 mb-1">
            {archiveTab === 'archived' ? 'No archived events' : 'No events yet'}
          </h3>
          <p className="text-[12px] text-muted-foreground/50 max-w-[260px]">
            {archiveTab === 'archived'
              ? 'Archived events will appear here'
              : 'Create your first event to start uploading and sharing photos with your clients'}
          </p>
          {archiveTab !== 'archived' && (
            <Button onClick={() => setCreateOpen(true)} className="mt-6" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Create Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">{filtered.map(renderEventCard)}</div>
      )}

      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => navigate(`/dashboard/events/${id}`)}
      />

      {shareEvent && (
        <ShareModal
          open={!!shareEvent}
          onOpenChange={() => setShareEvent(null)}
          eventSlug={shareEvent.slug}
          eventName={shareEvent.name}
          pin={shareEvent.gallery_pin}
        />
      )}

      {duplicateEvent && (
        <EventDuplicateModal
          open={!!duplicateEvent}
          onOpenChange={() => setDuplicateEvent(null)}
          event={duplicateEvent}
        />
      )}
    </DashboardLayout>
  );
};

export default Events;
