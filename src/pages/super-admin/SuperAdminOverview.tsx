import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Camera, Image, BookOpen, HardDrive, Activity, RefreshCw } from 'lucide-react';

const playfair = '"Playfair Display", serif';
const mont = '"Montserrat", sans-serif';

interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalPhotos: number;
  totalStorybooks: number;
  totalStorage: number;
  activeUsers: number;
}

export default function SuperAdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalEvents: 0, totalPhotos: 0,
    totalStorybooks: 0, totalStorage: 0, activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const [profiles, events, photos, storybooks, storage] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('id', { count: 'exact', head: true }),
      supabase.from('storybooks').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('file_size'),
    ]);

    const totalBytes = (storage.data || []).reduce((sum: number, p: any) => sum + (p.file_size || 0), 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const active = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo);

    setStats({
      totalUsers: (profiles as any).count ?? 0,
      totalEvents: (events as any).count ?? 0,
      totalPhotos: (photos as any).count ?? 0,
      totalStorybooks: (storybooks as any).count ?? 0,
      totalStorage: totalBytes,
      activeUsers: (active as any).count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (!document.getElementById("sa-fonts")) {
      const link = document.createElement("link");
      link.id = "sa-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const ink = '#1A1A1A';
  const gold = '#B8953F';
  const border = 'rgba(0,0,0,0.06)';

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, accent: false },
    { label: 'Active (30d)', value: stats.activeUsers, icon: Activity, accent: true },
    { label: 'Events', value: stats.totalEvents, icon: Camera, accent: false },
    { label: 'Photos', value: stats.totalPhotos, icon: Image, accent: false },
    { label: 'Storybooks', value: stats.totalStorybooks, icon: BookOpen, accent: false },
    { label: 'Storage', value: formatBytes(stats.totalStorage), icon: HardDrive, accent: false, raw: true },
  ];

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: playfair, fontSize: 28, fontWeight: 600, color: ink, margin: 0 }}>
            Platform Overview
          </h1>
          <div style={{ width: 40, height: 2, background: gold, marginTop: 8 }} />
          <p style={{ fontFamily: mont, fontSize: 12, color: 'rgba(26,26,26,0.45)', marginTop: 8 }}>
            Real-time statistics
          </p>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: mont, fontSize: 11, fontWeight: 500, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: gold, background: 'none',
            border: `1px solid ${gold}`, borderRadius: 4, padding: '8px 16px',
            cursor: 'pointer', opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              style={{
                background: c.accent ? 'rgba(200,169,126,0.06)' : '#FFFFFF',
                border: `1px solid ${c.accent ? 'rgba(200,169,126,0.15)' : border}`,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon style={{ width: 16, height: 16, color: c.accent ? gold : 'rgba(26,26,26,0.3)' }} />
                <span style={{
                  fontFamily: mont, fontSize: 9, fontWeight: 500,
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: c.accent ? gold : 'rgba(26,26,26,0.4)',
                }}>
                  {c.label}
                </span>
              </div>
              <div style={{
                fontFamily: playfair, fontSize: 32, fontWeight: 600, color: ink, lineHeight: 1,
              }}>
                {loading ? '—' : c.raw ? c.value : (c.value as number).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
