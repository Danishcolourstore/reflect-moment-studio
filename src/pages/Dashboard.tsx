import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface Event {
  id: string;
  name: string;
  date: string;
  status: string;
  photo_count?: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    (
      supabase
        .from("events")
        .select("id, name, date, status")
        .eq("user_id", user.id)
        .order("date", { ascending: false }) as any
    ).then(({ data }: any) => {
      setEvents(data || []);
      setLoading(false);
    });
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* ───────── HERO / STATE ───────── */}
        <section className="space-y-3">
          <h1 className="text-3xl font-serif text-white tracking-tight">Your studio is active</h1>
          <p className="text-sm text-white/40">Work is progressing. Here’s what needs your attention.</p>
        </section>

        {/* ───────── PIPELINE ───────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Workflow</p>
            <span className="text-[10px] text-green-400 tracking-wide">● Live</span>
          </div>

          <div className="flex items-center justify-between">
            {["Ingest", "Cull", "Retouch", "Story", "Deliver"].map((stage, i) => (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div
                  className={`w-5 h-5 rounded-full border ${
                    i === 2 ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "border-white/20"
                  }`}
                />
                <span className="text-[10px] mt-2 text-white/40">{stage}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── ACTIVE JOBS ───────── */}
        <section className="space-y-4">
          <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">Active Work</p>

          <div className="space-y-2">
            {loading && (
              <div className="flex items-center gap-2 text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}

            {!loading &&
              events.slice(0, 3).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-4 py-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-white/30" />
                    <div>
                      <p className="text-white text-sm">{e.name}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wide">{e.status || "processing"}</p>
                    </div>
                  </div>

                  <span className="text-xs text-white/30">{e.date}</span>
                </div>
              ))}
          </div>
        </section>

        {/* ───────── AI SUGGESTIONS ───────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase">MirrorAI Suggests</p>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-4 border-l border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition">
              <div>
                <p className="text-sm text-white">Run culling on pending photos</p>
                <p className="text-[10px] text-white/40">Saves ~3 hours</p>
              </div>
              <button className="text-xs text-white/40 hover:text-white">Start →</button>
            </div>

            <div className="flex items-center justify-between px-4 py-4 border-l border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition">
              <div>
                <p className="text-sm text-white">Generate story preview</p>
                <p className="text-[10px] text-white/40">Ready in ~2 min</p>
              </div>
              <button className="text-xs text-white/40 hover:text-white">Preview →</button>
            </div>

            <div className="flex items-center justify-between px-4 py-4 border-l border-white/20 bg-white/[0.02] hover:bg-white/[0.04] transition">
              <div>
                <p className="text-sm text-white">Prepare upcoming shoot</p>
                <p className="text-[10px] text-white/40">Setup gallery structure</p>
              </div>
              <button className="text-xs text-white/40 hover:text-white">Setup →</button>
            </div>
          </div>
        </section>

        {/* ───────── STATS ───────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 border border-white/5 divide-x divide-white/5">
          {[
            { label: "Events", value: events.length },
            { label: "Photos", value: "24k" },
            { label: "Views", value: "9.2k" },
            { label: "Hours Saved", value: "140" },
          ].map((s) => (
            <div key={s.label} className="p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{s.label}</p>
              <p className="text-2xl font-serif text-white mt-2">{s.value}</p>
            </div>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
