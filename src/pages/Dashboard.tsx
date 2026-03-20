import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { HamburgerButton, DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ease = [0.16, 1, 0.3, 1];
const dm = '"DM Sans", sans-serif';
const cormorant = '"Cormorant Garamond", serif';

interface RecentEvent {
  id: string;
  name: string;
  slug: string | null;
  event_date: string | null;
  cover_url: string | null;
  photo_count: number;
}

function FilmGrain() {
  return (
    <svg className="pointer-events-none fixed inset-0 w-full h-full z-50 opacity-[0.025]">
      <filter id="dash-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#dash-grain)" />
    </svg>
  );
}

function FloatingOrb({ color, size, left, top, speed }: { color: string; size: number; left: string; top: string; speed: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        left,
        top,
      }}
      animate={{ x: [0, 15, -10, 0], y: [0, -12, 18, 0], scale: [1, 1.04, 0.97, 1] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
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
  const [hoverCS, setHoverCS] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: profile } = await (supabase.from("profiles").select("studio_name") as any)
        .eq("user_id", user.id).maybeSingle();
      if (profile?.studio_name) setStudioName(profile.studio_name);

      const { data: events } = await (supabase.from("events")
        .select("id, name, slug, event_date, cover_url, photo_count") as any)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);
      setRecentEvents(events || []);

      const { count: evtCount } = await supabase.from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalEvents(evtCount || 0);

      const photoSum = (events || []).reduce((s: number, e: any) => s + (e.photo_count || 0), 0);
      setTotalPhotos(photoSum);

      const { count: albCount } = await supabase.from("albums")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setTotalAlbums(albCount || 0);

      setLoading(false);
    };
    load();
  }, [user]);

  // Get latest 3 photos for collage
  const collagePhotos = recentEvents.filter(e => e.cover_url).slice(0, 3);

  return (
    <div className="min-h-[100dvh] relative" style={{ background: '#080808' }}>
      <FilmGrain />
      <DrawerMenu open={drawer.open} onClose={drawer.close} />

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-2" style={{ height: 48 }}>
        <HamburgerButton onClick={drawer.toggle} />
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="mr-4 rounded-full"
              style={{ width: 5, height: 5, background: '#E8C97A' }}
              animate={{
                opacity: [0.5, 1, 0.5],
                boxShadow: ['0 0 4px 1px rgba(232,201,122,0.2)', '0 0 8px 2px rgba(232,201,122,0.4)', '0 0 4px 1px rgba(232,201,122,0.2)'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </TooltipTrigger>
          <TooltipContent side="left" className="text-[10px] bg-[#111] border-[rgba(240,237,232,0.06)]">
            RI · Active
          </TooltipContent>
        </Tooltip>
      </div>

      {/* SECTION A — Reflections Hero */}
      <section className="relative overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '55vh', paddingTop: 48 }}>
        {/* Left */}
        <div className="flex-[0_0_58%] flex items-end p-8 md:p-12 relative z-10">
          <div>
            <p
              className="uppercase mb-6"
              style={{ fontFamily: dm, fontSize: 9, color: '#2A2A2A', letterSpacing: '0.4em' }}
            >
              Reflections
            </p>
            <h1
              className="text-[40px] md:text-[72px] font-light leading-[1.05]"
              style={{ fontFamily: cormorant, color: '#F0EDE8', letterSpacing: '-0.01em' }}
            >
              Your work.<br />Remembered.
            </h1>
            <div className="mt-6 mb-6" style={{ width: 48, height: 1, background: '#E8C97A' }} />
            <p style={{ fontFamily: dm, fontSize: 11, color: '#2A2A2A', letterSpacing: '0.15em' }}>
              {loading ? '...' : `${totalPhotos} moments · ${totalEvents} events · ${totalAlbums} albums`}
            </p>
          </div>
        </div>

        {/* Right — photo collage */}
        <div
          className="flex-[0_0_42%] relative overflow-hidden flex items-center justify-center"
          style={{ background: '#0A0A0A', borderLeft: '1px solid rgba(240,237,232,0.03)' }}
        >
          {collagePhotos.length > 0 ? (
            <div className="relative w-48 h-64 md:w-56 md:h-72">
              {collagePhotos.map((evt, i) => (
                <motion.img
                  key={evt.id}
                  src={evt.cover_url!}
                  alt=""
                  className="absolute w-full h-full object-cover rounded-lg"
                  style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    rotate: `${[-2, 1.5, -1][i]}deg`,
                    top: `${i * 12}px`,
                    left: `${i * 8 - 8}px`,
                    zIndex: 3 - i,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.6, ease }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center">
              <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9 mx-auto mb-3">
                <path d="M18 3L33 10.5V25.5L18 33L3 25.5V10.5L18 3Z" stroke="rgba(232,201,122,0.2)" strokeWidth="1" />
              </svg>
              <p style={{ fontFamily: dm, fontSize: 11, color: '#2A2A2A' }}>
                Your reflections will appear here
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION B — Quick Access Row */}
      <section className="px-4 md:px-12 py-8" style={{ borderTop: '1px solid rgba(240,237,232,0.04)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Events card */}
          <button
            onClick={() => navigate('/dashboard/events')}
            className="group text-left rounded-2xl p-6 md:p-7 transition-all duration-400"
            style={{ background: '#0C0C0C', border: '1px solid rgba(240,237,232,0.04)' }}
          >
            <p className="uppercase" style={{ fontFamily: dm, fontSize: 9, color: '#2A2A2A', letterSpacing: '0.35em' }}>
              Events
            </p>
            <p className="mt-3" style={{ fontFamily: cormorant, fontSize: 52, fontWeight: 300, color: '#F0EDE8', lineHeight: 1 }}>
              {loading ? '—' : totalEvents}
            </p>
            <p className="mt-3 flex items-center gap-1 transition-colors duration-300 group-hover:text-[#E8C97A]"
               style={{ fontFamily: dm, fontSize: 10, color: '#2A2A2A' }}>
              View all
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
            </p>
          </button>

          {/* Colour Store RI card */}
          <button
            onClick={() => navigate('/colour-store')}
            onMouseEnter={() => setHoverCS(true)}
            onMouseLeave={() => setHoverCS(false)}
            className="group relative text-left rounded-2xl p-6 md:p-7 overflow-hidden cursor-pointer transition-all duration-400"
            style={{
              background: 'linear-gradient(135deg, #1A1208, #0C0908)',
              border: `1px solid ${hoverCS ? 'rgba(232,201,122,0.2)' : 'rgba(232,201,122,0.1)'}`,
            }}
          >
            <FloatingOrb color="rgba(232,201,122,0.04)" size={100} left="60%" top="50%" speed={6} />
            <div className="relative z-10">
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[11px] italic"
                style={{
                  fontFamily: cormorant,
                  color: '#E8C97A',
                  background: 'rgba(232,201,122,0.08)',
                  border: '1px solid rgba(232,201,122,0.15)',
                }}
              >
                RI
              </span>
              <p className="mt-4 text-[24px] font-light leading-[1.2]" style={{ fontFamily: cormorant, color: '#F0EDE8' }}>
                Retouch with<br />Real Intelligence
              </p>
              <p className="mt-4 uppercase" style={{ fontFamily: dm, fontSize: 10, color: 'rgba(232,201,122,0.6)', letterSpacing: '0.15em' }}>
                Open Colour Store →
              </p>
            </div>
          </button>

          {/* Albums card */}
          <button
            onClick={() => navigate('/dashboard/album-designer')}
            className="group text-left rounded-2xl p-6 md:p-7 transition-all duration-400"
            style={{ background: '#0C0C0C', border: '1px solid rgba(240,237,232,0.04)' }}
          >
            <p className="uppercase" style={{ fontFamily: dm, fontSize: 9, color: '#2A2A2A', letterSpacing: '0.35em' }}>
              Albums
            </p>
            <p className="mt-3" style={{ fontFamily: cormorant, fontSize: 52, fontWeight: 300, color: '#F0EDE8', lineHeight: 1 }}>
              {loading ? '—' : totalAlbums}
            </p>
            <p className="mt-3 flex items-center gap-1 transition-colors duration-300 group-hover:text-[#E8C97A]"
               style={{ fontFamily: dm, fontSize: 10, color: '#2A2A2A' }}>
              View all
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
            </p>
          </button>

          {/* Grid Builder card */}
          <button
            onClick={() => navigate('/dashboard/storybook')}
            className="group text-left rounded-2xl p-6 md:p-7 transition-all duration-400"
            style={{ background: '#0C0C0C', border: '1px solid rgba(240,237,232,0.04)' }}
          >
            <p className="uppercase" style={{ fontFamily: dm, fontSize: 9, color: '#2A2A2A', letterSpacing: '0.35em' }}>
              Grid Builder
            </p>
            {/* Mini grid preview */}
            <div className="mt-4 grid grid-cols-3 gap-[3px] w-fit">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    width: 24,
                    height: 24,
                    background: i < 4 ? 'rgba(240,237,232,0.08)' : 'rgba(240,237,232,0.02)',
                  }}
                />
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1 transition-colors duration-300 group-hover:text-[#E8C97A]"
               style={{ fontFamily: dm, fontSize: 10, color: '#2A2A2A' }}>
              Build your grid
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
            </p>
          </button>
        </div>
      </section>

      {/* SECTION C — Recent Activity */}
      <section className="px-4 md:px-12 py-8" style={{ borderTop: '1px solid rgba(240,237,232,0.04)' }}>
        <p className="uppercase mb-4" style={{ fontFamily: dm, fontSize: 9, color: '#2A2A2A', letterSpacing: '0.35em' }}>
          Recent
        </p>
        {recentEvents.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
            {recentEvents.map((evt, i) => (
              <motion.button
                key={evt.id}
                className="flex-none rounded-xl overflow-hidden text-left"
                style={{ width: 200, height: 260, background: '#0C0C0C', scrollSnapAlign: 'start' }}
                onClick={() => navigate(`/dashboard/events/${evt.id}`)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
              >
                <div className="w-full h-[70%] bg-[#111] overflow-hidden">
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 opacity-10">
                        <rect x="2" y="2" width="20" height="20" rx="4" stroke="#F0EDE8" strokeWidth="1" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[12px] truncate" style={{ fontFamily: dm, color: '#F0EDE8' }}>
                    {evt.name}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ fontFamily: dm, color: '#2A2A2A' }}>
                    {evt.event_date ? format(new Date(evt.event_date), "MMM d, yyyy") : "No date"}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : !loading ? (
          <p style={{ fontFamily: dm, fontSize: 11, color: '#2A2A2A' }}>No events yet. Create your first event to get started.</p>
        ) : null}
      </section>

      {/* Hide scrollbar */}
      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default Dashboard;
