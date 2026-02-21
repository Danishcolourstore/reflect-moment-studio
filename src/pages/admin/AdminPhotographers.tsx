import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, Camera, CalendarDays } from 'lucide-react';

interface Photographer {
  id: string;
  user_id: string;
  studio_name: string;
  email: string | null;
  plan: string;
  suspended: boolean;
  created_at: string;
  event_count: number;
  photo_count: number;
}

export default function AdminPhotographers() {
  const { toast } = useToast();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const load = async () => {
    const { data } = await (supabase
      .from('profiles')
      .select('id, user_id, studio_name, email, plan, suspended, created_at') as any);
    if (!data) return;

    const { data: events } = await (supabase.from('events').select('user_id') as any);
    const countMap: Record<string, number> = {};
    (events || []).forEach((e: any) => {
      countMap[e.user_id] = (countMap[e.user_id] || 0) + 1;
    });

    const { data: photos } = await (supabase.from('photos').select('user_id') as any);
    const photoCountMap: Record<string, number> = {};
    (photos || []).forEach((p: any) => {
      photoCountMap[p.user_id] = (photoCountMap[p.user_id] || 0) + 1;
    });

    setPhotographers(
      (data as any[]).map((p: any) => ({
        ...p,
        event_count: countMap[p.user_id] || 0,
        photo_count: photoCountMap[p.user_id] || 0,
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const updateProfile = async (userId: string, updates: Record<string, any>) => {
    const { error } = await (supabase.from('profiles').update(updates) as any).eq('user_id', userId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Updated' });
      load();
    }
  };

  // Filter and search
  const filtered = photographers.filter(p => {
    const matchesSearch = !search || 
      p.studio_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !p.suspended) ||
      (statusFilter === 'suspended' && p.suspended);
    return matchesSearch && matchesStatus;
  });

  const getInitial = (name: string) => (name?.charAt(0) || '?').toUpperCase();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display italic text-[24px] font-medium text-foreground tracking-tight">Photographers</h1>
        <div className="w-10 h-[1.5px] bg-primary mt-2" />
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 h-9 bg-card border-border text-[12px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-[11px] border-border bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[12px]">All</SelectItem>
            <SelectItem value="active" className="text-[12px]">Active</SelectItem>
            <SelectItem value="suspended" className="text-[12px]">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-[11px] text-muted-foreground/50 mb-4">{filtered.length} photographer{filtered.length !== 1 ? 's' : ''}</p>

      {/* Desktop table */}
      <div className="hidden md:block border border-border overflow-hidden bg-card">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Photographer</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Events</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Photos</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center text-[11px] font-medium text-foreground/70 shrink-0">
                      {getInitial(p.studio_name)}
                    </div>
                    <span className="font-medium text-foreground">{p.studio_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground/70">{p.email || '—'}</td>
                <td className="px-4 py-3 text-foreground">{p.event_count}</td>
                <td className="px-4 py-3 text-foreground">{p.photo_count}</td>
                <td className="px-4 py-3 text-muted-foreground/70">
                  {format(new Date(p.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.plan}
                    onChange={(e) => updateProfile(p.user_id, { plan: e.target.value })}
                    className="bg-transparent border border-border rounded px-1.5 py-0.5 text-[11px] text-foreground"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  {p.suspended ? (
                    <Badge variant="destructive" className="text-[9px] px-2 py-0.5">Suspended</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 hover:bg-emerald-500/15">Active</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant={p.suspended ? 'outline' : 'ghost'}
                    className={`text-[10px] h-7 px-3 uppercase tracking-[0.04em] ${
                      p.suspended ? 'border-border' : 'text-destructive hover:bg-destructive/10'
                    }`}
                    onClick={() => updateProfile(p.user_id, { suspended: !p.suspended })}
                  >
                    {p.suspended ? 'Unsuspend' : 'Suspend'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12px] text-muted-foreground/50">No photographers found</div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center text-[14px] font-medium text-foreground/70 shrink-0">
                {getInitial(p.studio_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[13px] text-foreground truncate">{p.studio_name}</p>
                <p className="text-[11px] text-muted-foreground/60 truncate">{p.email || '—'}</p>
              </div>
              {p.suspended ? (
                <Badge variant="destructive" className="text-[9px] px-2 py-0.5 shrink-0">Suspended</Badge>
              ) : (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 shrink-0 hover:bg-emerald-500/15">Active</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground/60">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {p.event_count} events</span>
              <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> {p.photo_count} photos</span>
              <span>Joined {format(new Date(p.created_at), 'MMM yyyy')}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <select
                value={p.plan}
                onChange={(e) => updateProfile(p.user_id, { plan: e.target.value })}
                className="bg-transparent border border-border rounded px-2 py-1 text-[11px] text-foreground"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
              <Button
                size="sm"
                variant={p.suspended ? 'outline' : 'ghost'}
                className={`text-[10px] h-8 min-h-[44px] px-4 uppercase tracking-[0.04em] ${
                  p.suspended ? 'border-border' : 'text-destructive hover:bg-destructive/10'
                }`}
                onClick={() => updateProfile(p.user_id, { suspended: !p.suspended })}
              >
                {p.suspended ? 'Unsuspend' : 'Suspend'}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12px] text-muted-foreground/50">No photographers found</div>
        )}
      </div>
    </div>
  );
}
