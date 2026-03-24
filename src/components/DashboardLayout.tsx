import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useDeviceDetect } from "@/hooks/use-device-detect";
import { LogOut, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────
   SIMPLE OS COMPONENTS (INLINE — NO FILES)
───────────────────────────────────────── */

const Pipeline = () => {
  const stages = [
    { name: "Ingest", status: "done" },
    { name: "Cull", status: "ready" },
    { name: "Retouch", status: "processing" },
    { name: "Story", status: "idle" },
    { name: "Deliver", status: "idle" },
  ];

  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "#666", marginBottom: 20 }}>AI WORKFLOW</p>

      <div style={{ display: "flex" }}>
        {stages.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                margin: "0 auto 8px",
                border: "1px solid",
                borderColor:
                  s.status === "done"
                    ? "#888"
                    : s.status === "processing"
                      ? "#E8C97A"
                      : s.status === "ready"
                        ? "#ccc"
                        : "#222",
              }}
            />
            <p style={{ fontSize: 10, color: "#888" }}>{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Suggestions = () => {
  const items = [
    "Cull Nair Wedding — Saves 3 hours",
    "Story Mitchell Wedding — Ready",
    "Prepare Rossi Wedding — Upcoming",
  ];

  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", color: "#666", marginBottom: 20 }}>MIRROR AI SUGGESTS</p>

      {items.map((t, i) => (
        <div
          key={i}
          style={{
            padding: "14px 0",
            borderBottom: "1px solid #111",
            fontSize: 13,
            color: "#ccc",
          }}
        >
          {t}
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN LAYOUT
───────────────────────────────────────── */

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const device = useDeviceDetect();

  const [pageTitle, setPageTitle] = useState("Dashboard");

  useEffect(() => {
    if (location.pathname.includes("events")) setPageTitle("Events");
    else if (location.pathname.includes("upload")) setPageTitle("Upload");
    else setPageTitle("Overview");
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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
          <h1 style={{ color: "#E8C97A", fontSize: 18 }}>MirrorAI</h1>

          <div style={{ marginTop: 30 }}>
            <p style={{ fontSize: 12, color: "#666" }}>Menu</p>
            <div style={{ marginTop: 10 }}>
              <div onClick={() => navigate("/dashboard")} style={{ cursor: "pointer", padding: "6px 0" }}>
                Overview
              </div>
              <div onClick={() => navigate("/dashboard/events")} style={{ cursor: "pointer", padding: "6px 0" }}>
                Events
              </div>
            </div>
          </div>

          <button onClick={handleSignOut} style={{ marginTop: 40, fontSize: 12, color: "#888" }}>
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
        <ChevronRight size={16} style={{ marginRight: 8 }} />
        <span>{pageTitle}</span>
      </div>

      {/* MAIN */}
      <div
        style={{
          padding: 20,
          marginLeft: showSidebar ? 200 : 0,
        }}
      >
        {/* OS LAYER */}
        {location.pathname === "/dashboard" && (
          <>
            <Pipeline />
            <Suggestions />
          </>
        )}

        {/* PAGE CONTENT */}
        {children}
      </div>
    </div>
  );
}
