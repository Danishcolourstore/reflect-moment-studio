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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Camera, Search, Eye, Share2, Pencil, Trash2, Copy, Archive,
  ArchiveRestore, MoreHorizontal, MapPin, CalendarDays, Images,
  Globe, Lock, SlidersHorizontal, LayoutGrid, List, Download,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format, isAfter, isBefore, subDays } from "date-fns";

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
  gallery_views?: number;
  favorites_count?: number;
  downloads_count?: number;
}

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "name" | "most-photos" | "most-views";
type StatusFilter = "all" | "published" | "draft";
type TimeFilter = "all" | "7d" | "30d" | "90d";

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);
  const [duplicateEvent, setDuplicateEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveTab, setArchiveTab] = useState<"active" | "archived">("active");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("events")
      .select(`id, name, slug, event_date, location, is_published, cover_url, gallery_pin, is_archived, photos(count)`)
      .order("created_at", { ascending: false });

    if (user.role !== "super_admin") {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;

    if (data) {
      const ids = (data as any[]).map((e: any) => e.id);
      // Fetch analytics in parallel
      const { data: analytics } = await (supabase.from("event_analytics").select("event_id, gallery_views, favorites_count, downloads_count") as any).in("event_id", ids);
      const aMap = new Map<string, any>();
      if (analytics) for (const a of analytics as any[]) aMap.set(a.event_id, a);

      setEvents(
        (data as any[]).map((e: any) => {
          const a = aMap.get(e.id);
          return {
            ...e,
            photo_count: e.photos?.[0]?.count ?? 0,
            is_archived: e.is_archived ?? false,
            gallery_views: a?.gallery_views ?? 0,
            favorites_count: a?.favorites_count ?? 0,
            downloads_count: a?.downloads_count ?? 0,
          };
        }),
      );
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const togglePublish = async (evt: Event) => {
    await supabase.from("events").update({ is_published: !evt.is_published } as any).eq("id", evt.id);
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
    await supabase.from("events").update({ is_archived: true } as any).eq("id", evt.id);
    toast.success("Event archived");
    fetchEvents();
  };

  const restoreEvent = async (evt: Event) => {
    await supabase.from("events").update({ is_archived: false } as any).eq("id", evt.id);
    toast.success("Event restored");
    fetchEvents();
  };

  const isArchived = archiveTab === "archived";

  let filtered = events.filter((e) => {
    if (isArchived ? !e.is_archived : e.is_archived) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "published" && !e.is_published) return false;
    if (statusFilter === "draft" && e.is_published) return false;
    if (timeFilter !== "all") {
      const days = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 90;
      if (isBefore(new Date(e.event_date), subDays(new Date(), days))) return false;
    }
    return true;
  });

  if (sortBy === "oldest") filtered.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  else if (sortBy === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === "most-photos") filtered.sort((a, b) => b.photo_count - a.photo_count);
  else if (sortBy === "most-views") filtered.sort((a, b) => (b.gallery_views ?? 0) - (a.gallery_views ?? 0));

  // Stats
  const totalPhotos = events.filter(e => !e.is_archived).reduce((s, e) => s + e.photo_count, 0);
  const totalViews = events.filter(e => !e.is_archived).reduce((s, e) => s + (e.gallery_views ?? 0), 0);
  const publishedCount = events.filter(e => !e.is_archived && e.is_published).length;
  const draftCount = events.filter(e => !e.is_archived && !e.is_published).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">Events</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {events.filter(e => !e.is_archived).length} galleries · {totalPhotos.toLocaleString()} photos · {totalViews.toLocaleString()} views
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="min-h-[44px] gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Quick Stats Bar — Pixieset-style */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Total", value: events.filter(e => !e.is_archived).length, icon: Images },
              { label: "Published", value: publishedCount, icon: Globe },
              { label: "Drafts", value: draftCount, icon: Lock },
              { label: "Views", value: totalViews, icon: Eye },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-3 sm:p-4 text-center">
                <Icon className="h-4 w-4 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="font-serif text-lg sm:text-xl font-bold text-foreground leading-none">{value}</p>
                <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/50 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="pl-9 h-11 text-base bg-card border-border rounded-xl"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            {/* Active / Archived toggle */}
            <div className="flex bg-card border border-border rounded-xl overflow-hidden h-11">
              <button
                onClick={() => setArchiveTab("active")}
                className={`px-3 sm:px-4 text-[11px] uppercase tracking-wider font-medium transition-colors min-w-[44px] ${
                  archiveTab === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >Active</button>
              <button
                onClick={() => setArchiveTab("archived")}
                className={`px-3 sm:px-4 text-[11px] uppercase tracking-wider font-medium transition-colors min-w-[44px] ${
                  archiveTab === "archived" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Archive className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">Archived</span>
              </button>
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 w-11 flex items-center justify-center rounded-xl border transition-colors ${
                showFilters ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* View toggle */}
            <div className="hidden sm:flex bg-card border border-border rounded-xl overflow-hidden h-11">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              ><LayoutGrid className="h-4 w-4" /></button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              ><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 bg-card border border-border rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-[11px] bg-background border-border rounded-lg">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Drafts</SelectItem>
              </SelectContent>
            </Select>

            {/* Time filter */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-auto min-w-[120px] h-9 text-[11px] bg-background border-border rounded-lg">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-auto min-w-[140px] h-9 text-[11px] bg-background border-border rounded-lg">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name A→Z</SelectItem>
                <SelectItem value="most-photos">Most Photos</SelectItem>
                <SelectItem value="most-views">Most Views</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || timeFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={() => { setStatusFilter("all"); setTimeFilter("all"); setSortBy("newest"); }}
                className="text-[10px] text-primary underline underline-offset-2 min-h-[44px] px-2"
              >Clear filters</button>
            )}
          </div>
        )}

        {/* Results count */}
        {search && (
          <p className="text-[11px] text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center mb-5">
              <Camera className="h-9 w-9 text-muted-foreground/15" />
            </div>
            <h3 className="font-serif text-lg text-foreground/70 mb-1">
              {archiveTab === "archived" ? "No archived events" : search ? "No matching events" : "No events yet"}
            </h3>
            <p className="text-[12px] text-muted-foreground/50 max-w-[280px]">
              {archiveTab === "archived"
                ? "Archived events will appear here"
                : search
                  ? "Try adjusting your search or filters"
                  : "Create your first event to start delivering galleries to your clients"}
            </p>
            {archiveTab !== "archived" && !search && (
              <Button onClick={() => setCreateOpen(true)} className="mt-6 gap-2 rounded-xl" size="sm">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            )}
          </div>
        ) : viewMode === "list" ? (
          /* LIST VIEW — Pic-Time style */
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            {filtered.map((evt, i) => (
              <div
                key={evt.id}
                className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors ${
                  i < filtered.length - 1 ? "border-b border-border/50" : ""
                }`}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
              >
                {/* Thumbnail */}
                <div className="h-12 w-16 sm:h-14 sm:w-20 rounded-lg overflow-hidden shrink-0 bg-secondary">
                  {evt.cover_url ? (
                    <ProgressiveImage src={evt.cover_url} alt={evt.name} className="h-full w-full object-cover" context="grid" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Camera className="h-4 w-4 text-muted-foreground/15" /></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-sm font-medium text-foreground truncate">{evt.name}</h3>
                    {evt.is_published ? (
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-0 shrink-0">Live</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[8px] px-1.5 py-0 bg-muted text-muted-foreground border-0 shrink-0">Draft</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/60">
                    <span>{format(new Date(evt.event_date), "MMM d, yyyy")}</span>
                    {evt.location && <span className="truncate max-w-[100px]">{evt.location}</span>}
                    <span>{evt.photo_count} photos</span>
                  </div>
                </div>

                {/* Stats — desktop */}
                <div className="hidden sm:flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{evt.gallery_views ?? 0}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" />{evt.downloads_count ?? 0}</span>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px]">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${evt.id}`); }}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Gallery
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShareEvent(evt); }}>
                      <Share2 className="h-3.5 w-3.5 mr-2" /> Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePublish(evt); }}>
                      {evt.is_published ? <Lock className="h-3.5 w-3.5 mr-2" /> : <Globe className="h-3.5 w-3.5 mr-2" />}
                      {evt.is_published ? "Unpublish" : "Publish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDuplicateEvent(evt); }}>
                      <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {evt.is_archived ? (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); restoreEvent(evt); }}>
                        <ArchiveRestore className="h-3.5 w-3.5 mr-2" /> Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveEvent(evt); }}>
                        <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(evt.id); }} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          /* GRID VIEW — Premium card style */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((evt) => (
              <div key={evt.id} className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-foreground/10 transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
                {/* Cover Image */}
                <div
                  className="relative aspect-[16/10] overflow-hidden cursor-pointer"
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
                    <div className="flex h-full items-center justify-center bg-secondary">
                      <Camera className="h-10 w-10 text-muted-foreground/8" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    {evt.is_published ? (
                      <Badge className="bg-emerald-500/90 text-white border-0 text-[9px] px-2 py-0.5 backdrop-blur-sm">
                        <Globe className="h-2.5 w-2.5 mr-1" /> Live
                      </Badge>
                    ) : (
                      <Badge className="bg-card/80 text-muted-foreground border-0 text-[9px] px-2 py-0.5 backdrop-blur-sm">
                        <Lock className="h-2.5 w-2.5 mr-1" /> Draft
                      </Badge>
                    )}
                  </div>

                  {/* Quick stats overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" style={{ opacity: undefined }}>
                    <div className="flex items-center gap-3 text-white/90 text-[10px]">
                      <span className="flex items-center gap-1"><Images className="h-3 w-3" />{evt.photo_count}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{evt.gallery_views ?? 0}</span>
                      <span className="flex items-center gap-1"><Download className="h-3 w-3" />{evt.downloads_count ?? 0}</span>
                    </div>
                  </div>

                  {/* Kebab menu */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="h-8 w-8 flex items-center justify-center rounded-full bg-card/70 backdrop-blur-sm hover:bg-card transition-colors opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 min-h-[44px] min-w-[44px] -mt-2 -mr-2 p-0 items-center justify-center flex">
                          <MoreHorizontal className="h-4 w-4 text-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${evt.id}`); }}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Gallery
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShareEvent(evt); }}>
                          <Share2 className="h-3.5 w-3.5 mr-2" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePublish(evt); }}>
                          {evt.is_published ? <Lock className="h-3.5 w-3.5 mr-2" /> : <Globe className="h-3.5 w-3.5 mr-2" />}
                          {evt.is_published ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDuplicateEvent(evt); }}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {evt.is_archived ? (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); restoreEvent(evt); }}>
                            <ArchiveRestore className="h-3.5 w-3.5 mr-2" /> Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); archiveEvent(evt); }}>
                            <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeleteId(evt.id); }} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 sm:p-4" onClick={() => navigate(`/dashboard/events/${evt.id}`)} role="button">
                  <h3 className="font-serif text-[15px] font-medium text-foreground truncate leading-tight">{evt.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground/50">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span>{format(new Date(evt.event_date), "MMM d, yyyy")}</span>
                    {evt.location && (
                      <>
                        <span className="text-muted-foreground/20">·</span>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </>
                    )}
                  </div>

                  {/* Quick action row */}
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/50">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePublish(evt); }}
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted min-h-[36px]"
                    >
                      <Switch checked={evt.is_published} className="h-4 w-7 [&>span]:h-3 [&>span]:w-3" />
                      <span className="hidden sm:inline">{evt.is_published ? "Live" : "Draft"}</span>
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setShareEvent(evt); }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted min-h-[36px]"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${evt.id}`); }}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-primary/5 font-medium min-h-[36px]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the event and all its photos. This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => navigate(`/dashboard/events/${id}`)} />
      {shareEvent && <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventSlug={shareEvent.slug} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />}
      {duplicateEvent && <EventDuplicateModal open={!!duplicateEvent} onOpenChange={() => setDuplicateEvent(null)} event={duplicateEvent} />}
    </DashboardLayout>
  );
};

export default Events;
