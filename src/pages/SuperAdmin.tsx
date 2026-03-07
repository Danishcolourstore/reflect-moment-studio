import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import {
  Shield, Users, Camera, HardDrive, Activity, Settings,
  LogOut, ToggleLeft, ToggleRight, RefreshCw, Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PlatformStats {
  totalUsers: number;
  totalEvents: number;
  totalPhotos: number;
  totalStorybooks: number;
}

export default function SuperAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>({ totalUsers: 0, totalEvents: 0, totalPhotos: 0, totalStorybooks: 0 });
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, eventsRes, photosRes, storybooksRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('id', { count: 'exact', head: true }),
      supabase.from('storybooks').select('id', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*'),
    ]);
    setStats({
      totalUsers: (profilesRes as any).count ?? 0,
      totalEvents: (eventsRes as any).count ?? 0,
      totalPhotos: (photosRes as any).count ?? 0,
      totalStorybooks: (storybooksRes as any).count ?? 0,
    });
    setRoles((rolesRes as any).data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('mirrorai_access_verified');
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Total Events', value: stats.totalEvents, icon: Camera, color: 'text-emerald-400' },
    { label: 'Total Photos', value: stats.totalPhotos, icon: HardDrive, color: 'text-amber-400' },
    { label: 'Storybooks', value: stats.totalStorybooks, icon: Activity, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Crown className="h-4.5 w-4.5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground font-serif">Super Admin</h1>
              <p className="text-[10px] text-muted-foreground tracking-wider uppercase">{user?.email}</p>
            </div>
            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] px-2 py-0.5 uppercase tracking-widest font-semibold">
              Super Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Admin Panel
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{loading ? '—' : s.value.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Management */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-serif">User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom roles assigned.</p>
            ) : (
              <div className="space-y-2">
                {roles.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground font-mono">{r.user_id.slice(0, 8)}…</code>
                      <Badge
                        variant="outline"
                        className={
                          r.role === 'super_admin'
                            ? 'border-amber-500/40 text-amber-500'
                            : r.role === 'admin'
                            ? 'border-blue-500/40 text-blue-500'
                            : 'border-border text-muted-foreground'
                        }
                      >
                        {r.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Platform Controls */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-serif">Platform Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Advanced platform settings and feature toggles can be managed from the{' '}
              <button onClick={() => navigate('/admin/settings')} className="underline text-primary">
                Admin Settings
              </button>{' '}
              page.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
