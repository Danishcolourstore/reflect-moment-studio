import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    (
      supabase
        .from("events")
        .select("id, name, date, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any
    ).then(({ data }: any) => {
      setEvents(data || []);
    });
  }, [user]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-16">
        {/* ───────── HERO ───────── */}
        <section>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "44px",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Your Studio,
            <br />
            <span style={{ opacity: 0.5 }}>In Motion.</span>
          </h1>

          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "16px",
              lineHeight: 1.7,
            }}
          >
            MirrorAI is processing your work. Focus on what matters.
          </p>
        </section>

        {/* ───────── PIPELINE ───────── */}
        <section>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: "20px",
            }}
          >
            Workflow
          </p>

          <div className="flex justify-between">
            {["Ingest", "Cull", "Retouch", "Story", "Deliver"].map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: i === 2 ? "#fff" : "rgba(255,255,255,0.2)",
                    boxShadow: i === 2 ? "0 0 12px rgba(255,255,255,0.3)" : "none",
                  }}
                />

                <span
                  style={{
                    fontSize: "10px",
                    marginTop: "10px",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── FOCUS JOB ───────── */}
        <section>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: "16px",
            }}
          >
            Focus
          </p>

          {events[0] && (
            <div className="space-y-2">
              <h2
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "26px",
                  fontWeight: 300,
                  color: "#fff",
                }}
              >
                {events[0].name}
              </h2>

              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {events[0].status || "Processing"}
              </p>

              <button
                style={{
                  marginTop: "12px",
                  fontSize: "11px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#fff",
                  borderBottom: "1px solid rgba(255,255,255,0.3)",
                  paddingBottom: "2px",
                }}
              >
                Continue →
              </button>
            </div>
          )}
        </section>

        {/* ───────── OTHER JOBS ───────── */}
        <section>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.3)",
              marginBottom: "16px",
            }}
          >
            Other Work
          </p>

          <div className="space-y-3">
            {events.slice(1, 4).map((e) => (
              <div key={e.id} className="flex justify-between text-sm text-white/60">
                <span>{e.name}</span>
                <span className="text-white/30">{e.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── STATS ───────── */}
        <section className="grid grid-cols-2 gap-10 pt-10">
          {[
            { label: "Projects", value: events.length },
            { label: "Hours Saved", value: "140" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">{s.label}</p>
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "28px",
                  marginTop: "6px",
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
