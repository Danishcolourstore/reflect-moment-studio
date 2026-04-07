import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, subDays } from 'date-fns';
import { DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';
import { colors, fonts, spacing } from '@/styles/design-tokens';

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "EVENTS", path: "/dashboard/events" },
  { label: "STORYBOOK", path: "/dashboard/storybook" },
  { label: "CHEETAH", path: "/dashboard/cheetah" },
  { label: "ANALYTICS", path: "/dashboard/analytics" },
  { label: "STUDIO FEED", path: "/dashboard/website-editor" },
  { label: "MORE", path: "__drawer__" },
];

interface AnalyticRow {
  event_id: string; event_name: string; event_date: string;
  gallery_views: number; favorites_count: number; downloads_count: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

const RANGES: { key: DateRange; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const drawer = useDrawerMenu();
  const [rows, setRows] = useState<AnalyticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>('30d');
  const [navHover, setNavHover] = useState<number | null>(null);
  const [rangeHover, setRangeHover] = useState<number | null>(null);
  const [mob, setMob] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: events } = await (supabase.from('events').select('id, name, event_date') as any).eq('user_id', user.id);
      if (!events || (events as any[]).length === 0) { setRows([]); setLoading(false); return; }

      const ids = (events as any[]).map((e: any) => e.id);
      const { data: analytics } = await (supabase.from('event_analytics').select('*') as any).in('event_id', ids);
      const aMap = new Map<string, any>();
      if (analytics) for (const a of analytics as any[]) aMap.set(a.event_id, a);

      setRows((events as any[]).map((e: any) => {
        const a = aMap.get(e.id);
        return { event_id: e.id, event_name: e.name, event_date: e.event_date, gallery_views: a?.gallery_views ?? 0, favorites_count: a?.favorites_count ?? 0, downloads_count: a?.downloads_count ?? 0 };
      }).sort((a: AnalyticRow, b: AnalyticRow) => b.gallery_views - a.gallery_views));
      setLoading(false);
    };
    load();
  }, [user]);

  const getDays = (r: DateRange) => r === '7d' ? 7 : r === '30d' ? 30 : r === '90d' ? 90 : 99999;
  const cutoff = subDays(new Date(), getDays(range));
  const filtered = rows.filter(r => range === 'all' || new Date(r.event_date) >= cutoff);
  const totalViews = filtered.reduce((s, r) => s + r.gallery_views, 0);
  const totalDownloads = filtered.reduce((s, r) => s + r.downloads_count, 0);
  const totalFavs = filtered.reduce((s, r) => s + r.favorites_count, 0);
  const engagement = totalViews > 0 ? `${((totalFavs / totalViews) * 100).toFixed(1)}%` : '0%';

  const stats = [
    { label: "TOTAL VIEWS", value: totalViews.toLocaleString() },
    { label: "DOWNLOADS", value: totalDownloads.toLocaleString() },
    { label: "FAVORITES", value: totalFavs.toLocaleString() },
    { label: "ENGAGEMENT", value: engagement },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: colors.bg, overflow: "visible" }}>
      {/* NAV */}
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(10,10,11,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${colors.border}`,
          padding: mob ? "8px 16px" : "12px 20px",
          paddingTop: mob ? "calc(8px + env(safe-area-inset-top, 0px))" : "calc(12px + env(safe-area-inset-top, 0px))",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: mob ? 6 : 8 }}>
          <span
            style={{ fontFamily: fonts.display, fontSize: mob ? 18 : 24, fontWeight: 300, color: colors.gold, cursor: "pointer", letterSpacing: "0.06em" }}
            onClick={() => navigate("/home")}
          >
            MirrorAI
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: mob ? 12 : 20, overflowX: "auto", scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.label === "ANALYTICS";
            const isHov = navHover === i;
            return (
              <button
                key={item.label}
                onClick={() => item.path === "__drawer__" ? drawer.toggle() : navigate(item.path)}
                onMouseEnter={() => setNavHover(i)}
                onMouseLeave={() => setNavHover(null)}
                style={{
                  fontFamily: fonts.body,
                  fontSize: mob ? 10 : 14,
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: isActive ? colors.gold : isHov ? colors.cream : colors.textMuted,
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${colors.gold}` : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  padding: mob ? "8px 0" : "12px 0",
                  minHeight: 44,
                  transition: "color 0.3s",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: mob ? `24px ${spacing.pageMobile}` : `40px ${spacing.pageDesktop}` }}>
        <h1 style={{ fontFamily: fonts.display, fontSize: mob ? 24 : 32, fontWeight: 300, color: colors.text, letterSpacing: "0.04em" }}>
          Analytics
        </h1>
        <div style={{ width: 40, height: 2, background: colors.gold, marginTop: 8, marginBottom: 28 }} />

        {/* Date range */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {RANGES.map((r, i) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              onMouseEnter={() => setRangeHover(i)}
              onMouseLeave={() => setRangeHover(null)}
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: range === r.key ? 600 : 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: range === r.key ? colors.gold : rangeHover === i ? colors.cream : colors.textMuted,
                background: range === r.key ? colors.goldDim : "transparent",
                border: `1px solid ${range === r.key ? colors.borderActive : colors.border}`,
                padding: "8px 16px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr 1fr" : "repeat(4, 1fr)", gap: mob ? 12 : 16, marginBottom: 36 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: mob ? 16 : 24 }}>
              <div style={{ fontFamily: fonts.body, fontSize: 9, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: colors.textMuted }}>
                {s.label}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: mob ? 28 : 36, fontWeight: 300, color: colors.text, marginTop: 8 }}>
                {loading ? "—" : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["EVENT", "DATE", "VIEWS", "FAVORITES", "DOWNLOADS"].map(h => (
                  <th key={h} style={{
                    fontFamily: fonts.body, fontSize: 9, fontWeight: 500, letterSpacing: "0.15em",
                    textTransform: "uppercase", color: colors.textMuted,
                    textAlign: "left", padding: "12px 12px", borderBottom: `1px solid ${colors.border}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>No data</td></tr>
              ) : filtered.map(r => (
                <tr key={r.event_id} style={{ cursor: "pointer" }} onClick={() => navigate(`/dashboard/events/${r.event_id}`)}>
                  <td style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, padding: "14px 12px", borderBottom: `1px solid ${colors.border}` }}>{r.event_name}</td>
                  <td style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textDim, padding: "14px 12px", borderBottom: `1px solid ${colors.border}` }}>
                    {r.event_date ? format(new Date(r.event_date), "MMM d, yyyy") : "—"}
                  </td>
                  <td style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, padding: "14px 12px", borderBottom: `1px solid ${colors.border}` }}>{r.gallery_views}</td>
                  <td style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, padding: "14px 12px", borderBottom: `1px solid ${colors.border}` }}>{r.favorites_count}</td>
                  <td style={{ fontFamily: fonts.body, fontSize: 13, color: colors.text, padding: "14px 12px", borderBottom: `1px solid ${colors.border}` }}>{r.downloads_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "40px 16px", paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ fontFamily: fonts.body, fontSize: 10, color: colors.textMuted, letterSpacing: "0.1em" }}>© MIRRORAI</div>
      </footer>

      <DrawerMenu open={drawer.open} onClose={drawer.close} />
    </div>
  );
};

export default Analytics;
