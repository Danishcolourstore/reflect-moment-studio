import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Camera, Image, BookOpen, HardDrive, Activity } from 'lucide-react';

type Stats = {
  totalUsers: number;
  totalEvents: number;
  totalPhotos: number;
  totalStorybooks: number;
  totalStorage: number;
  activeUsers: number;
};

export default function SuperAdminAnalytics() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEvents: 0,
    totalPhotos: 0,
    totalStorybooks: 0,
    totalStorage: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const cards = useMemo(
    () => [
      { label: 'Total Users', value: stats.totalUsers, icon: Users, raw: false },
      { label: 'Active Users (30d)', value: stats.activeUsers, icon: Activity, raw: false },
      { label: 'Total Events', value: stats.totalEvents, icon: Camera, raw: false },
      { label: 'Total Photos', value: stats.totalPhotos, icon: Image, raw: false },
      { label: 'Storybooks', value: stats.totalStorybooks, icon: BookOpen, raw: false },
      { label: 'Storage Used', value: formatBytes(stats.totalStorage), icon: HardDrive, raw: true },
    ],
    [stats]
  );

  const load = async () => {
    setLoading(true);

    const [profiles, events, photos, storybooks, storage] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('id', { count: 'exact', head: true }),
      supabase.from('storybooks').select('id', { count: 'exact', head: true }),
      // We only need file_size, but keep it minimal for now
      supabase.from('photos').select('file_size'),
    ]);

    const totalBytes = (storage.data || []).reduce((sum: number, p: any) => sum + (p.file_size || 0), 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const active = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo);

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform-wide engagement and usage</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-foreground">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '—' : c.raw ? (c.value as string) : (c.value as number).toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            More detailed charts (views/download trends, top events, and feature adoption) can be added here next.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
