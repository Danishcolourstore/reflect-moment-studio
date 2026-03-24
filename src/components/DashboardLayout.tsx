import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import { LogOut, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────
   AI PIPELINE (ALIVE)
───────────────────────────────────── */
const Pipeline = () => {
  const stages = [
    { name: "Ingest", status: "done", detail: "2 complete" },
    { name: "Cull", status: "ready", detail: "Ready" },
    { name: "Retouch", status: "processing", detail: "284 / 312" },
    { name: "Story", status: "ready", detail: "1 ready" },
    { name: "Deliver", status: "idle", detail: "-" },
  ];

  return (
    <div style={{ marginBottom: 50 }}>
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "rgba(240,237,232,0.25)",
          marginBottom: 28,
        }}
      >
        AI WORKFLOW
      </p>

      <div style={{ display: "flex", alignItems: "center" }}>
        {stages.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
            {i !== stages.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 11,
                  left: "60%",
                  width: "80%",
                  height: 1,
                  background: "rgba(240,237,232,0.08)",
                }}
              />
            )}

            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                margin: "0 auto 10px",
                border: "1px solid",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                borderColor:
                  s.status === "done"
                    ? "rgba(240,237,232,0.3)"
                    : s.status === "processing"
                      ? "#E8C97A"
                      : s.status === "ready"
                        ? "rgba(240,237,232,0.5)"
                        : "rgba(240,237,232,0.08)",
                boxShadow: s.status === "processing" ? "0 0 12px rgba(232,201,122,0.15)" : "none",
              }}
            >
              {s.status === "done" && <span style={{ fontSize: 10 }}>✓</span>}

              {s.status === "processing" && (
                <div
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    border: "1px solid transparent",
                    borderTopColor: "#E8C97A",
                    animation: "spin 1.2s linear infinite",
                  }}
                />
              )}
            </div>

            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "rgba(240,237,232,0.45)",
              }}
            >
              {s.name}
            </p>

            <p
              style={{
                fontSize: 10,
                marginTop: 4,
                color: "rgba(240,237,232,0.2)",
              }}
            >
              {s.detail}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────
   AI SUGGESTIONS
───────────────────────────────────── */
const Suggestions = () => {
  const items = [
    {
      title: "Cull · Nair Wedding",
      desc: "1,203 photos waiting — auto-select best shots",
      meta: "Saves ~3 hours",
      cta: "Start →",
    },
    {
      title: "Story · Mitchell Wedding",
      desc: "Retouch is 91% done — generate highlight film",
      meta: "Ready in 2 min",
      cta: "Preview →",
    },
    {
      title: "Prepare · Rossi Wedding",
      desc: "Upcoming shoot — gallery not prepared",
      meta: "April 20 · Amalfi",
      cta: "Setup →",
    },
  ];

  return (
    <div style={{ marginBottom: 50 }}>
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "rgba(240,237,232,0.25)",
          marginBottom: 20,
        }}
      >
        MIRROR AI SUGGESTS
      </p>

      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: "18px 0",
            borderBottom: "1px solid rgba(240,237,232,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            e.currentTarget.style.paddingLeft = "10px";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.paddingLeft = "0px";
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "rgba(240,237,232,0.35)",
              }}
            >
              {item.title}
            </p>

            <p
              style={{
                fontSize: 13,
                color: "rgba(240,237,232,0.7)",
                marginTop: 4,
              }}
            >
              {item.desc}
            </p>

            <p
              style={{
                fontSize: 10,
                marginTop: 4,
                color: "rgba(240,237,232,0.25)",
              }}
            >
              {item.meta}
            </p>
          </div>

          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "rgba(240,237,232,0.4)",
            }}
          >
            {item.cta}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────
   MAIN LAYOUT
───────────────────────────────────── */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const device = useDeviceDetect();

  const [title, setTitle] = useState("Overview");

  useEffect(() => {
    if (location.pathname.includes("events")) setTitle("Events");
    else if (location.pathname.includes("upload")) setTitle("Upload");
    else setTitle("Overview");
  }, [location.pathname]);

  const showSidebar = device.isDesktop;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#eee" }}>
      {/* SIDEBAR */}
      {showSidebar && (
        <div
          style={{
            width: 200,
            position: "fixed",
            top: 0,
            bottom: 0,
            borderRight: "1px solid #111",
            padding: 20,
          }}
        >
          <h1 style={{ color: "#E8C97A" }}>MirrorAI</h1>

          <div style={{ marginTop: 30 }}>
            <div onClick={() => navigate("/dashboard")} style={{ padding: "6px 0", cursor: "pointer" }}>
              Overview
            </div>
            <div onClick={() => navigate("/dashboard/events")} style={{ padding: "6px 0", cursor: "pointer" }}>
              Events
            </div>
          </div>

          <button onClick={signOut} style={{ marginTop: 40 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}

      {/* HEADER */}
      <div
        style={{
          height: 50,
          borderBottom: "1px solid #111",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          marginLeft: showSidebar ? 200 : 0,
        }}
      >
        <ChevronRight size={16} />
        <span style={{ marginLeft: 10 }}>{title}</span>
      </div>

      {/* MAIN */}
      <div
        style={{
          padding: 20,
          marginLeft: showSidebar ? 200 : 0,
        }}
      >
        {location.pathname === "/dashboard" && (
          <>
            <Pipeline />
            <Suggestions />
          </>
        )}

        {children}
      </div>
    </div>
  );
}
