import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DrawerMenu, useDrawerMenu } from "@/components/GlobalDrawerMenu";
import { Menu } from "lucide-react";
import { HERO_QUAD_MONOLITH } from "@/lib/website-demo-images";

/**
 * /home — Editorial hero landing.
 * Replaces the prior dashboard. Pure black-and-white, 4-image collage,
 * serif wordmark, masthead nav. Inspired by Shamil Shajahan reference.
 */

type NavTab = { label: string; route: string };

const NAV_PRIMARY: NavTab[] = [
  { label: "HOME",      route: "/home" },
  { label: "STORIES",   route: "/dashboard/storybook" },
  { label: "GALLERIES", route: "/dashboard/events" },
  { label: "CLIENTS",   route: "/dashboard/clients" },
];

const NAV_SECONDARY: NavTab[] = [
  { label: "ABOUT", route: "/dashboard/profile" },
];

export default function LandingGate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const drawer = useDrawerMenu();

  const [studioName, setStudioName] = useState("Mirror AI");
  const [activeTab, setActiveTab] = useState("HOME");

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id).maybeSingle();
    if (data?.studio_name) setStudioName(data.studio_name);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleNav = (tab: NavTab) => {
    setActiveTab(tab.label);
    if (tab.route !== "/home") navigate(tab.route);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#F4F1EB",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* ─── MASTHEAD ─────────────────────────────────────────── */}
      <header
        style={{
          padding: "20px 16px 8px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={drawer.toggle}
          aria-label="Menu"
          style={{
            width: 44, height: 44,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: 0, cursor: "pointer",
            marginLeft: -8,
          }}
        >
          <Menu size={22} strokeWidth={1.25} color="#1A1A1A" />
        </button>

        <h1
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(28px, 7vw, 36px)",
            letterSpacing: "0.02em",
            color: "#1A1A1A",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {studioName}
        </h1>

        <div style={{ width: 44 }} />
      </header>

      {/* ─── NAV TABS (primary row) ───────────────────────────── */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "20px 12px 8px",
          gap: 4,
        }}
      >
        {NAV_PRIMARY.map((tab) => {
          const active = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => handleNav(tab)}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                padding: "6px 4px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: active ? "#1A1A1A" : "rgba(26,26,26,0.45)",
                borderBottom: active ? "1px solid #1A1A1A" : "1px solid transparent",
                paddingBottom: 4,
                transition: "color 200ms",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ─── NAV (secondary — ABOUT centered) ─────────────────── */}
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "16px 12px 24px",
        }}
      >
        {NAV_SECONDARY.map((tab) => {
          const active = activeTab === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => handleNav(tab)}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                padding: "6px 4px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: active ? "#1A1A1A" : "rgba(26,26,26,0.45)",
                borderBottom: active ? "1px solid #1A1A1A" : "1px solid transparent",
                paddingBottom: 4,
                transition: "color 200ms",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ─── HERO COLLAGE ─────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          flex: 1,
          minHeight: "70vh",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 0,
        }}
      >
        {HERO_QUAD_MONOLITH.map((src, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#1A1A1A",
            }}
          >
            <img
              src={src}
              alt=""
              loading={i < 2 ? "eager" : "lazy"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "grayscale(100%) contrast(1.04)",
              }}
            />
          </div>
        ))}

        {/* ─── HEADLINE OVERLAY ────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            pointerEvents: "none",
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(40px, 11vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.005em",
              color: "#FFFFFF",
              textAlign: "center",
              margin: 0,
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
              maxWidth: 720,
            }}
          >
            Witness to rare moments
          </h2>
        </div>

        {/* ─── CTA PILL ────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "8%",
            display: "flex",
            justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <button
            onClick={() => navigate("/dashboard/events")}
            style={{
              background: "rgba(26,26,26,0.55)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              padding: "16px 36px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: "#FFFFFF",
              transition: "transform 200ms, background 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(26,26,26,0.75)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(26,26,26,0.55)";
            }}
          >
            VIEW THE WORK
          </button>
        </div>
      </section>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
    </div>
  );
}
