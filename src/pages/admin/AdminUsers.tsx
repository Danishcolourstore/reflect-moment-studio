import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from './AdminGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Shield, ShieldAlert, Camera, UserMinus, LogOut as LogOutIcon, UserPlus, UserX } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'Danishsubair@gmail.com';

interface UserRow {
  id: string;
  user_id: string;
  studio_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

export default function AdminUsers() {
  const { isSuperAdmin } = useAdminRole();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ userId: string; action: string; label: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await (supabase.from('profiles').select('id, user_id, studio_name, email, avatar_url, created_at') as any);
    if (!profiles) { setLoading(false); return; }

    const { data: roles } = await (supabase.from('user_roles').select('user_id, role') as any);
    const roleMap: Record<string, string[]> = {};
    (roles || []).forEach((r: any) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    setUsers((profiles as any[]).map((p: any) => ({
      ...p,
      roles: roleMap[p.user_id] || ['photographer'],
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const executeAction = async (userId: string, action: string) => {
    setActionLoading(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-force-logout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ target_user_id: userId, action }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Action failed');

      toast.success(`Action completed successfully`);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const getHighestRole = (roles: string[]): string => {
    if (roles.includes('super_admin')) return 'super_admin';
    if (roles.includes('admin')) return 'admin';
    return 'photographer';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1" style={{ background: 'linear-gradient(135deg, #D4A855, #B8902E)', color: '#1a1000', fontSize: '9px', padding: '2px 8px', borderRadius: '100px', fontFamily: 'Jost, sans-serif', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            <Shield className="h-3 w-3" /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1" style={{ background: 'var(--accent)', color: 'var(--bg-primary)', fontSize: '9px', padding: '2px 8px', borderRadius: '100px', fontFamily: 'Jost, sans-serif', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            <ShieldAlert className="h-3 w-3" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: '9px', padding: '2px 8px', borderRadius: '100px', fontFamily: 'Jost, sans-serif', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            <Camera className="h-3 w-3" /> Photographer
          </span>
        );
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-muted)', fontFamily: 'Jost, sans-serif', fontSize: '13px' }}>Only Super Admin can access user management.</p>
      </div>
    );
  }

  let filtered = users;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(u => u.studio_name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }

  return (
    <div className="space-y-6">
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 400, color: 'var(--text-primary)' }}>User Management</h1>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="max-w-xs"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Jost, sans-serif' }}
      />

      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--card-bg)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: '12px', fontFamily: 'Jost, sans-serif' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th className="text-left px-4 py-3" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>User</th>
                <th className="text-left px-4 py-3" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Email</th>
                <th className="text-left px-4 py-3" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Role</th>
                <th className="text-left px-4 py-3" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Joined</th>
                <th className="text-right px-4 py-3" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const highestRole = getHighestRole(u.roles);
                const isSA = highestRole === 'super_admin';
                const isAdminUser = highestRole === 'admin';

                return (
                  <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-tertiary)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {u.studio_name.charAt(0)}
                        </div>
                      )}
                      <span style={{ color: 'var(--text-primary)' }}>{u.studio_name}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{u.email || '—'}</td>
                    <td className="px-4 py-3">{getRoleBadge(highestRole)}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-right">
                      {isSA ? (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Protected</span>
                      ) : (
                        <div className="flex items-center gap-1 justify-end">
                          {!isAdminUser && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[11px] h-7 gap-1"
                              disabled={actionLoading === u.user_id}
                              onClick={() => setConfirmAction({ userId: u.user_id, action: 'promote_to_admin', label: `Promote ${u.studio_name} to Admin?` })}
                            >
                              <UserPlus className="h-3 w-3" /> Promote
                            </Button>
                          )}
                          {isAdminUser && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[11px] h-7 gap-1"
                              disabled={actionLoading === u.user_id}
                              onClick={() => setConfirmAction({ userId: u.user_id, action: 'demote_to_photographer', label: `Demote ${u.studio_name} to Photographer?` })}
                            >
                              <UserMinus className="h-3 w-3" /> Demote
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] h-7 gap-1"
                            disabled={actionLoading === u.user_id}
                            onClick={() => setConfirmAction({ userId: u.user_id, action: 'force_logout', label: `Force logout ${u.studio_name}?` })}
                          >
                            <LogOutIcon className="h-3 w-3" /> Logout
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[11px] h-7 gap-1"
                            style={{ color: 'var(--danger)' }}
                            disabled={actionLoading === u.user_id}
                            onClick={() => setConfirmAction({ userId: u.user_id, action: 'delete_user', label: `Permanently delete ${u.studio_name}? This cannot be undone.` })}
                          >
                            <UserX className="h-3 w-3" /> Delete
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: 'var(--text-primary)', marginBottom: '12px' }}>Confirm Action</h3>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>{confirmAction.label}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                style={{ flex: 1, height: '44px', background: 'transparent', border: '1.5px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(confirmAction.userId, confirmAction.action)}
                disabled={!!actionLoading}
                style={{ flex: 1, height: '44px', background: confirmAction.action === 'delete_user' ? 'var(--danger)' : 'var(--accent)', border: 'none', borderRadius: '8px', color: 'var(--bg-primary)', fontFamily: 'Jost, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}
              >
                {actionLoading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
