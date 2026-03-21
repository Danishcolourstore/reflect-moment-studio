import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, subDays } from 'date-fns';
import { DrawerMenu, useDrawerMenu } from '@/components/GlobalDrawerMenu';

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

const NAV_ITEMS = [
  { label: "HOME", path: "/home" },
  { label: "EVENTS", path: "/dashboard/events" },
  { label: "STORYBOOK", path: "/dashboard/storybook" },
  { label: "CHEETAH", path: "/dashboard/cheetah" },
  { label: "RYFINE", path: "/refyn" },
  { label: "ANALYTICS", path: "/dashboard/analytics" },
  { label: "WEBSITE", path: "/dashboard/website-editor" },
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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
    <div style={{ minHeight: "100vh", width: "100%", background: "#FFFFFF", overflow: "visible" }}>
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#FFFFFF", borderBottom: "1px solid #F2F2F2", paddingTop: "calc(12px + env(safe-area-inset-top, 0px))" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: playfair, fontSize: 24, fontWeight: 700, color: "#000000", cursor: "pointer" }} onClick={() => navigate("/home")}>MirrorAI</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 20, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = item.label === "ANALYTICS";
            const isHov = navHover === i;
            return (
              <button key={item.label} onClick={() => item.path === "__drawer__" ? drawer.toggle() : navigate(item.path)} onMouseEnter={() => setNavHover(i)} onMouseLeave={() => setNavHover(null)}
                style={{ fontFamily: mont, fontSize: 14, fontWeight: 400, textTransform: "uppercase" as const, letterSpacing: "1px", color: isActive || isHov ? "#000000" : "#666666", background: "none", border: "none", borderBottom: isActive ? "2px solid #FFCC00" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" as const, padding: "12px 0", minHeight: 44, transition: "color 0.3s", flexShrink: 0 }}>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* CONTENT */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Title */}
        <h1 style={{ fontFamily: playfair, fontSize: 36, fontWeight: 700, color: "#000000", margin: "0 0 32px", letterSpacing: "0.5px" }}>Analytics</h1>

        {/* Range filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {RANGES.map((r, i) => (
            <button key={r.key} onClick={() => setRange(r.key)} onMouseEnter={() => setRangeHover(i)} onMouseLeave={() => setRangeHover(null)}
              style={{
                fontFamily: mont, fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px",
                padding: "10px 20px", minHeight: 44, cursor: "pointer", transition: "all 0.2s",
                border: range === r.key ? "1px solid #000000" : "1px solid #F2F2F2",
                background: range === r.key ? "#000000" : rangeHover === i ? "#F2F2F2" : "#FFFFFF",
                color: range === r.key ? "#FFFFFF" : "#666666",
              }}>
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ background: "#F2F2F2", height: 100, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontFamily: playfair, fontSize: 20, color: "#000000", margin: "0 0 8px" }}>No analytics yet</p>
            <p style={{ fontFamily: mont, fontSize: 14, color: "#666666", margin: 0 }}>Publish your first event gallery to start seeing data here</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 48 }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #F2F2F2", padding: 24 }}>
                  <p style={{ fontFamily: mont, fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#666666", margin: "0 0 8px" }}>{s.label}</p>
                  <p style={{ fontFamily: playfair, fontSize: 36, fontWeight: 700, color: "#000000", margin: 0, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Top events table */}
            <h2 style={{ fontFamily: playfair, fontSize: 24, fontWeight: 700, color: "#000000", margin: "0 0 20px" }}>Top Events</h2>
            <div style={{ border: "1px solid #F2F2F2", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F2F2F2" }}>
                    <th style={{ fontFamily: mont, fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#666666", textAlign: "left", padding: "14px 16px" }}>Event</th>
                    <th style={{ fontFamily: mont, fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#666666", textAlign: "right", padding: "14px 16px" }}>Views</th>
                    <th style={{ fontFamily: mont, fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#666666", textAlign: "right", padding: "14px 16px", display: window.innerWidth < 640 ? "none" : undefined }}>Downloads</th>
                    <th style={{ fontFamily: mont, fontSize: 11, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "#666666", textAlign: "right", padding: "14px 16px", display: window.innerWidth < 640 ? "none" : undefined }}>Favorites</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.event_id} onClick={() => navigate(`/dashboard/events/${row.event_id}`)}
                      style={{ borderBottom: "1px solid #F2F2F2", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ fontFamily: mont, fontSize: 14, fontWeight: 500, color: "#000000", margin: 0 }}>{row.event_name}</p>
                        <p style={{ fontFamily: mont, fontSize: 12, color: "#666666", margin: "2px 0 0" }}>{format(new Date(row.event_date), 'MMM d, yyyy')}</p>
                      </td>
                      <td style={{ fontFamily: mont, fontSize: 14, fontWeight: 600, color: "#000000", textAlign: "right", padding: "14px 16px" }}>{row.gallery_views}</td>
                      <td style={{ fontFamily: mont, fontSize: 14, fontWeight: 600, color: "#000000", textAlign: "right", padding: "14px 16px", display: window.innerWidth < 640 ? "none" : undefined }}>{row.downloads_count}</td>
                      <td style={{ fontFamily: mont, fontSize: 14, fontWeight: 600, color: "#000000", textAlign: "right", padding: "14px 16px", display: window.innerWidth < 640 ? "none" : undefined }}>{row.favorites_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "40px 20px", borderTop: "1px solid #F2F2F2" }}>
        <p style={{ fontFamily: mont, fontSize: 12, color: "#666666", margin: 0 }}>© MIRRORAI</p>
      </div>

      <GlobalDrawerMenu open={drawer.open} onClose={drawer.close} />
    </div>
  );
};

export default Analytics;
