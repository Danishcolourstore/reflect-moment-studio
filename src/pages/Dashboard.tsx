import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { useStorageUsage, formatBytes } from "@/hooks/use-storage-usage";
import { StudioBrainCards } from "@/components/entiran/StudioBrainCards";
import { EventLifecycle } from "@/components/entiran/EventLifecycle";
import { useStudioBrain } from "@/hooks/use-studio-brain";
import ProductNav from "@/components/colour-store/ProductNav";
import IntelligenceDot from "@/components/colour-store/IntelligenceDot";
import {
  Camera, Image, Eye, HardDrive, Plus, Upload,
  BookOpen, Sparkles, Globe, BarChart2, ChevronRight,
} from "lucide-react";

interface RecentEvent {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  location: string | null;
  cover_url: string | null;
  is_published: boolean;
  photo_count: number;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { suggestions, dismissSuggestion, actOnSuggestion } = useStudioBrain();
  const { data: storageData } = useStorageUsage();

  const [loading, setLoading] = useState(true);
  const [studioName, setStudioName] = useState("Your Studio");
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      // Studio name
      const { data: profile } = await (supabase.from("profiles").select("studio_name") as any)
        .eq("user_id", user.id).maybeSingle();
      if (profile?.studio_name) setStudioName(profile.studio_name);

      // Recent events
      const { data: events } = await (supabase.from("events")
        .select("id, name, slug, event_date, location, cover_url, is_published, photo_count") as any)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentEvents(events || []);

      // Total event count
      const { count } = await supabase.from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalEvents(count || 0);

      // Total photos
      const photoSum = (events || []).reduce((s: number, e: any) => s + (e.photo_count || 0), 0);
      setTotalPhotos(photoSum);

      // Gallery views
      const eventIds = (events || []).map((e: any) => e.id);
      if (eventIds.length > 0) {
        const { data: analytics } = await (supabase.from("event_analytics")
          .select("gallery_views") as any)
          .in("event_id", eventIds);
        const views = (analytics || []).reduce((s: number, a: any) => s + (a.gallery_views || 0), 0);
        setTotalViews(views);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const stats = [
    { label: "Total Events", value: totalEvents, icon: Camera },
    { label: "Total Photos", value: totalPhotos, icon: Image },
    { label: "Gallery Views", value: totalViews, icon: Eye },
    { label: "Storage Used", value: storageData ? formatBytes(storageData.used) : "—", icon: HardDrive },
  ];

  const quickActions = [
    { name: "Storybook", desc: "Create Instagram carousels", icon: BookOpen, route: "/dashboard/storybook" },
    { name: "AI Album", desc: "Auto-generate wedding albums", icon: Sparkles, route: "/dashboard/ai-album" },
    { name: "Website", desc: "Build your portfolio site", icon: Globe, route: "/dashboard/website-editor" },
    { name: "Analytics", desc: "View gallery performance", icon: BarChart2, route: "/dashboard/analytics" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* SECTION 1 — Welcome */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl text-foreground">{getGreeting()}, {studioName}</h1>
            <p className="text-xs text-muted-foreground">Here's what's happening in your studio</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" className="min-h-[44px] gap-1.5" onClick={() => navigate("/dashboard/events?create=true")}>
              <Plus className="h-4 w-4" /> New Event
            </Button>
            <Button size="sm" variant="outline" className="min-h-[44px] gap-1.5" onClick={() => navigate("/dashboard/upload")}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </div>
        </div>

        {/* SECTION 2 — Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground/60">{s.label}</span>
                </div>
                <p className="font-serif text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 3 — Recent Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-serif font-semibold text-foreground">Recent Events</h2>
            <button onClick={() => navigate("/dashboard/events")} className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-xl">
              <Camera className="mx-auto h-10 w-10 text-muted-foreground/20" />
              <p className="mt-3 font-serif text-base text-foreground">No events yet</p>
              <Button className="mt-3" onClick={() => navigate("/dashboard/events?create=true")}>
                Create your first event
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center gap-3 border border-border/50 rounded-xl p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                >
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Camera className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{evt.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                      {evt.location ? ` · ${evt.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`h-2 w-2 rounded-full ${evt.is_published ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                    <span className="text-[11px] text-muted-foreground">{evt.photo_count} photos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4 — Quick Actions */}
        <div>
          <h2 className="text-sm font-serif font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {quickActions.map((a) => (
              <div
                key={a.name}
                className="border border-border/50 rounded-xl p-4 cursor-pointer hover:bg-secondary/30 transition-all active:scale-[0.98]"
                onClick={() => navigate(a.route)}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-medium mt-2">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5 — Studio Brain */}
        <StudioBrainCards suggestions={suggestions} onDismiss={dismissSuggestion} onAct={actOnSuggestion} />
        <EventLifecycle />
      </div>
      <IntelligenceDot />
    </DashboardLayout>
  );
};

export default Dashboard;
