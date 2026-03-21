import { useEffect, useState } from "react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateEventModal } from "@/components/CreateEventModal";
import { ShareModal } from "@/components/ShareModal";
import { EventDuplicateModal } from "@/components/EventDuplicateModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Camera,
  Search,
  Eye,
  Share2,
  Pencil,
  Trash2,
  Copy,
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  MapPin,
  CalendarDays,
  Images,
  Globe,
  Lock,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format, isBefore, subDays } from "date-fns";

const cormorant = '"Cormorant Garamond", serif';
const dm = '"DM Sans", sans-serif';

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
    if (user.role !== "super_admin") query = query.eq("user_id", user.id);
    const { data } = await query;
    if (data) {
      const ids = (data as any[]).map((e: any) => e.id);
      const { data: analytics } = await (
        supabase.from("event_analytics").select("event_id, gallery_views, favorites_count, downloads_count") as any
      ).in("event_id", ids);
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

  const totalPhotos = events.filter((e) => !e.is_archived).reduce((s, e) => s + e.photo_count, 0);
  const totalViews = events.filter((e) => !e.is_archived).reduce((s, e) => s + (e.gallery_views ?? 0), 0);
  const publishedCount = events.filter((e) => !e.is_archived && e.is_published).length;
  const draftCount = events.filter((e) => !e.is_archived && !e.is_published).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ── Page Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p
              style={{
                fontFamily: dm,
                fontSize: 9,
                color: "rgba(240,237,232,0.3)",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Your Work
            </p>
            <h1
              style={{
                fontFamily: cormorant,
                fontSize: "clamp(36px, 8vw, 56px)",
                fontWeight: 300,
                color: "#F0EDE8",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}
            >
              Events
            </h1>
            <div style={{ width: 32, height: 1, background: "#E8C97A", marginTop: 12, marginBottom: 8 }} />
            <p style={{ fontFamily: dm, fontSize: 11, color: "rgba(240,237,232,0.3)", letterSpacing: "0.12em" }}>
              {events.filter((e) => !e.is_archived).length} galleries · {totalPhotos.toLocaleString()} photos ·{" "}
              {totalViews.toLocaleString()} views
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 transition-all duration-200"
            style={{
              fontFamily: dm,
              fontSize: 10,
              fontWeight: 600,
              color: "#080808",
              background: "#E8C97A",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "10px 20px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F0D98A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#E8C97A")}
          >
            <Plus size={14} />
            New
          </button>
        </div>

        {/* ── Stats Row ── */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", value: events.filter((e) => !e.is_archived).length },
              { label: "Published", value: publishedCount },
              { label: "Drafts", value: draftCount },
              { label: "Views", value: totalViews },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="text-center py-4"
                style={{ background: "#0E0E0E", border: "1px solid rgba(240,237,232,0.06)", borderRadius: 8 }}
              >
                <p style={{ fontFamily: cormorant, fontSize: 32, fontWeight: 300, color: "#F0EDE8", lineHeight: 1 }}>
                  {value}
                </p>
                <p
                  style={{
                    fontFamily: dm,
                    fontSize: 9,
                    color: "rgba(240,237,232,0.3)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginTop: 4,
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Controls ── */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: "rgba(240,237,232,0.2)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events"
              style={{
                width: "100%",
                height: 40,
                paddingLeft: 36,
                paddingRight: 12,
                background: "#0E0E0E",
                border: "1px solid rgba(240,237,232,0.06)",
                borderRadius: 4,
                fontFamily: dm,
                fontSize: 12,
                color: "#F0EDE8",
                outline: "none",
              }}
            />
          </div>

          {/* Active / Archived */}
          <div
            className="flex"
            style={{
              background: "#0E0E0E",
              border: "1px solid rgba(240,237,232,0.06)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {(["active", "archived"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setArchiveTab(tab)}
                style={{
                  fontFamily: dm,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "0 16px",
                  height: 40,
                  background: archiveTab === tab ? "rgba(232,201,122,0.1)" : "transparent",
                  color: archiveTab === tab ? "#E8C97A" : "rgba(240,237,232,0.3)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab === "active" ? "Active" : "Archived"}
              </button>
            ))}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: showFilters ? "rgba(232,201,122,0.1)" : "#0E0E0E",
              border: `1px solid ${showFilters ? "rgba(232,201,122,0.3)" : "rgba(240,237,232,0.06)"}`,
              borderRadius: 4,
              cursor: "pointer",
              color: showFilters ? "#E8C97A" : "rgba(240,237,232,0.3)",
            }}
          >
            <SlidersHorizontal size={14} />
          </button>

          {/* View mode */}
          <div
            className="hidden sm:flex"
            style={{
              background: "#0E0E0E",
              border: "1px solid rgba(240,237,232,0.06)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {(["grid", "list"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: viewMode === mode ? "rgba(232,201,122,0.1)" : "transparent",
                  color: viewMode === mode ? "#E8C97A" : "rgba(240,237,232,0.3)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {mode === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Expanded Filters ── */}
        {showFilters && (
          <div
            className="flex flex-wrap items-center gap-2 p-4"
            style={{ background: "#0E0E0E", border: "1px solid rgba(240,237,232,0.06)", borderRadius: 4 }}
          >
            {[
              {
                value: statusFilter,
                onChange: (v: string) => setStatusFilter(v as StatusFilter),
                options: [
                  ["all", "All Status"],
                  ["published", "Published"],
                  ["draft", "Drafts"],
                ],
              },
              {
                value: timeFilter,
                onChange: (v: string) => setTimeFilter(v as TimeFilter),
                options: [
                  ["all", "All Time"],
                  ["7d", "Last 7 days"],
                  ["30d", "Last 30 days"],
                  ["90d", "Last 90 days"],
                ],
              },
              {
                value: sortBy,
                onChange: (v: string) => setSortBy(v as SortOption),
                options: [
                  ["newest", "Newest"],
                  ["oldest", "Oldest"],
                  ["name", "Name A→Z"],
                  ["most-photos", "Most Photos"],
                  ["most-views", "Most Views"],
                ],
              },
            ].map((sel, i) => (
              <Select key={i} value={sel.value} onValueChange={sel.onChange}>
                <SelectTrigger
                  className="w-auto min-w-[120px] h-9 text-[11px] rounded-sm"
                  style={{
                    background: "#080808",
                    border: "1px solid rgba(240,237,232,0.08)",
                    fontFamily: dm,
                    color: "rgba(240,237,232,0.6)",
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sel.options.map(([v, l]) => (
                    <SelectItem key={v} value={v} style={{ fontFamily: dm, fontSize: 12 }}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            {(statusFilter !== "all" || timeFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setTimeFilter("all");
                  setSortBy("newest");
                }}
                style={{
                  fontFamily: dm,
                  fontSize: 10,
                  color: "#E8C97A",
                  letterSpacing: "0.1em",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Search result count ── */}
        {search && (
          <p style={{ fontFamily: dm, fontSize: 11, color: "rgba(240,237,232,0.3)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[16/10] rounded-sm" style={{ background: "#0E0E0E" }} />
                <div className="h-4 w-3/4 rounded-sm" style={{ background: "#0E0E0E" }} />
                <div className="h-3 w-1/2 rounded-sm" style={{ background: "#0E0E0E" }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Camera size={32} style={{ color: "rgba(240,237,232,0.1)", marginBottom: 20 }} />
            <h3
              style={{
                fontFamily: cormorant,
                fontSize: 24,
                fontWeight: 300,
                color: "rgba(240,237,232,0.4)",
                marginBottom: 8,
              }}
            >
              {archiveTab === "archived" ? "No archived events" : search ? "No matching events" : "No events yet"}
            </h3>
            <p style={{ fontFamily: dm, fontSize: 12, color: "rgba(240,237,232,0.2)", maxWidth: 260, lineHeight: 1.6 }}>
              {archiveTab === "archived"
                ? "Archived events will appear here"
                : search
                  ? "Try adjusting your search"
                  : "Create your first event to start delivering galleries"}
            </p>
            {archiveTab !== "archived" && !search && (
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 mt-8"
                style={{
                  fontFamily: dm,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#080808",
                  background: "#E8C97A",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "10px 24px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Plus size={14} /> Create Event
              </button>
            )}
          </div>
        ) : viewMode === "list" ? (
          /* ── LIST VIEW ── */
          <div style={{ border: "1px solid rgba(240,237,232,0.06)", borderRadius: 4, overflow: "hidden" }}>
            {filtered.map((evt, i) => (
              <div
                key={evt.id}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(240,237,232,0.04)" : "none",
                  background: "transparent",
                }}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,237,232,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Thumbnail */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{ width: 64, height: 44, borderRadius: 2, background: "#0E0E0E" }}
                >
                  {evt.cover_url ? (
                    <ProgressiveImage
                      src={evt.cover_url}
                      alt={evt.name}
                      className="h-full w-full object-cover"
                      context="grid"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Camera size={14} style={{ color: "rgba(240,237,232,0.1)" }} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className="truncate"
                      style={{ fontFamily: cormorant, fontSize: 16, fontWeight: 400, color: "#F0EDE8" }}
                    >
                      {evt.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: dm,
                        fontSize: 8,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: evt.is_published ? "#4ade80" : "rgba(240,237,232,0.3)",
                        background: evt.is_published ? "rgba(74,222,128,0.08)" : "rgba(240,237,232,0.04)",
                        padding: "2px 6px",
                        borderRadius: 2,
                        flexShrink: 0,
                      }}
                    >
                      {evt.is_published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-3 mt-1"
                    style={{ fontFamily: dm, fontSize: 10, color: "rgba(240,237,232,0.3)" }}
                  >
                    <span>{format(new Date(evt.event_date), "MMM d, yyyy")}</span>
                    {evt.location && <span className="truncate max-w-[100px]">{evt.location}</span>}
                    <span>{evt.photo_count} photos</span>
                  </div>
                </div>

                {/* Stats */}
                <div
                  className="hidden sm:flex items-center gap-4"
                  style={{ fontFamily: dm, fontSize: 10, color: "rgba(240,237,232,0.25)" }}
                >
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {evt.gallery_views ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={11} />
                    {evt.downloads_count ?? 0}
                  </span>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button
                      className="flex items-center justify-center transition-colors"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "rgba(240,237,232,0.3)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,237,232,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/events/${evt.id}`);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit Gallery
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareEvent(evt);
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublish(evt);
                      }}
                    >
                      {evt.is_published ? (
                        <Lock className="h-3.5 w-3.5 mr-2" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 mr-2" />
                      )}
                      {evt.is_published ? "Unpublish" : "Publish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuplicateEvent(evt);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {evt.is_archived ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreEvent(evt);
                        }}
                      >
                        <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                        Restore
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveEvent(evt);
                        }}
                      >
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(evt.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((evt) => (
              <div
                key={evt.id}
                className="group relative overflow-hidden cursor-pointer"
                style={{ background: "#0E0E0E", borderRadius: 4, border: "1px solid rgba(240,237,232,0.06)" }}
              >
                {/* Cover */}
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: "16/10" }}
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
                    <div className="flex h-full items-center justify-center" style={{ background: "#111" }}>
                      <Camera size={24} style={{ color: "rgba(240,237,232,0.06)" }} />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      style={{
                        fontFamily: dm,
                        fontSize: 8,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: evt.is_published ? "#4ade80" : "rgba(240,237,232,0.4)",
                        background: evt.is_published ? "rgba(74,222,128,0.12)" : "rgba(8,8,8,0.7)",
                        padding: "3px 8px",
                        borderRadius: 2,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {evt.is_published ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Hover stats */}
                  <div
                    className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 pt-8"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
                  >
                    <div
                      className="flex items-center gap-3"
                      style={{ fontFamily: dm, fontSize: 10, color: "rgba(255,255,255,0.7)" }}
                    >
                      <span className="flex items-center gap-1">
                        <Images size={11} />
                        {evt.photo_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {evt.gallery_views ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download size={11} />
                        {evt.downloads_count ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Kebab */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                          className="flex items-center justify-center"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            background: "rgba(8,8,8,0.7)",
                            backdropFilter: "blur(8px)",
                            border: "none",
                            cursor: "pointer",
                            color: "#F0EDE8",
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/events/${evt.id}`);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Edit Gallery
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareEvent(evt);
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePublish(evt);
                          }}
                        >
                          {evt.is_published ? (
                            <Lock className="h-3.5 w-3.5 mr-2" />
                          ) : (
                            <Globe className="h-3.5 w-3.5 mr-2" />
                          )}
                          {evt.is_published ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDuplicateEvent(evt);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {evt.is_archived ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreEvent(evt);
                            }}
                          >
                            <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveEvent(evt);
                            }}
                          >
                            <Archive className="h-3.5 w-3.5 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(evt.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Card footer */}
                <div className="p-4" onClick={() => navigate(`/dashboard/events/${evt.id}`)}>
                  <h3
                    className="truncate"
                    style={{
                      fontFamily: cormorant,
                      fontSize: 18,
                      fontWeight: 400,
                      color: "#F0EDE8",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {evt.name}
                  </h3>
                  <div
                    className="flex items-center gap-1.5 mt-1"
                    style={{ fontFamily: dm, fontSize: 10, color: "rgba(240,237,232,0.3)" }}
                  >
                    <span>{format(new Date(evt.event_date), "MMM d, yyyy")}</span>
                    {evt.location && (
                      <>
                        <span style={{ color: "rgba(240,237,232,0.15)" }}>·</span>
                        <span className="truncate">{evt.location}</span>
                      </>
                    )}
                  </div>

                  {/* Actions row */}
                  <div
                    className="flex items-center mt-3 pt-3"
                    style={{ borderTop: "1px solid rgba(240,237,232,0.05)" }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublish(evt);
                      }}
                      className="flex items-center gap-1.5 transition-colors"
                      style={{
                        fontFamily: dm,
                        fontSize: 10,
                        color: "rgba(240,237,232,0.3)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Switch checked={evt.is_published} className="h-4 w-7 [&>span]:h-3 [&>span]:w-3" />
                      <span>{evt.is_published ? "Live" : "Draft"}</span>
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareEvent(evt);
                      }}
                      className="flex items-center gap-1 transition-colors px-2 py-1"
                      style={{
                        fontFamily: dm,
                        fontSize: 10,
                        color: "rgba(240,237,232,0.3)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.3)")}
                    >
                      <Share2 size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/events/${evt.id}`);
                      }}
                      className="flex items-center gap-1 transition-colors px-2 py-1"
                      style={{
                        fontFamily: dm,
                        fontSize: 10,
                        color: "#E8C97A",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 2,
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Delete Dialog ── */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent
            className="max-w-sm"
            style={{ background: "#0C0C0C", border: "1px solid rgba(240,237,232,0.08)" }}
          >
            <DialogHeader>
              <DialogTitle style={{ fontFamily: cormorant, fontSize: 20, fontWeight: 400, color: "#F0EDE8" }}>
                Delete Event
              </DialogTitle>
            </DialogHeader>
            <p style={{ fontFamily: dm, fontSize: 12, color: "rgba(240,237,232,0.4)", lineHeight: 1.6 }}>
              This will permanently delete the event and all its photos. This cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
