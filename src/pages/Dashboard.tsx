import React, { useEffect, useState, useRef } from "react";

// ─────────────────────────────────────────────
// ATMOSPHERE THEMES
// ─────────────────────────────────────────────
type Atmosphere = "noir" | "dusk" | "ivory";

const themes: Record<
  Atmosphere,
  {
    bg: string;
    surface: string;
    surfaceHover: string;
    border: string;
    borderHover: string;
    text: string;
    textMid: string;
    textDim: string;
    accent: string;
    label: string;
    cardBg: string;
    overlayBg: string;
  }
> = {
  noir: {
    bg: "#080808",
    surface: "#0e0e0e",
    surfaceHover: "#131313",
    border: "#161616",
    borderHover: "#2a2a2a",
    text: "#f0ede8",
    textMid: "#555",
    textDim: "#252525",
    accent: "#f0ede8",
    label: "#2e2e2e",
    cardBg: "#0b0b0b",
    overlayBg: "rgba(8,8,8,0.96)",
  },
  dusk: {
    bg: "#0d0a12",
    surface: "#130f1a",
    surfaceHover: "#1a1522",
    border: "#1e1828",
    borderHover: "#3a2f4a",
    text: "#ede8f5",
    textMid: "#6a5a80",
    textDim: "#2a2235",
    accent: "#c9aaff",
    label: "#3a2f4a",
    cardBg: "#100d16",
    overlayBg: "rgba(13,10,18,0.97)",
  },
  ivory: {
    bg: "#f7f4ef",
    surface: "#f0ece5",
    surfaceHover: "#e8e3da",
    border: "#e0d9ce",
    borderHover: "#c8bfb0",
    text: "#1a1814",
    textMid: "#8a8070",
    textDim: "#c8bfb0",
    accent: "#1a1814",
    label: "#b0a898",
    cardBg: "#f2ede6",
    overlayBg: "rgba(247,244,239,0.97)",
  },
};

// ─────────────────────────────────────────────
// MOCK DATA (Zero Stock Images)
// ─────────────────────────────────────────────
const projects = [
  {
    id: 1,
    couple: "Client A & Client B",
    lastName: "Project 01",
    date: "March 15, 2026",
    location: "Location 01",
    photos: 847,
    guests: 24,
    views: 312,
    status: "delivered",
  },
  {
    id: 2,
    couple: "Client C & Client D",
    lastName: "Project 02",
    date: "February 3, 2026",
    location: "Location 02",
    photos: 1203,
    guests: 38,
    views: 891,
    status: "delivered",
  },
  {
    id: 3,
    couple: "Client E & Client F",
    lastName: "Project 03",
    date: "April 20, 2026",
    location: "Location 03",
    photos: 0,
    guests: 0,
    views: 0,
    status: "upcoming",
  },
];

const stats = [
  { label: "Weddings", value: "18" },
  { label: "Photos Delivered", value: "24k" },
  { label: "Guest Views", value: "9.2k" },
  { label: "Galleries Sent", value: "18" },
];

const activity = [
  { text: "Client viewed their gallery", time: "2 min ago", dot: true },
  { text: "12 guests downloaded — Project 02", time: "1h ago", dot: false },
  { text: "New booking confirmed — Project 03", time: "Yesterday", dot: false },
  { text: "891 views — Project 02 this week", time: "2 days ago", dot: false },
];

// ─────────────────────────────────────────────
// GLOBAL STYLES (No Scroll Locks)
// ─────────────────────────────────────────────
const buildStyles = (t: typeof themes.noir) => `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  .dashboard-wrapper {
    background: ${t.bg};
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    color: ${t.text};
    min-height: 100vh;
    transition: background 0.5s, color 0.4s;
    position: relative;
    z-index: 1;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes revealX {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .atm-btn {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid ${t.border};
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;
    flex-shrink: 0;
  }
  .atm-btn:hover { transform: scale(1.15); border-color: ${t.borderHover}; }
  .atm-btn.active { border-color: ${t.text} !important; transform: scale(1.1); }

  .wedding-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: ${t.cardBg};
    border: 1px solid ${t.border};
    transition: border-color 0.4s;
  }
  .wedding-card:hover { border-color: ${t.borderHover}; }
  
  /* Premium Shimmer Placeholder */
  .card-placeholder {
    width: 100%; 
    aspect-ratio: 16/9;
    background: linear-gradient(90deg, ${t.surface} 25%, ${t.surfaceHover} 50%, ${t.surface} 75%);
    background-size: 200% 100%;
    animation: shimmer 4s infinite linear;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .wedding-card:hover .card-placeholder {
    transform: scale(1.04);
  }
  
  /* Placeholder Monogram/Icon */
  .card-placeholder::after {
    content: '◈';
    font-size: 24px;
    color: ${t.borderHover};
    opacity: 0.5;
  }

  .card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, ${t.bg} 0%, transparent 80%);
    opacity: 0.9;
    transition: opacity 0.4s;
  }
  
  .wedding-card .card-body {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 24px;
    transform: translateY(0);
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .wedding-card .card-action {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.3s, transform 0.3s;
    margin-top: 12px;
  }
  .wedding-card:hover .card-action {
    opacity: 1;
    transform: translateY(0);
  }

  .stat-item {
    padding: 32px 24px;
    border-right: 1px solid ${t.border};
    border-bottom: 1px solid ${t.border};
    transition: background 0.3s;
  }
  .stat-item:hover { background: ${t.surface}; }

  .quick-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 24px;
    background: transparent;
    border: 1px solid ${t.border};
    color: ${t.text};
    font-size: 13px; font-weight: 400;
    letter-spacing: 0.08em;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.25s, border-color 0.25s;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
  }
  .quick-btn:hover, .quick-btn:active {
    background: ${t.surface};
    border-color: ${t.borderHover};
  }

  .primary-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px;
    background: ${t.accent}; color: ${t.bg};
    border: none;
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.14em; text-transform: uppercase;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.2s, transform 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .primary-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  .ghost-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px;
    background: transparent; color: ${t.text};
    border: 1px solid ${t.border};
    font-size: 11px; font-weight: 400;
    letter-spacing: 0.14em; text-transform: uppercase;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.25s, border-color 0.25s, color 0.25s;
    -webkit-tap-highlight-color: transparent;
  }
  .ghost-btn:hover {
    background: ${t.surface};
    border-color: ${t.borderHover};
  }

  .nav-link {
    font-size: 10px; letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${t.textMid}; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.2s; padding-bottom: 2px;
    position: relative;
  }
  .nav-link::after {
    content: ''; position: absolute;
    bottom: 0; left: 0; width: 100%; height: 1px;
    background: ${t.text};
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  .nav-link:hover { color: ${t.text}; }
  .nav-link:hover::after { transform: scaleX(1); }

  .menu-overlay {
    position: fixed; inset: 0; z-index: 500;
    background: ${t.overlayBg};
    display: flex; flex-direction: column;
    animation: fadeIn 0.2s ease forwards;
    backdrop-filter: blur(20px);
  }

  .activity-dot {
    animation: pulse 2s ease-in-out infinite;
  }

  .status-pill {
    display: inline-block;
    padding: 4px 12px;
    font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Responsive Grids ── */
  .stats-row { display: grid; grid-template-columns: repeat(2, 1fr); border-top: 1px solid ${t.border}; border-left: 1px solid ${t.border}; }
  .quick-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background-color: ${t.border}; }
  .weddings-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background-color: ${t.border}; }
  .bottom-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background-color: transparent; }

  @media (min-width: 768px) {
    .hamburger-wrap { display: none !important; }
    .desktop-nav    { display: flex !important; }
    .hero-wrap      { flex-direction: row !important; align-items: flex-end !important; }
    .hero-actions   { flex-direction: row !important; margin-top: 0 !important; align-items: center !important; }
    .stats-row      { grid-template-columns: repeat(4, 1fr); border-right: 1px solid ${t.border}; }
    .stat-item      { border-bottom: none; }
    .quick-grid     { grid-template-columns: repeat(4, 1fr); }
    .weddings-grid  { grid-template-columns: repeat(3, 1fr); }
    .bottom-grid    { grid-template-columns: 1fr 400px; }
    .pad            { padding-left: 56px !important; padding-right: 56px !important; }
    .header-inner   { padding: 0 56px !important; }
  }
`;

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [atm, setAtm] = useState<Atmosphere>("noir");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const t = themes[atm];

  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement("style");
      document.head.appendChild(el);
      styleRef.current = el;
    }
    styleRef.current.textContent = buildStyles(t);
  }, [atm, t]);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const anm = (delay: number, dur = 0.75): React.CSSProperties => ({
    opacity: 0,
    animation: `fadeUp ${dur}s cubic-bezier(0.16,1,0.3,1) ${delay}s forwards`,
  });

  const atmColors: Record<Atmosphere, string> = {
    noir: "#1a1a1a",
    dusk: "#2d1f4a",
    ivory: "#e8dfd0",
  };

  return (
    <div className="dashboard-wrapper">
      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="menu-overlay">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              height: "64px",
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "17px",
                fontWeight: 300,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: t.text,
              }}
            >
              Menu
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: t.textMid,
                fontSize: "20px",
                cursor: "pointer",
                padding: "8px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {["Projects", "Gallery", "Clients", "Deliveries", "Settings"].map((item) => (
              <div key={item} className="menu-nav-item" onClick={() => setMenuOpen(false)}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ padding: "24px", borderTop: `1px solid ${t.border}` }}>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: t.label,
                marginBottom: "16px",
              }}
            >
              Atmosphere
            </p>
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
              {(Object.keys(atmColors) as Atmosphere[]).map((a) => (
                <button
                  key={a}
                  className={`atm-btn ${atm === a ? "active" : ""}`}
                  style={{ backgroundColor: atmColors[a] }}
                  onClick={() => setAtm(a)}
                  title={a}
                />
              ))}
            </div>
            <button
              className="primary-btn"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setMenuOpen(false)}
            >
              <span style={{ fontSize: "16px", fontWeight: 200 }}>+</span>
              New Project
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header
        className="header-inner"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: "64px",
          borderBottom: `1px solid ${t.border}`,
          backgroundColor: t.overlayBg,
          backdropFilter: "blur(20px)",
          transition: "background 0.5s, border-color 0.4s",
          ...anm(0, 0.4),
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px",
              fontWeight: 300,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: t.text,
            }}
          >
            Mirror
          </span>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: t.text,
            }}
          >
            AI
          </span>
          <span
            style={{
              fontSize: "8px",
              letterSpacing: "0.3em",
              color: t.label,
              marginLeft: "8px",
              textTransform: "uppercase",
              alignSelf: "center",
            }}
          >
            for Photographers
          </span>
        </div>

        <div className="desktop-nav" style={{ display: "none", alignItems: "center", gap: "40px" }}>
          {["Projects", "Gallery", "Clients", "Deliveries"].map((item) => (
            <span key={item} className="nav-link">
              {item}
            </span>
          ))}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "12px" }}>
            {(Object.keys(atmColors) as Atmosphere[]).map((a) => (
              <button
                key={a}
                className={`atm-btn ${atm === a ? "active" : ""}`}
                style={{ backgroundColor: atmColors[a] }}
                onClick={() => setAtm(a)}
                title={a}
              />
            ))}
          </div>
        </div>

        <button
          className="hamburger-wrap"
          onClick={() => setMenuOpen(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignItems: "flex-end",
          }}
        >
          <span style={{ display: "block", width: "24px", height: "1px", backgroundColor: t.text }} />
          <span style={{ display: "block", width: "16px", height: "1px", backgroundColor: t.text }} />
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="pad" style={{ padding: "64px 20px 48px", transition: "border-color 0.4s" }}>
        <div className="hero-wrap" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", ...anm(0.1, 0.5) }}>
              <div
                style={{
                  width: "32px",
                  height: "1px",
                  backgroundColor: t.text,
                  animation: `revealX 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both`,
                  transformOrigin: "left",
                }}
              />
              <span style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: t.label }}>
                Studio Overview
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(52px, 12vw, 88px)",
                fontWeight: 300,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                color: t.text,
                ...anm(0.18, 1.0),
              }}
            >
              Your
              <br />
              <em style={{ fontStyle: "italic", color: t.textMid }}>Projects</em>
            </h1>

            <p
              style={{
                fontSize: "14px",
                fontWeight: 300,
                letterSpacing: "0.02em",
                color: t.textMid,
                lineHeight: 1.8,
                marginTop: "24px",
                maxWidth: "400px",
                ...anm(0.32, 0.8),
              }}
            >
              Upload, manage and deliver beautiful galleries — your clients will never forget.
            </p>
          </div>

          <div
            className="hero-actions"
            style={{ display: "flex", flexDirection: "column", gap: "12px", ...anm(0.4, 0.7) }}
          >
            <button className="primary-btn" style={{ justifyContent: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 200, lineHeight: 1 }}>+</span>
              New Project
            </button>
            <button className="ghost-btn" style={{ justifyContent: "center" }}>
              Upload Photos
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ ...anm(0.45, 0.7) }}>
        <div className="stats-row">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: t.label,
                  marginBottom: "14px",
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "48px",
                  fontWeight: 300,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: t.text,
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="pad" style={{ padding: "48px 20px 0", ...anm(0.5, 0.7) }}>
        <p
          style={{
            fontSize: "9px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: t.label,
            marginBottom: "20px",
          }}
        >
          Quick Actions
        </p>
        <div className="quick-grid">
          {[
            { icon: "◈", label: "New Project", sub: "Start a project" },
            { icon: "↑", label: "Upload Photos", sub: "Add to gallery" },
            { icon: "⊞", label: "Create Gallery", sub: "Deliver to client" },
            { icon: "↗", label: "Share Gallery", sub: "Send link" },
          ].map((action) => (
            <button key={action.label} className="quick-btn">
              <span style={{ fontSize: "16px", color: t.textMid, fontFamily: "monospace" }}>{action.icon}</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "13px", color: t.text, letterSpacing: "0.02em" }}>{action.label}</p>
                <p style={{ fontSize: "11px", color: t.label, marginTop: "4px" }}>{action.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── RECENT PROJECTS (NO IMAGES) ── */}
      <section className="pad" style={{ padding: "56px 20px 0", ...anm(0.55, 0.8) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: t.label }}>
            Recent Projects
          </p>
          <span
            style={{
              fontSize: "10px",
              color: t.textMid,
              cursor: "pointer",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            View all →
          </span>
        </div>

        <div className="weddings-grid">
          {projects.map((p) => (
            <div
              key={p.id}
              className="wedding-card"
              onMouseEnter={() => setHoveredCard(p.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Premium Shimmer Box */}
              <div className="card-placeholder" />
              <div className="card-overlay" />

              <div className="card-body">
                <span
                  className="status-pill"
                  style={{
                    backgroundColor: p.status === "delivered" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                    color: p.status === "delivered" ? "#8EE8B6" : "#A6C2FF",
                    marginBottom: "12px",
                    border: `1px solid rgba(255,255,255,0.1)`,
                  }}
                >
                  {p.status === "delivered" ? "Delivered" : "Upcoming"}
                </span>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "24px",
                    fontWeight: 300,
                    color: t.text,
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.couple}
                  <span style={{ color: t.textMid, fontStyle: "italic" }}> {p.lastName}</span>
                </p>

                <div style={{ display: "flex", gap: "16px", marginTop: "12px", alignItems: "center" }}>
                  <p style={{ fontSize: "11px", color: t.textMid, letterSpacing: "0.04em" }}>{p.date}</p>
                  {p.photos > 0 && (
                    <p style={{ fontSize: "11px", color: t.textDim, letterSpacing: "0.04em" }}>
                      {p.photos.toLocaleString()} photos
                    </p>
                  )}
                </div>

                <div className="card-action">
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: t.text,
                      borderBottom: `1px solid ${t.textDim}`,
                      paddingBottom: "2px",
                    }}
                  >
                    {p.status === "delivered" ? "View Gallery →" : "Manage Shoot →"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVITY + GUESTS ── */}
      <section className="pad bottom-grid" style={{ padding: "56px 20px 0", ...anm(0.65, 0.7) }}>
        {/* Activity */}
        <div style={{ border: `1px solid ${t.border}`, backgroundColor: t.cardBg, padding: "32px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: t.label }}>
              Live Activity
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className="activity-dot"
                style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ecb8d" }}
              />
              <span style={{ fontSize: "9px", color: "#4ecb8d", letterSpacing: "0.1em" }}>Live</span>
            </div>
          </div>

          {activity.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                padding: "16px 0",
                borderBottom: i < activity.length - 1 ? `1px solid ${t.border}` : "none",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: item.dot ? "#4ecb8d" : t.textDim,
                  marginTop: "6px",
                  animation: item.dot ? "pulse 2s ease-in-out infinite" : "none",
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", color: t.textMid, lineHeight: 1.5 }}>{item.text}</p>
                <p style={{ fontSize: "11px", color: t.label, marginTop: "4px", letterSpacing: "0.04em" }}>
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Engagement */}
        <div
          style={{
            border: `1px solid ${t.border}`,
            borderTop: "none",
            backgroundColor: t.cardBg,
            padding: "32px 28px",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: t.label,
              marginBottom: "28px",
            }}
          >
            Guest Engagement
          </p>
          {[
            { label: "Total Guest Views", value: "9.2k" },
            { label: "Photos Downloaded", value: "1.4k" },
            { label: "Galleries Shared", value: "38" },
            { label: "Avg. Time in Gallery", value: "4m 12s" },
          ].map((g, i) => (
            <div
              key={g.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "16px 0",
                borderBottom: i < 3 ? `1px solid ${t.border}` : "none",
              }}
            >
              <p style={{ fontSize: "12px", color: t.textMid, letterSpacing: "0.04em" }}>{g.label}</p>
              <p
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, color: t.text }}
              >
                {g.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="pad"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "32px 20px",
          marginTop: "64px",
          borderTop: `1px solid ${t.border}`,
          ...anm(0.75, 0.5),
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "14px",
            letterSpacing: "0.1em",
            color: t.textDim,
            fontStyle: "italic",
          }}
        >
          MirrorAI for Photographers
        </span>
        <span style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: t.textDim }}>
          © 2026
        </span>
      </footer>
    </div>
  );
};

export default Dashboard;
