import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { RefreshCw, Trash2, Camera, Image, HardDrive } from 'lucide-react';

interface EventRow {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  photo_count: number;
  is_published: boolean;
  created_at: string;
  ownerEmail?: string;
}

export default function SuperAdminMirrorAI() {
  const { user: me } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [stats, setStats] = useState({ galleries: 0, photos: 0, storage: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [eventsRes, photosRes, storageRes, profilesRes] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('photos').select('id', { count: 'exact', head: true }),
      supabase.from('photos').select('file_size'),
      supabase.from('profiles').select('user_id, email'),
    ]);

    const emailMap: Record<string, string> = {};
    (profilesRes.data || []).forEach((p: any) => { emailMap[p.user_id] = p.email; });

    const totalBytes = (storageRes.data || []).reduce((s: number, p: any) => s + (p.file_size || 0), 0);

    setStats({
      galleries: (eventsRes.data || []).filter((e: any) => e.is_published).length,
      photos: (photosRes as any).count ?? 0,
      storage: totalBytes,
    });

    setEvents((eventsRes.data || []).map((e: any) => ({
      ...e,
      ownerEmail: emailMap[e.user_id] || 'Unknown',
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteEvent = async (e: EventRow) => {
    await supabase.from('photos').delete().eq('event_id', e.id);
    await supabase.from('events').delete().eq('id', e.id);
    await supabase.from('admin_activity_log').insert({
      action: 'delete_event', target: `${e.name} (${e.slug})`,
      performed_by: me?.email || 'super_admin',
    });
    toast.success('Event and photos deleted');
    setDeleteTarget(null);
    load();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">MirrorAI Gallery Control</h1>
          <p className="text-sm text-muted-foreground">Manage all galleries and events</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Camera className="h-5 w-5 text-emerald-400" />
            <div><p className="text-xl font-bold">{stats.galleries}</p><p className="text-[11px] text-muted-foreground">Published Galleries</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Image className="h-5 w-5 text-amber-400" />
            <div><p className="text-xl font-bold">{stats.photos.toLocaleString()}</p><p className="text-[11px] text-muted-foreground">Total Photos</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-rose-400" />
            <div><p className="text-xl font-bold">{formatBytes(stats.storage)}</p><p className="text-[11px] text-muted-foreground">Storage Used</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base font-serif">All Events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Event</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Photos</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : events.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-3">
                      <div><p className="font-medium">{e.name}</p><p className="text-xs text-muted-foreground">/{e.slug}</p></div>
                    </td>
                    <td className="p-3 text-xs font-mono">{e.ownerEmail}</td>
                    <td className="p-3 text-right">{e.photo_count}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-[10px] ${e.is_published ? 'border-green-500/40 text-green-500' : 'border-muted-foreground/40'}`}>
                        {e.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" and all its photos. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteEvent(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
