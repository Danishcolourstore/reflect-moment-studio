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
// MOCK DATA (Anonymized)
// ─────────────────────────────────────────────
const weddings = [
  {
    id: 1,
    couple: "Client A & Client B",
    lastName: "Project 01",
    date: "March 15, 2024",
    location: "Location 01",
    photos: 847,
    guests: 24,
    views: 312,
    status: "delivered",
    cover: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
  },
  {
    id: 2,
    couple: "Client C & Client D",
    lastName: "Project 02",
    date: "February 3, 2024",
    location: "Location 02",
    photos: 1203,
    guests: 38,
    views: 891,
    status: "delivered",
    cover: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  },
  {
    id: 3,
    couple: "Client E & Client F",
    lastName: "Project 03",
    date: "April 20, 2024",
    location: "Location 03",
    photos: 0,
    guests: 0,
    views: 0,
    status: "upcoming",
    cover: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
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
// GLOBAL STYLES
// ─────────────────────────────────────────────
const buildStyles = (t: typeof themes.noir) => `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: ${t.bg};
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
    overscroll-behavior: none;
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
  @keyframes grain {
    0%,100% { transform:translate(0,0) }
    20% { transform:translate(-1%,2%) }
    40% { transform:translate(2%,-1%) }
    60% { transform:translate(-2%,1%) }
    80% { transform:translate(1%,-2%) }
  }

  .grain {
    position:fixed; inset:-50%; width:200%; height:200%;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity:0.022; animation:grain 6s steps(1) infinite;
    pointer-events:none; z-index:9998;
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
  .wedding-card .card-img {
    width: 100%; aspect-ratio: 3/2;
    object-fit: cover;
    display: block;
    transition: transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.4s;
    filter: brightness(0.92) saturate(0.9);
  }
  .wedding-card:hover .card-img {
    transform: scale(1.04);
    filter: brightness(1) saturate(1.05);
  }
  .wedding-card .card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%);
    transition: opacity 0.4s;
  }
  .wedding-card .card-body {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 20px;
    transform: translateY(0);
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .wedding-card .card-action {
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 0.3s, transform 0.3s;
    margin-top: 10px;
  }
  .wedding-card:hover .card-action {
    opacity: 1;
    transform: translateY(0);
  }

  .stat-item {
    padding: 28px 24px;
    border-right: 1px solid ${t.border};
    transition: background 0.3s;
  }
  .stat-item:last-child { border-right: none; }
  .stat-item:hover { background: ${t.surface}; }

  .quick-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px;
    background: transparent;
    border: 1px solid ${t.border};
    color: ${t.text};
    font-size: 12px; font-weight: 400;
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
  .primary-btn:active { opacity: 1; transform: translateY(0); }

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
  .ghost-btn:hover, .ghost-btn:active {
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
  .menu-nav-item {
    font-size: 14px; letter-spacing: 0.16em;
    text-transform: uppercase; color: ${t.textMid};
    cursor: pointer; padding: 22px 24px;
    border-bottom: 1px solid ${t.border};
    transition: color 0.2s, padding-left 0.25s;
    font-family: 'DM Sans', sans-serif;
  }
  .menu-nav-item:hover { color: ${t.text}; padding-left: 32px; }

  .activity-dot {
    animation: pulse 2s ease-in-out infinite;
  }

  .status-pill {
    display: inline-block;
    padding: 3px 10px;
    font-size: 9px; letter-spacing: 0.14em;
    text-transform: uppercase;
    font-family: 'DM Sans', sans-serif;
  }

  @media (min-width: 768px) {
    .hamburger-wrap { display: none !important; }
    .desktop-nav    { display: flex !important; }
    .hero-wrap      { flex-direction: row !important; align-items: flex-end !important; }
    .hero-actions   { flex-direction: row !important; margin-top: 0 !important; align-items: center !important; }
    .weddings-grid  { grid-template-columns: repeat(3, 1fr) !important; }
    .stats-row      { grid-template-columns: repeat(4, 1fr) !important; }
    .bottom-grid    { grid-template-columns: 1fr 380px !important; }
    .pad            { padding-left: 56px !important; padding-right: 56px !important; }
    .header-inner   { padding: 0 56px !important; }
    .quick-grid     { grid-template-columns: repeat(4, 1fr) !important; }
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

  // inject styles
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
    <div
      style={{ minHeight: "100vh", backgroundColor: t.bg, color: t.text, transition: "background 0.5s, color 0.4s" }}
    >
      <div className="grain" />

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="menu-overlay">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              height: "56px",
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
                fontSize: "18px",
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
          {/* Atmosphere picker in menu */}
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${t.border}` }}>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: t.label,
                marginBottom: "14px",
              }}
            >
              Atmosphere
            </p>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
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
          height: "56px",
          borderBottom: `1px solid ${t.border}`,
          backgroundColor: t.overlayBg,
          backdropFilter: "blur(20px)",
          transition: "background 0.5s, border-color 0.4s",
          ...anm(0, 0.4),
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "19px",
              fontWeight: 300,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: t.text,
              transition: "color 0.4s",
            }}
          >
            Mirror
          </span>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "19px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: t.text,
              transition: "color 0.4s",
            }}
          >
            AI
          </span>
          <span
            style={{
              fontSize: "8px",
              letterSpacing: "0.3em",
              color: t.label,
              marginLeft: "7px",
              textTransform: "uppercase",
              alignSelf: "center",
              transition: "color 0.4s",
            }}
          >
            for Photographers
          </span>
        </div>

        {/* Desktop nav + atmosphere */}
        <div className="desktop-nav" style={{ display: "none", alignItems: "center", gap: "36px" }}>
          {["Projects", "Gallery", "Clients", "Deliveries"].map((item) => (
            <span key={item} className="nav-link">
              {item}
            </span>
          ))}
          {/* Atmosphere */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "8px" }}>
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

        {/* Hamburger */}
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
            gap: "5px",
            alignItems: "flex-end",
          }}
        >
          <span style={{ display: "block", width: "22px", height: "1px", backgroundColor: t.text }} />
          <span style={{ display: "block", width: "14px", height: "1px", backgroundColor: t.text }} />
          <span style={{ display: "block", width: "18px", height: "1px", backgroundColor: t.text }} />
        </button>
      </header>

      {/* ── HERO ── */}
      <section
        className="pad"
        style={{
          padding: "60px 20px 48px",
          borderBottom: `1px solid ${t.border}`,
          transition: "border-color 0.4s",
        }}
      >
        <div className="hero-wrap" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ flex: 1 }}>
            {/* Eyebrow */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", ...anm(0.1, 0.5) }}>
              <div
                style={{
                  width: "32px",
                  height: "1px",
                  backgroundColor: t.text,
                  animation: `revealX 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both`,
                  transformOrigin: "left",
                  transition: "background 0.4s",
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: t.label,
                  transition: "color 0.4s",
                }}
              >
                Studio Overview
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(48px, 11vw, 80px)",
                fontWeight: 300,
                lineHeight: 0.92,
                letterSpacing: "-0.02em",
                color: t.text,
                transition: "color 0.4s",
                ...anm(0.18, 1.0),
              }}
            >
              Your
              <br />
              <em style={{ fontStyle: "italic", color: t.textMid, transition: "color 0.4s" }}>Projects</em>
            </h1>

            <p
              style={{
                fontSize: "13px",
                fontWeight: 300,
                letterSpacing: "0.02em",
                color: t.textMid,
                lineHeight: 1.8,
                marginTop: "20px",
                maxWidth: "360px",
                transition: "color 0.4s",
                ...anm(0.32, 0.8),
              }}
            >
              Upload, manage and deliver beautiful galleries — your clients will never forget.
            </p>
          </div>

          <div
            className="hero-actions"
            style={{ display: "flex", flexDirection: "column", gap: "10px", ...anm(0.4, 0.7) }}
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
      <section
        style={{
          borderBottom: `1px solid ${t.border}`,
          transition: "border-color 0.4s",
          ...anm(0.45, 0.7),
        }}
      >
        <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)" }}>
          {stats.map((s) => (
            <div key={s.label} className="stat-item" style={{ transition: "background 0.4s, border-color 0.4s" }}>
              <p
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: t.label,
                  marginBottom: "12px",
                  transition: "color 0.4s",
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
                  transition: "color 0.4s",
                }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="pad" style={{ padding: "36px 20px 0", ...anm(0.5, 0.7) }}>
        <p
          style={{
            fontSize: "9px",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: t.label,
            marginBottom: "16px",
            transition: "color 0.4s",
          }}
        >
          Quick Actions
        </p>
        <div
          className="quick-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1px",
            backgroundColor: t.border,
            transition: "background 0.4s",
          }}
        >
          {[
            { icon: "◈", label: "New Project", sub: "Start a project" },
            { icon: "↑", label: "Upload Photos", sub: "Add to gallery" },
            { icon: "⊞", label: "Create Gallery", sub: "Deliver to client" },
            { icon: "↗", label: "Share Gallery", sub: "Send link" },
          ].map((action) => (
            <button key={action.label} className="quick-btn">
              <span style={{ fontSize: "16px", color: t.textMid, fontFamily: "monospace", transition: "color 0.4s" }}>
                {action.icon}
              </span>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "12px", color: t.text, letterSpacing: "0.02em", transition: "color 0.4s" }}>
                  {action.label}
                </p>
                <p style={{ fontSize: "10px", color: t.label, marginTop: "2px", transition: "color 0.4s" }}>
                  {action.sub}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── RECENT PROJECTS ── */}
      <section className="pad" style={{ padding: "40px 20px 0", ...anm(0.55, 0.8) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: t.label,
              transition: "color 0.4s",
            }}
          >
            Recent Projects
          </p>
          <span
            style={{
              fontSize: "10px",
              color: t.textMid,
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "color 0.4s",
            }}
          >
            View all →
          </span>
        </div>

        <div
          className="weddings-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "1px",
            backgroundColor: t.border,
            transition: "background 0.4s",
          }}
        >
          {weddings.map((w) => (
            <div
              key={w.id}
              className="wedding-card"
              onMouseEnter={() => setHoveredCard(w.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ transition: "border-color 0.4s" }}
            >
              <img src={w.cover} alt={`${w.couple} project`} className="card-img" loading="lazy" />
              <div className="card-overlay" />
              <div className="card-body">
                {/* Status */}
                <span
                  className="status-pill"
                  style={{
                    backgroundColor: w.status === "delivered" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                    color: w.status === "delivered" ? "#a8e6c0" : "#aac4ff",
                    marginBottom: "10px",
                    display: "inline-block",
                  }}
                >
                  {w.status === "delivered" ? "Delivered" : "Upcoming"}
                </span>

                {/* Couple */}
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "22px",
                    fontWeight: 300,
                    color: "#fff",
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {w.couple}
                  <span style={{ color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}> {w.lastName}</span>
                </p>

                <div style={{ display: "flex", gap: "16px", marginTop: "8px", alignItems: "center" }}>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>{w.date}</p>
                  {w.photos > 0 && (
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                      {w.photos.toLocaleString()} photos
                    </p>
                  )}
                  {w.views > 0 && (
                    <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                      {w.views} views
                    </p>
                  )}
                </div>

                {/* Hover action */}
                <div className="card-action">
                  <span
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                      borderBottom: "1px solid rgba(255,255,255,0.3)",
                      paddingBottom: "2px",
                      cursor: "pointer",
                    }}
                  >
                    {w.status === "delivered" ? "View Gallery →" : "Manage Shoot →"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVITY + GUESTS ── */}
      <section
        className="pad bottom-grid"
        style={{
          padding: "40px 20px 0",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1px",
          backgroundColor: "transparent",
          ...anm(0.65, 0.7),
        }}
      >
        {/* Activity */}
        <div
          style={{
            border: `1px solid ${t.border}`,
            backgroundColor: t.cardBg,
            padding: "28px 24px",
            transition: "background 0.4s, border-color 0.4s",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
            <p
              style={{
                fontSize: "9px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: t.label,
                transition: "color 0.4s",
              }}
            >
              Live Activity
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                className="activity-dot"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#4ecb8d",
                }}
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
                gap: "14px",
                padding: "14px 0",
                borderBottom: i < activity.length - 1 ? `1px solid ${t.border}` : "none",
                transition: "border-color 0.4s",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: item.dot ? "#4ecb8d" : t.textDim,
                  marginTop: "5px",
                  animation: item.dot ? "pulse 2s ease-in-out infinite" : "none",
                  transition: "background 0.4s",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "12px", color: t.textMid, lineHeight: 1.5, transition: "color 0.4s" }}>
                  {item.text}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: t.label,
                    marginTop: "3px",
                    letterSpacing: "0.04em",
                    transition: "color 0.4s",
                  }}
                >
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Guest summary */}
        <div
          style={{
            border: `1px solid ${t.border}`,
            borderTop: "none",
            backgroundColor: t.cardBg,
            padding: "28px 24px",
            transition: "background 0.4s, border-color 0.4s",
          }}
        >
          <p
            style={{
              fontSize: "9px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: t.label,
              marginBottom: "22px",
              transition: "color 0.4s",
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
                padding: "13px 0",
                borderBottom: i < 3 ? `1px solid ${t.border}` : "none",
                transition: "border-color 0.4s",
              }}
            >
              <p style={{ fontSize: "11px", color: t.textMid, letterSpacing: "0.04em", transition: "color 0.4s" }}>
                {g.label}
              </p>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "24px",
                  fontWeight: 300,
                  color: t.text,
                  letterSpacing: "-0.02em",
                  transition: "color 0.4s",
                }}
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
          padding: "24px 20px",
          marginTop: "48px",
          borderTop: `1px solid ${t.border}`,
          transition: "border-color 0.4s",
          ...anm(0.75, 0.5),
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "13px",
            letterSpacing: "0.1em",
            color: t.textDim,
            fontStyle: "italic",
            transition: "color 0.4s",
          }}
        >
          MirrorAI for Photographers
        </span>
        <span
          style={{
            fontSize: "9px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: t.textDim,
            transition: "color 0.4s",
          }}
        >
          © 2024
        </span>
      </footer>
    </div>
  );
};

export default Dashboard;
