import { useEffect, useState } from "react";
import { PageError } from "@/components/PageStates";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { CreateEventModal } from "@/components/CreateEventModal";
import {
  Camera, FolderOpen, Layers, Grid3X3, Image, Users, BarChart2,
  Globe, Palette, Plus, ArrowRight, Sparkles
} from "lucide-react";

interface RecentEvent {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  cover_url: string | null;
  photo_count: number;
  location: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const drawer = useDrawerMenu();

  const [studioName, setStudioName] = useState("Studio");
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data: profile } = await (supabase.from("profiles").select("studio_name") as any)
          .eq("user_id", user.id).maybeSingle();
        if (profile?.studio_name) setStudioName(profile.studio_name);

        const { data: events } = await (
          supabase.from("events").select("id, name, slug, event_date, cover_url, photo_count, location") as any
        ).eq("user_id", user.id).order("created_at", { ascending: false }).limit(12);
        setRecentEvents(events || []);

        const { count: evtCount } = await supabase.from("events")
          .select("*", { count: "exact", head: true }).eq("user_id", user.id);
        setTotalEvents(evtCount || 0);

        const photoSum = (events || []).reduce((s: number, e: any) => s + (e.photo_count || 0), 0);
        setTotalPhotos(photoSum);

        const { count: albCount } = await supabase.from("albums")
          .select("*", { count: "exact", head: true }).eq("user_id", user.id);
        setTotalAlbums(albCount || 0);
      } catch {
        setError(true);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (error) return <PageError message="Failed to load" onRetry={() => window.location.reload()} />;

  const FEATURES = [
    { icon: Camera, label: "Events", sub: `${totalEvents} galleries`, path: "/dashboard/events" },
    { icon: Palette, label: "MirrorAI\nRetouch", sub: "RI Retouching", path: "/colour-store" },
    { icon: Layers, label: "Albums", sub: `${totalAlbums} designed`, path: "/dashboard/album-designer" },
    { icon: Grid3X3, label: "Grid\nBuilder", sub: "Social media", path: "/dashboard/storybook" },
    { icon: Users, label: "Clients", sub: "CRM", path: "/dashboard/clients" },
    { icon: BarChart2, label: "Analytics", sub: "Insights", path: "/dashboard/analytics" },
  ];

  const STATS = [
    { value: loading ? "—" : totalEvents, label: "Events" },
    { value: loading ? "—" : totalPhotos, label: "Photos" },
    { value: loading ? "—" : totalAlbums, label: "Albums" },
  ];

  return (
    <div className="w-full min-h-screen overflow-y-auto overflow-x-hidden" style={{ background: "#0D0D0D" }}>

      {/* ── Stats Row ── */}
      <section className="px-5 sm:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
          <h2
            className="text-lg font-light tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.85)" }}
          >
            Welcome back
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="neu-card-sm p-4 text-center">
              <div
                className="text-2xl sm:text-3xl font-light"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.9)" }}
              >
                {s.value}
              </div>
              <div
                className="text-[9px] font-medium mt-1 uppercase tracking-[0.2em]"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--primary))" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid (Neumorphic) ── */}
      <section className="px-5 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl sm:text-2xl font-light italic"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.85)" }}
          >
            Features
          </h2>
          <button
            onClick={() => setCreateOpen(true)}
            className="neu-btn flex items-center gap-2 px-4 py-2.5"
            style={{ color: "hsl(var(--primary))" }}
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              New Event
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="neu-card p-5 sm:p-6 text-left flex flex-col gap-4 group"
            >
              <div className="neu-icon-circle">
                <item.icon
                  className="h-5 w-5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <div
                  className="text-[13px] sm:text-sm font-medium leading-tight whitespace-pre-line"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.75)" }}
                >
                  {item.label}
                </div>
                <div
                  className="text-[10px] mt-1 font-normal"
                  style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.25)" }}
                >
                  {item.sub}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent Work ── */}
      {recentEvents.length > 0 && (
        <section className="px-5 sm:px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-xl sm:text-2xl font-light"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.85)" }}
              >
                Recent Work
              </h2>
              <div className="w-8 h-[2px] mt-2" style={{ background: "hsl(var(--primary))" }} />
            </div>
            <button
              onClick={() => navigate("/dashboard/events")}
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--primary))", background: "none", border: "none" }}
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {recentEvents.slice(0, 6).map((evt) => (
              <button
                key={evt.id}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                className="neu-card overflow-hidden text-left group"
                style={{ padding: 0 }}
              >
                <div className="aspect-[4/5] overflow-hidden" style={{ borderRadius: "20px 20px 0 0" }}>
                  {evt.cover_url ? (
                    <img
                      src={evt.cover_url}
                      alt={evt.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "hsl(0 0% 8%)" }}
                    >
                      <Image className="h-8 w-8" style={{ color: "rgba(255,255,255,0.1)" }} />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <h3
                    className="text-sm font-normal truncate"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.8)" }}
                  >
                    {evt.name}
                  </h3>
                  <p
                    className="text-[10px] mt-0.5 truncate"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.25)" }}
                  >
                    {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : ""}
                    {evt.photo_count > 0 ? ` · ${evt.photo_count} photos` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty State ── */}
      {!loading && recentEvents.length === 0 && (
        <section className="px-5 sm:px-8 py-16 text-center">
          <div className="neu-card max-w-md mx-auto p-10">
            <div className="neu-icon-circle mx-auto mb-5">
              <Camera className="h-5 w-5" style={{ color: "rgba(255,255,255,0.4)" }} strokeWidth={1.5} />
            </div>
            <h2
              className="text-2xl font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.85)" }}
            >
              Your Story Begins Here
            </h2>
            <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
              Create your first event to start building your portfolio
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="neu-btn mt-6 px-8 py-3 text-xs font-medium uppercase tracking-wider"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--primary))" }}
            >
              + Create Event
            </button>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="py-10 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div
          className="text-sm italic"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.2)" }}
        >
          {studioName}
        </div>
        <div
          className="text-[9px] mt-2 uppercase tracking-[0.15em]"
          style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.12)" }}
        >
          Powered by MirrorAI
        </div>
      </footer>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(eventId) => navigate(`/dashboard/events/${eventId}`)}
      />
    </div>
  );
};

export default Dashboard;
