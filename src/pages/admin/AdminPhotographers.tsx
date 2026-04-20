import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

function formatBytes(bytes: number) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

async function logActivity(action: string, target: string) {
  await (supabase.from('admin_activity_log' as any).insert({ action, performed_by: 'Admin', target } as any) as any);
}

interface Photographer {
  id: string;
  user_id: string;
  studio_name: string;
  email: string | null;
  avatar_url: string | null;
  plan: string;
  suspended: boolean;
  created_at: string;
  event_count: number;
  photo_count: number;
  storage_bytes: number;
}

export default function AdminPhotographers() {
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(0);
  const perPage = 20;

  const load = async () => {
    const { data } = await (supabase.from('profiles').select('id, user_id, studio_name, email, avatar_url, plan, suspended, created_at') as any);
    if (!data) return;

    const { data: events } = await (supabase.from('events').select('user_id') as any);
    const evMap: Record<string, number> = {};
    (events || []).forEach((e: any) => { evMap[e.user_id] = (evMap[e.user_id] || 0) + 1; });

    const { data: photos } = await (supabase.from('photos').select('user_id, file_size') as any);
    const phMap: Record<string, number> = {};
    const sizeMap: Record<string, number> = {};
    (photos || []).forEach((p: any) => {
      phMap[p.user_id] = (phMap[p.user_id] || 0) + 1;
      sizeMap[p.user_id] = (sizeMap[p.user_id] || 0) + (p.file_size || 0);
    });

    setPhotographers((data as any[]).map((p: any) => ({
      ...p,
      event_count: evMap[p.user_id] || 0,
      photo_count: phMap[p.user_id] || 0,
      storage_bytes: sizeMap[p.user_id] || 0,
    })));
  };

  useEffect(() => { load(); }, []);

  const updatePlan = async (p: Photographer, newPlan: string) => {
    await (supabase.from('profiles').update({ plan: newPlan } as any) as any).eq('user_id', p.user_id);
    toast.success('Plan updated');
    await logActivity(`Changed plan to ${newPlan}`, p.studio_name);
    load();
  };

  const toggleSuspend = async (p: Photographer) => {
    const newStatus = !p.suspended;
    await (supabase.from('profiles').update({ suspended: newStatus } as any) as any).eq('user_id', p.user_id);
    toast.success(newStatus ? 'Photographer suspended' : 'Photographer reinstated');
    await logActivity(newStatus ? 'Suspended' : 'Unsuspended', p.studio_name);
    load();
  };

  let filtered = photographers;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.studio_name.toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q));
  }
  if (planFilter !== 'all') filtered = filtered.filter(p => p.plan === planFilter);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Photographers</h1>

      <div className="flex items-center gap-3">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name or email…" className="max-w-xs bg-background" />
        <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                <th className="text-left px-4 py-2.5 font-medium">Events</th>
                <th className="text-left px-4 py-2.5 font-medium">Photos</th>
                <th className="text-left px-4 py-2.5 font-medium">Storage</th>
                <th className="text-left px-4 py-2.5 font-medium">Joined</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {p.studio_name.charAt(0)}
                      </div>
                    )}
                    {p.studio_name}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.email || '—'}</td>
                  <td className="px-4 py-2.5">
                    <select value={p.plan} onChange={(e) => updatePlan(p, e.target.value)}
                      className="bg-transparent border border-border rounded px-1.5 py-0.5 text-[11px]">
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td className="px-4 py-2.5">{p.event_count}</td>
                  <td className="px-4 py-2.5">{p.photo_count}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatBytes(p.storage_bytes)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2.5">
                    {p.suspended ? (
                      <span className="text-destructive text-[10px] font-medium">Suspended</span>
                    ) : (
                      <span className="text-primary text-[10px] font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button size="sm" variant="ghost" className="text-[11px] h-7"
                      onClick={() => toggleSuspend(p)}>
                      {p.suspended ? 'Unsuspend' : 'Suspend'}
                    </Button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">No photographers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
