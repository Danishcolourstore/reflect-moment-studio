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
import { RefreshCw, Ban, Trash2, ShieldCheck, UserX } from 'lucide-react';

interface UserRow {
  id: string;
  user_id: string;
  email: string | null;
  studio_name: string;
  plan: string;
  suspended: boolean;
  created_at: string;
  eventCount?: number;
  photoCount?: number;
  roles?: string[];
}

export default function SuperAdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ type: string; user: UserRow } | null>(null);

  const load = async () => {
    setLoading(true);
    const [profilesRes, eventsRes, photosRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('user_id'),
      supabase.from('photos').select('user_id'),
      supabase.from('user_roles').select('*'),
    ]);

    const profiles = profilesRes.data || [];
    const events = eventsRes.data || [];
    const photos = photosRes.data || [];
    const roles = rolesRes.data || [];

    const eventCounts: Record<string, number> = {};
    events.forEach((e: any) => { eventCounts[e.user_id] = (eventCounts[e.user_id] || 0) + 1; });

    const photoCounts: Record<string, number> = {};
    photos.forEach((p: any) => { photoCounts[p.user_id] = (photoCounts[p.user_id] || 0) + 1; });

    const roleMap: Record<string, string[]> = {};
    roles.forEach((r: any) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    setUsers(profiles.map((p: any) => ({
      ...p,
      eventCount: eventCounts[p.user_id] || 0,
      photoCount: photoCounts[p.user_id] || 0,
      roles: roleMap[p.user_id] || [],
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const logAction = async (action: string, target: string) => {
    await supabase.from('admin_activity_log').insert({
      action, target, performed_by: me?.email || 'super_admin',
    });
  };

  const toggleSuspend = async (u: UserRow) => {
    const newVal = !u.suspended;
    await supabase.from('profiles').update({ suspended: newVal }).eq('user_id', u.user_id);
    await logAction(newVal ? 'suspend_user' : 'unsuspend_user', u.email || u.user_id);
    toast.success(newVal ? 'User suspended' : 'User unsuspended');
    setDialog(null);
    load();
  };

  const deleteUser = async (u: UserRow) => {
    // Delete user's photos, events, storybooks, then profile
    await supabase.from('photos').delete().eq('user_id', u.user_id);
    await supabase.from('events').delete().eq('user_id', u.user_id);
    await supabase.from('storybooks').delete().eq('user_id', u.user_id);
    await supabase.from('user_roles').delete().eq('user_id', u.user_id);
    await supabase.from('profiles').delete().eq('user_id', u.user_id);
    await logAction('delete_user', u.email || u.user_id);
    toast.success('User and all data deleted');
    setDialog(null);
    load();
  };

  const promoteToAdmin = async (u: UserRow) => {
    const { error } = await supabase.from('user_roles').insert({
      user_id: u.user_id, role: 'admin' as any,
    });
    if (error && error.code === '23505') {
      toast.info('User already has admin role');
    } else if (error) {
      toast.error('Failed to promote');
    } else {
      await logAction('promote_to_admin', u.email || u.user_id);
      toast.success('User promoted to admin');
    }
    setDialog(null);
    load();
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      super_admin: 'border-amber-500/40 text-amber-500',
      admin: 'border-blue-500/40 text-blue-500',
      client: 'border-emerald-500/40 text-emerald-500',
      photographer: 'border-muted-foreground/40 text-muted-foreground',
    };
    return styles[role] || 'border-border text-muted-foreground';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">User Management</h1>
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Studio</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Events</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Photos</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{u.email || '—'}</td>
                    <td className="p-3">{u.studio_name}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {(u.roles?.length ? u.roles : ['user']).map((r) => (
                          <Badge key={r} variant="outline" className={`text-[10px] ${roleBadge(r)}`}>{r}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">{u.plan}</Badge>
                    </td>
                    <td className="p-3 text-right">{u.eventCount}</td>
                    <td className="p-3 text-right">{u.photoCount}</td>
                    <td className="p-3">
                      {u.suspended ? (
                        <Badge variant="destructive" className="text-[10px]">Suspended</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-500">Active</Badge>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {u.user_id !== me?.id && (
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setDialog({ type: 'suspend', user: u })}
                            title={u.suspended ? 'Unsuspend' : 'Suspend'}
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setDialog({ type: 'promote', user: u })}
                            title="Promote to Admin"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            onClick={() => setDialog({ type: 'delete', user: u })}
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog?.type === 'suspend' && (dialog.user.suspended ? 'Unsuspend User?' : 'Suspend User?')}
              {dialog?.type === 'delete' && 'Delete User?'}
              {dialog?.type === 'promote' && 'Promote to Admin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog?.type === 'suspend' && `This will ${dialog.user.suspended ? 'restore' : 'block'} access for ${dialog.user.email}.`}
              {dialog?.type === 'delete' && `This will permanently delete ${dialog?.user.email} and ALL their data (events, photos, storybooks). This cannot be undone.`}
              {dialog?.type === 'promote' && `This will grant admin privileges to ${dialog?.user.email}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={dialog?.type === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                if (!dialog) return;
                if (dialog.type === 'suspend') toggleSuspend(dialog.user);
                if (dialog.type === 'delete') deleteUser(dialog.user);
                if (dialog.type === 'promote') promoteToAdmin(dialog.user);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
