import { useState, useEffect, useRef, useCallback } from "react";

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface NodeStat {
  lbl: string;
  val: string;
}
interface NodeAction {
  icon: string;
  label: string;
  sub: string;
}
interface OrbNode {
  id: string;
  label: string;
  icon: string;
  angle: number;
  dist: number;
  desc: string;
  stats: NodeStat[];
  actions: NodeAction[];
}
interface Dims {
  w: number;
  h: number;
}
type ThemeId = "black" | "white" | "colorful";
type AtmoId = "neon" | "neumorphic" | "glass" | "minimal";
interface Theme {
  bg: string;
  surface: string;
  text: string;
  sub: string;
  border: string;
  lift: string;
  gold: string;
  goldDim: string;
  green: string;
}

// ── THEME MAP ──────────────────────────────────────────────────────────────────
const T_MAP: Record<ThemeId, Theme> = {
  black: {
    bg: "#070707",
    surface: "#0d0d0d",
    text: "#e8e5e0",
    sub: "#555250",
    border: "#1e1e1e",
    lift: "#131313",
    gold: "#c8a96e",
    goldDim: "#7a6540",
    green: "#4ecb8d",
  },
  white: {
    bg: "#eeece9",
    surface: "#ffffff",
    text: "#1a1817",
    sub: "#9a9694",
    border: "#e0ddd8",
    lift: "#f5f3f0",
    gold: "#a0895c",
    goldDim: "#c0a878",
    green: "#1a9e6a",
  },
  colorful: {
    bg: "#06000f",
    surface: "#0c0019",
    text: "#f0e8ff",
    sub: "#6a5880",
    border: "#2a1040",
    lift: "#120024",
    gold: "#c084fc",
    goldDim: "#7c3aed",
    green: "#34d399",
  },
};

// ── NODES ──────────────────────────────────────────────────────────────────────
const NODES: OrbNode[] = [
  {
    id: "projects",
    label: "Projects",
    icon: "⊞",
    angle: 270,
    dist: 160,
    desc: "Manage all your shoots, events and client deliveries.",
    stats: [
      { lbl: "Active", val: "—" },
      { lbl: "Delivered", val: "—" },
    ],
    actions: [
      { icon: "+", label: "New Project", sub: "Start a new shoot" },
      { icon: "⊞", label: "All Projects", sub: "Browse your events" },
    ],
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: "⬡",
    angle: 330,
    dist: 160,
    desc: "Beautiful galleries delivered directly to your clients.",
    stats: [
      { lbl: "Galleries", val: "—" },
      { lbl: "Views", val: "—" },
    ],
    actions: [
      { icon: "↗", label: "Share Gallery", sub: "Send to client" },
      { icon: "◈", label: "Gallery Themes", sub: "Customize appearance" },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    icon: "◯",
    angle: 30,
    dist: 160,
    desc: "Client portal, proofing, favorites and selections.",
    stats: [
      { lbl: "Clients", val: "—" },
      { lbl: "Selections", val: "—" },
    ],
    actions: [
      { icon: "◯", label: "Invite Client", sub: "Send portal access" },
      { icon: "⊙", label: "View Selections", sub: "See favorites" },
    ],
  },
  {
    id: "upload",
    label: "Upload",
    icon: "↑",
    angle: 90,
    dist: 160,
    desc: "Bulk upload, ZIP import, LiveSync for live events.",
    stats: [
      { lbl: "Photos", val: "—" },
      { lbl: "Storage", val: "—" },
    ],
    actions: [
      { icon: "↑", label: "Upload Photos", sub: "Bulk or ZIP file" },
      { icon: "∿", label: "LiveSync", sub: "Real-time delivery" },
    ],
  },
  {
    id: "cheetah",
    label: "Cheetah",
    icon: "⚡",
    angle: 150,
    dist: 160,
    desc: "AI-powered photo culling and quality scoring.",
    stats: [
      { lbl: "Culled", val: "—" },
      { lbl: "Score Avg", val: "—" },
    ],
    actions: [
      { icon: "⚡", label: "Start Culling", sub: "AI selects best shots" },
      { icon: "∿", label: "Live Cull Mode", sub: "During event" },
    ],
  },
  {
    id: "brand",
    label: "Brand",
    icon: "◇",
    angle: 210,
    dist: 160,
    desc: "Your studio identity — logo, colors, watermark, website.",
    stats: [
      { lbl: "Templates", val: "—" },
      { lbl: "Published", val: "—" },
    ],
    actions: [
      { icon: "◇", label: "Edit Brand", sub: "Logo & colors" },
      { icon: "⊞", label: "Website Builder", sub: "Your portfolio" },
    ],
  },
];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "analytics", label: "Analytics", icon: "∿" },
  { id: "billing", label: "Billing", icon: "◇" },
  { id: "settings", label: "Settings", icon: "⊙" },
];

const THEMES: { id: ThemeId; label: string }[] = [
  { id: "black", label: "Black" },
  { id: "white", label: "White" },
  { id: "colorful", label: "Colour" },
];

const ATMOS: { id: AtmoId; label: string; icon: string }[] = [
  { id: "neon", label: "Neon", icon: "✦" },
  { id: "neumorphic", label: "Neuro", icon: "◉" },
  { id: "glass", label: "Crystal", icon: "◇" },
  { id: "minimal", label: "Minimal", icon: "—" },
];

// ── HELPERS ────────────────────────────────────────────────────────────────────
function nodePos(angle: number, dist: number, cx: number, cy: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * dist, y: cy + Math.sin(rad) * dist };
}

// ── COMPONENT ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [ready, setReady] = useState(false);
  const [nav, setNav] = useState("overview");
  const [active, setActive] = useState<string | null>(null);
  const [dims, setDims] = useState<Dims>({ w: 0, h: 0 });
  const [theme, setTheme] = useState<ThemeId>("black");
  const [atmo, setAtmo] = useState<AtmoId>("neon");
  const [pillOpen, setPillOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  const T = T_MAP[theme];
  const isLight = theme === "white";

  // inject CSS vars + keyframes once
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "mirror-dashboard-css";
    el.textContent = BASE_CSS;
    document.head.appendChild(el);
    setReady(true);
    return () => {
      document.head.removeChild(el);
    };
  }, []);

  // measure orbit stage
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [ready]);

  // close pill popover on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) setPillOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleNodeClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActive((prev) => (prev === id ? null : id));
  }, []);

  if (!ready) return null;

  const cx = dims.w / 2;
  const cy = (dims.h - 52 - 28) / 2;
  const activeNode = NODES.find((n) => n.id === active) ?? null;

  // ── INLINE STYLES driven by theme ──
  const s = {
    app: { background: T.bg, color: T.text } as React.CSSProperties,
    sb: { background: T.surface, borderRight: `1px solid ${T.border}` } as React.CSSProperties,
    sbLogo: { borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
    topbar: { borderBottom: `1px solid ${T.border}` } as React.CSSProperties,
    rp: { background: T.surface, borderLeft: `1px solid ${T.border}` } as React.CSSProperties,
    rpHead: { borderBottom: `.5px solid ${T.border}` } as React.CSSProperties,
    rpFoot: { borderTop: `.5px solid ${T.border}` } as React.CSSProperties,
    statusbar: { borderTop: `.5px solid ${T.border}` } as React.CSSProperties,
    divider: { height: ".5px", background: T.border, margin: "12px 0" } as React.CSSProperties,
  };

  const sbItem = (id: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 20px",
    fontSize: 12,
    fontWeight: 300,
    letterSpacing: ".04em",
    color: nav === id ? T.text : T.sub,
    cursor: "pointer",
    transition: "color .2s, background .2s",
    position: "relative",
    border: "none",
    background: nav === id ? T.lift : "transparent",
    width: "100%",
    textAlign: "left",
    fontFamily: "inherit",
    borderLeft: nav === id ? `2px solid ${T.gold}` : "2px solid transparent",
  });

  const btnG: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    background: "transparent",
    border: `.5px solid ${T.border}`,
    color: T.sub,
    fontSize: 9,
    fontWeight: 300,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "border-color .3s,color .3s",
  };
  const btnGold: React.CSSProperties = {
    ...btnG,
    border: `.5px solid ${T.gold}`,
    color: T.gold,
  };

  const nodeBodyStyle = (id: string): React.CSSProperties => ({
    width: 80,
    height: 80,
    background: active === id ? T.lift : T.surface,
    border: `1px solid ${active === id ? T.gold : T.border}`,
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    transition: "border-color .3s, background .3s, box-shadow .3s",
    boxShadow: active === id ? `0 0 24px rgba(200,169,110,.1)` : "none",
    position: "relative",
    overflow: "hidden",
  });

  const getAtmoBg = (): React.CSSProperties => {
    if (atmo === "neon") return { background: T.surface };
    if (atmo === "neumorphic")
      return {
        background: isLight ? "#eceae7" : "#0f0f0f",
        boxShadow: isLight ? "8px 8px 18px #c4c0bc,-7px -7px 16px #fff" : "8px 8px 20px #030303,-6px -6px 16px #181818",
        border: "none",
      };
    if (atmo === "glass")
      return {
        background: isLight ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        border: `1px solid ${isLight ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.09)"}`,
      };
    if (atmo === "minimal") return { background: "transparent", border: `1px solid ${T.border}` };
    return {};
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Jost:wght@200;300;400&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html,body,#root { height:100%; overflow:hidden; }
        body { background:${T.bg}; transition:background .4s; }
        ::-webkit-scrollbar { width:1px; }
        ::-webkit-scrollbar-thumb { background:${T.border}; }

        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.2} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes spinRev   { to{transform:rotate(-360deg)} }
        @keyframes nodeIn    { from{opacity:0;transform:translate(-50%,-50%) scale(.7)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes lineIn    { from{stroke-dashoffset:120} to{stroke-dashoffset:0} }
        @keyframes panelSlide{ from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ripple    { from{transform:scale(.9);opacity:.6} to{transform:scale(2.2);opacity:0} }
        @keyframes popIn     { from{opacity:0;transform:translateY(5px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes orbFloat  { 0%,100%{transform:translate(0,0)} 40%{transform:translate(26px,-16px)} 70%{transform:translate(-16px,13px)} }
        @keyframes grain     { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-1%,2%)} 60%{transform:translate(-2%,1%)} 80%{transform:translate(1%,-2%)} }

        .mirror-app {
          display:grid; grid-template-columns:200px 1fr 280px;
          height:100vh; overflow:hidden;
          font-family:'Jost',sans-serif;
          -webkit-font-smoothing:antialiased;
          animation:fadeIn .4s ease both;
          transition:background .4s, color .3s;
        }

        /* GRAIN */
        .grain {
          position:fixed; inset:-50%; width:200%; height:200%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:.016; animation:grain 8s steps(1) infinite;
          pointer-events:none; z-index:9998;
        }

        /* SIDEBAR */
        .sb { display:flex; flex-direction:column; }
        .sb-logo { padding:24px 20px 20px; flex-shrink:0; }
        .sb-nav  { flex:1; padding:14px 0; overflow-y:auto; }
        .sb-sec  { font-size:7.5px; letter-spacing:.22em; text-transform:uppercase;
                   color:${T.sub}; padding:0 20px 8px; margin-top:14px; font-weight:300;
                   opacity:.6; }
        .sb-item:hover { background:${T.lift} !important; color:${T.text} !important; }
        .sb-foot { padding:16px 20px; border-top:1px solid ${T.border}; flex-shrink:0; display:flex; align-items:center; gap:10px; }
        .sb-av   { width:28px; height:28px; border-radius:50%; border:.5px solid ${T.border};
                   background:${T.lift}; display:flex; align-items:center; justify-content:center;
                   font-size:10px; color:${T.sub}; flex-shrink:0; }
        .sb-un   { font-size:11px; font-weight:300; color:${T.text}; letter-spacing:.03em; }
        .sb-pl   { font-size:7.5px; color:${T.gold}; letter-spacing:.14em; text-transform:uppercase; margin-top:2px; }

        /* STAGE */
        .stage { display:flex; flex-direction:column; overflow:hidden; position:relative; }
        .topbar { display:flex; align-items:center; justify-content:space-between;
                  padding:0 28px; height:52px; flex-shrink:0; z-index:10; }
        .tb-title { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:300; letter-spacing:.08em; }
        .tb-right { display:flex; align-items:center; gap:8px; }
        .btn-g:hover   { border-color:${T.goldDim} !important; color:${T.text} !important; }
        .btn-gold:hover{ background:${T.gold} !important; color:${T.bg} !important; }

        /* ORBIT */
        .orbit-wrap { flex:1; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .dot-grid {
          position:absolute; inset:0;
          background-image:radial-gradient(circle, ${isLight ? "#c8c4bf" : "#252220"} 1px, transparent 1px);
          background-size:32px 32px; opacity:${isLight ? 0.4 : 0.55};
        }
        .orbit-svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }

        /* CENTER NODE */
        .center-node { position:absolute; width:100px; height:100px; left:50%; top:50%;
                       transform:translate(-50%,-50%); display:flex; align-items:center; justify-content:center; z-index:5; }
        .c-ring-outer { position:absolute; inset:-8px; border-radius:50%;
                        border:1px solid ${T.border}; animation:spin 28s linear infinite; }
        .c-ring-outer::before { content:''; position:absolute; top:-2px; left:50%; transform:translateX(-50%);
                                 width:4px; height:4px; border-radius:50%; background:${T.gold}; }
        .c-ring-inner { position:absolute; inset:-2px; border-radius:50%;
                        border:.5px dashed ${T.border}; animation:spinRev 18s linear infinite; }
        .c-ripple { position:absolute; inset:0; border-radius:50%; border:1px solid ${T.gold};
                    opacity:0; animation:ripple 3s ease-out infinite; }
        .c-ripple:nth-child(2){ animation-delay:1s; }
        .c-body { width:100px; height:100px; border-radius:50%; background:${T.surface};
                  border:1px solid ${T.border}; display:flex; flex-direction:column;
                  align-items:center; justify-content:center;
                  box-shadow:0 0 40px rgba(200,169,110,.06),inset 0 0 24px rgba(200,169,110,.03);
                  position:relative; z-index:2; }
        .c-label { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:300;
                   letter-spacing:.18em; text-transform:uppercase; color:${T.text}; }
        .c-sub   { font-size:7.5px; letter-spacing:.22em; text-transform:uppercase; color:${T.sub}; font-weight:200; margin-top:4px; }

        /* ORBIT NODES */
        .orbit-node { position:absolute; transform:translate(-50%,-50%); cursor:pointer;
                      animation:nodeIn .5s cubic-bezier(.16,1,.3,1) both; z-index:4; }
        .orbit-node:hover .o-node-body,
        .orbit-node.on    .o-node-body { border-color:${T.goldDim} !important; background:${T.lift} !important; }
        .orbit-node.on    .o-node-body { border-color:${T.gold} !important; }
        .orbit-node:hover .o-icon, .orbit-node.on .o-icon { color:${T.gold} !important; }
        .orbit-node:hover .o-lbl,  .orbit-node.on .o-lbl  { color:${T.text} !important; }

        /* STATUS BAR */
        .statusbar { height:28px; display:flex; align-items:center; padding:0 24px; gap:16px; flex-shrink:0; }
        .sbi { display:flex; align-items:center; gap:5px; font-size:7.5px; color:${T.sub};
               letter-spacing:.1em; text-transform:uppercase; opacity:.7; }
        .sbi-dot { width:4px; height:4px; border-radius:50%; background:${T.green}; }
        .sbi-ver { margin-left:auto; font-size:7.5px; color:${T.sub}; letter-spacing:.1em; text-transform:uppercase; opacity:.5; }

        /* RIGHT PANEL */
        .rp { display:flex; flex-direction:column; overflow:hidden; animation:panelSlide .5s cubic-bezier(.16,1,.3,1) both; }
        .rp-head { padding:18px 20px 14px; flex-shrink:0; }
        .rp-name { font-family:'Cormorant Garamond',serif; font-size:20px; font-weight:300; letter-spacing:.06em; }
        .rp-desc { font-size:11px; font-weight:300; color:${T.sub}; letter-spacing:.03em; margin-top:6px; line-height:1.65; }
        .rp-body { flex:1; overflow-y:auto; padding:16px 20px; }
        .rp-stat-row { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:${T.border}; margin-bottom:16px; }
        .rp-stat { background:${T.bg}; padding:14px; transition:background .2s; }
        .rp-stat:hover { background:${T.lift}; }
        .rp-stat-lbl { font-size:7.5px; letter-spacing:.18em; text-transform:uppercase; color:${T.sub}; font-weight:300; margin-bottom:8px; }
        .rp-stat-val { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:300; color:${T.text}; line-height:1; }
        .rp-action { display:flex; align-items:center; gap:10px; padding:11px 14px; cursor:pointer;
                     border:.5px solid ${T.border}; margin-bottom:8px; transition:border-color .2s,background .2s; }
        .rp-action:hover { border-color:${T.goldDim}; background:${T.bg}; }
        .rp-action-icon  { font-size:12px; color:${T.goldDim}; font-family:monospace; }
        .rp-action-label { font-size:11px; font-weight:300; color:${T.text}; letter-spacing:.04em; }
        .rp-action-sub   { font-size:9px;  color:${T.sub}; margin-top:2px; }
        .rp-foot { padding:14px 20px; flex-shrink:0; }
        .open-btn { display:flex; align-items:center; justify-content:center; padding:10px; width:100%;
                    border:.5px solid ${T.gold}; color:${T.gold}; background:transparent; cursor:pointer;
                    font-family:'Jost',sans-serif; font-size:9px; font-weight:300;
                    letter-spacing:.18em; text-transform:uppercase; transition:background .3s,color .3s; }
        .open-btn:hover { background:${T.gold}; color:${T.bg}; }

        /* DEFAULT PANEL */
        .dp-stats { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:${T.border}; margin-bottom:16px; }
        .dp-stat  { background:${T.bg}; padding:16px; }
        .dp-stat-lbl { font-size:7.5px; letter-spacing:.18em; text-transform:uppercase; color:${T.sub}; font-weight:300; margin-bottom:8px; }
        .dp-stat-val { font-family:'Cormorant Garamond',serif; font-size:30px; font-weight:300; color:${T.text}; line-height:1; }
        .dp-live { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
        .dp-live-dot { width:5px; height:5px; border-radius:50%; background:${T.green}; animation:pulse 2s ease-in-out infinite; }
        .dp-live-txt { font-size:8px; color:${T.green}; letter-spacing:.12em; text-transform:uppercase; }
        .act-item { padding:11px 0; border-bottom:.5px solid ${T.border}; }
        .act-item:last-child { border-bottom:none; }
        .act-msg  { font-size:11.5px; font-weight:300; color:${T.sub}; line-height:1.5; }
        .dp-hint  { font-size:10.5px; font-weight:300; color:${T.sub}; letter-spacing:.03em; line-height:1.7; padding:20px 0; text-align:center; }

        /* COMPACT PILL */
        .pill-wrap { position:relative; display:inline-block; }
        .ctrl-pill {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 11px 5px 9px;
          background:${isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"};
          border:1px solid ${T.border}; border-radius:100px;
          cursor:pointer; user-select:none; transition:all .2s;
          font-family:'Jost',sans-serif; font-size:9.5px; font-weight:300;
          letter-spacing:.1em; text-transform:uppercase; color:${T.sub};
        }
        .ctrl-pill:hover { color:${T.text}; border-color:${T.sub}; }
        .pill-dot { width:5px; height:5px; border-radius:50%; background:${T.gold}; flex-shrink:0; transition:background .4s; }
        .pill-arrow { font-size:7px; transition:transform .2s ease; display:inline-block; }
        .pill-arrow.up { transform:rotate(180deg); }
        .popover {
          position:absolute; top:calc(100% + 7px); right:0; z-index:500;
          background:${isLight ? "#fafafa" : "#111"};
          border:1px solid ${T.border}; border-radius:14px;
          padding:15px; min-width:220px;
          box-shadow:0 16px 40px rgba(0,0,0,${isLight ? 0.1 : 0.7});
          animation:popIn .17s ease both;
        }
        .pop-lbl { font-size:7px; letter-spacing:.24em; text-transform:uppercase; color:${T.sub}; margin-bottom:7px; font-weight:300; }
        .pop-row { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:12px; }
        .pop-row:last-child { margin-bottom:0; }
        .pop-div { height:1px; background:${T.border}; margin:10px 0; }
        .t-btn { flex:1; padding:5px 2px; border-radius:100px; border:1px solid ${T.border};
                 background:transparent; cursor:pointer; font-family:'Jost',sans-serif;
                 font-size:9.5px; font-weight:300; letter-spacing:.1em; text-transform:uppercase; color:${T.sub}; transition:all .17s; }
        .t-btn.on { background:${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.1)"}; color:${T.text}; border-color:${T.sub}; }
        .t-btn:hover:not(.on) { color:${T.text}; }
        .a-btn { display:flex; align-items:center; gap:5px; padding:5px 9px; border-radius:8px;
                 border:1px solid ${T.border}; background:transparent; cursor:pointer;
                 font-family:'Jost',sans-serif; font-size:9px; font-weight:300;
                 letter-spacing:.1em; text-transform:uppercase; color:${T.sub}; transition:all .17s; }
        .a-btn.on { border-color:${T.sub}; color:${T.text}; background:${isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)"}; }
        .a-btn:hover:not(.on) { color:${T.text}; }

        /* COLORFUL ORBS */
        .c-orb { position:absolute; border-radius:50%; filter:blur(90px); pointer-events:none; animation:orbFloat 16s ease-in-out infinite; }

        /* AI DOT */
        .ai-dot { width:5px; height:5px; border-radius:50%; background:${T.gold}; margin-left:auto; animation:pulse 2.5s ease-in-out infinite; }
      `}</style>

      <div className="mirror-app" style={s.app}>
        <div className="grain" />

        {/* ── SIDEBAR ── */}
        <aside className="sb" style={s.sb}>
          <div className="sb-logo" style={s.sbLogo}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 20,
                fontWeight: 300,
                letterSpacing: ".26em",
                textTransform: "uppercase",
                color: T.text,
              }}
            >
              Mirror<em style={{ fontStyle: "italic", color: T.gold }}>AI</em>
            </div>
            <div
              style={{
                fontSize: 7.5,
                letterSpacing: ".28em",
                textTransform: "uppercase",
                color: T.sub,
                marginTop: 5,
                fontWeight: 200,
              }}
            >
              for Photographers
            </div>
          </div>

          <nav className="sb-nav">
            <div className="sb-sec">Workspace</div>
            {NAV_ITEMS.map((n) => (
              <button key={n.id} className="sb-item" style={sbItem(n.id)} onClick={() => setNav(n.id)}>
                <span
                  style={{
                    fontSize: 12,
                    color: "inherit",
                    flexShrink: 0,
                    fontFamily: "monospace",
                    width: 14,
                    textAlign: "center",
                  }}
                >
                  {n.icon}
                </span>
                {n.label}
              </button>
            ))}
            <div className="sb-sec" style={{ marginTop: 20 }}>
              Quick
            </div>
            <button className="sb-item" style={sbItem("cheetah")} onClick={() => setActive("cheetah")}>
              <span style={{ fontSize: 12, fontFamily: "monospace", width: 14 }}>⚡</span>
              Cheetah AI
              <div className="ai-dot" />
            </button>
            <button className="sb-item" style={sbItem("upload")} onClick={() => setActive("upload")}>
              <span style={{ fontSize: 12, fontFamily: "monospace", width: 14 }}>↑</span>
              Upload
            </button>
          </nav>

          <div className="sb-foot">
            <div className="sb-av">◈</div>
            <div>
              <div className="sb-un">Your Studio</div>
              <div className="sb-pl">Pro Plan</div>
            </div>
          </div>
        </aside>

        {/* ── CENTER STAGE ── */}
        <div className="stage">
          <div className="topbar" style={s.topbar}>
            <span className="tb-title" style={{ color: T.text }}>
              Studio Overview
            </span>
            <div className="tb-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Compact theme + atmo pill */}
              <div className="pill-wrap" ref={pillRef}>
                <div className="ctrl-pill" onClick={() => setPillOpen((o) => !o)}>
                  <div className="pill-dot" />
                  <span style={{ color: T.text }}>{THEMES.find((t) => t.id === theme)?.label}</span>
                  <span style={{ color: T.sub, fontSize: 9 }}>·</span>
                  <span>
                    {ATMOS.find((a) => a.id === atmo)?.icon} {ATMOS.find((a) => a.id === atmo)?.label}
                  </span>
                  <span className={`pill-arrow ${pillOpen ? "up" : ""}`}>▾</span>
                </div>
                {pillOpen && (
                  <div className="popover">
                    <div className="pop-lbl">Theme</div>
                    <div className="pop-row">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          className={`t-btn ${theme === t.id ? "on" : ""}`}
                          onClick={() => setTheme(t.id)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="pop-div" />
                    <div className="pop-lbl">Atmosphere</div>
                    <div className="pop-row">
                      {ATMOS.map((a) => (
                        <button
                          key={a.id}
                          className={`a-btn ${atmo === a.id ? "on" : ""}`}
                          onClick={() => setAtmo(a.id)}
                        >
                          <span style={{ fontSize: 11, lineHeight: 1 }}>{a.icon}</span>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className="btn-g" style={btnG}>
                Upload
              </button>
              <button className="btn-gold" style={btnGold}>
                <span style={{ fontSize: 13, fontWeight: 200, lineHeight: 1 }}>+</span>
                New Project
              </button>
            </div>
          </div>

          {/* ORBITAL AREA */}
          <div
            className="orbit-wrap"
            ref={stageRef}
            onClick={() => setActive(null)}
            style={{
              ...getAtmoBg(),
              flex: 1,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Colorful orbs */}
            {theme === "colorful" && (
              <>
                <div
                  className="c-orb"
                  style={{ width: 360, height: 360, top: "-80px", left: "-80px", background: "#7c3aed", opacity: 0.16 }}
                />
                <div
                  className="c-orb"
                  style={{
                    width: 280,
                    height: 280,
                    bottom: "-40px",
                    right: "-40px",
                    background: "#0ea5e9",
                    opacity: 0.12,
                    animationDelay: "7s",
                  }}
                />
              </>
            )}

            <div className="dot-grid" />

            {/* SVG connector lines */}
            {dims.w > 0 && (
              <svg className="orbit-svg" viewBox={`0 0 ${dims.w} ${dims.h - 52 - 28}`} preserveAspectRatio="none">
                {NODES.map((n, i) => {
                  const pos = nodePos(n.angle, n.dist, cx, cy);
                  return (
                    <line
                      key={n.id}
                      stroke={active === n.id ? T.goldDim : T.border}
                      strokeWidth={1}
                      strokeDasharray="4 6"
                      fill="none"
                      style={{ animationDelay: `${i * 0.06}s`, animation: "lineIn .7s ease both" }}
                      x1={cx}
                      y1={cy}
                      x2={pos.x}
                      y2={pos.y}
                    />
                  );
                })}
              </svg>
            )}

            {/* CENTER NODE */}
            <div className="center-node">
              <div className="c-ring-outer" />
              <div className="c-ring-inner" />
              <div className="c-ripple" />
              <div className="c-ripple" style={{ animationDelay: "1s" }} />
              <div className="c-body">
                <span className="c-label">Studio</span>
                <span className="c-sub">Core</span>
              </div>
            </div>

            {/* ORBIT NODES */}
            {dims.w > 0 &&
              NODES.map((n, i) => {
                const pos = nodePos(n.angle, n.dist, cx, cy);
                return (
                  <div
                    key={n.id}
                    className={`orbit-node ${active === n.id ? "on" : ""}`}
                    style={{ left: pos.x, top: pos.y, animationDelay: `${i * 0.07}s` }}
                    onClick={(e) => handleNodeClick(n.id, e)}
                  >
                    <div className="o-node-body" style={nodeBodyStyle(n.id)}>
                      <span
                        className="o-icon"
                        style={{
                          fontSize: 20,
                          color: active === n.id ? T.gold : T.sub,
                          transition: "color .3s",
                          lineHeight: 1,
                          fontFamily: "monospace",
                        }}
                      >
                        {n.icon}
                      </span>
                      <span
                        className="o-lbl"
                        style={{
                          fontSize: 8,
                          letterSpacing: ".18em",
                          textTransform: "uppercase",
                          color: active === n.id ? T.text : T.sub,
                          fontWeight: 300,
                          transition: "color .3s",
                        }}
                      >
                        {n.label}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* STATUS BAR */}
          <div className="statusbar" style={s.statusbar}>
            <div className="sbi">
              <div className="sbi-dot" />
              System Online
            </div>
            <div className="sbi">Supabase Ready</div>
            <div className="sbi-ver">MirrorAI v2.0</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <aside className="rp" style={s.rp}>
          {activeNode ? (
            <>
              <div className="rp-head" style={s.rpHead}>
                <div className="rp-name" style={{ color: T.text }}>
                  {activeNode.label}
                </div>
                <div className="rp-desc">{activeNode.desc}</div>
              </div>
              <div className="rp-body">
                <div className="rp-stat-row">
                  {activeNode.stats.map((stat) => (
                    <div key={stat.lbl} className="rp-stat">
                      <div className="rp-stat-lbl">{stat.lbl}</div>
                      <div className="rp-stat-val">{stat.val}</div>
                    </div>
                  ))}
                </div>
                <div style={s.divider} />
                {activeNode.actions.map((action) => (
                  <div key={action.label} className="rp-action">
                    <span className="rp-action-icon">{action.icon}</span>
                    <div>
                      <div className="rp-action-label">{action.label}</div>
                      <div className="rp-action-sub">{action.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rp-foot" style={s.rpFoot}>
                <button className="open-btn">Open {activeNode.label} →</button>
              </div>
            </>
          ) : (
            <>
              <div className="rp-head" style={s.rpHead}>
                <div className="rp-name" style={{ color: T.text }}>
                  Studio Core
                </div>
                <div className="rp-desc">Select any node to explore. Tap to open module details.</div>
              </div>
              <div className="rp-body">
                <div className="dp-stats">
                  {[
                    { lbl: "Projects", val: "—" },
                    { lbl: "Views", val: "—" },
                    { lbl: "Clients", val: "—" },
                    { lbl: "Storage", val: "—" },
                  ].map((s) => (
                    <div key={s.lbl} className="dp-stat">
                      <div className="dp-stat-lbl">{s.lbl}</div>
                      <div className="dp-stat-val">{s.val}</div>
                    </div>
                  ))}
                </div>
                <div className="dp-live">
                  <div className="dp-live-dot" />
                  <span className="dp-live-txt">Live Activity</span>
                </div>
                {[
                  "Connect Supabase to see live activity",
                  "Create your first project to begin",
                  "Invite clients to their gallery",
                ].map((msg, i) => (
                  <div key={i} className="act-item">
                    <div className="act-msg">{msg}</div>
                  </div>
                ))}
                <div className="dp-hint">
                  Tap any node in the
                  <br />
                  orbit to get started
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}

const BASE_CSS = "";
