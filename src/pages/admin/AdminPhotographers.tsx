import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, Camera, CalendarDays, Trash2, Ban, CheckCircle2, HardDrive, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Photographer {
  id: string;
  user_id: string;
  studio_name: string;
  email: string | null;
  mobile: string | null;
  plan: string;
  suspended: boolean;
  created_at: string;
  storage_limit_mb: number | null;
  event_count: number;
  photo_count: number;
  storage_used_mb: number;
}

interface PhotographerEvent {
  id: string;
  name: string;
  event_date: string;
  photo_count: number;
  is_published: boolean;
}

const STORAGE_LIMITS = [
  { value: '1024', label: '1 GB' },
  { value: '5120', label: '5 GB' },
  { value: '10240', label: '10 GB' },
  { value: '51200', label: '50 GB' },
  { value: '102400', label: '100 GB' },
  { value: '0', label: 'Unlimited' },
];

function formatStorageMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

export default function AdminPhotographers() {
  const { toast } = useToast();
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Photographer | null>(null);
  const [viewEventsTarget, setViewEventsTarget] = useState<Photographer | null>(null);
  const [photographerEvents, setPhotographerEvents] = useState<PhotographerEvent[]>([]);

  const load = async () => {
    const { data: profiles } = await (supabase
      .from('profiles')
      .select('id, user_id, studio_name, email, mobile, plan, suspended, created_at, storage_limit_mb') as any);
    if (!profiles) return;

    const { data: events } = await (supabase.from('events').select('user_id') as any);
    const eventMap: Record<string, number> = {};
    (events || []).forEach((e: any) => { eventMap[e.user_id] = (eventMap[e.user_id] || 0) + 1; });

    const { data: photos } = await (supabase.from('photos').select('user_id, file_size') as any);
    const photoCountMap: Record<string, number> = {};
    const storageMBMap: Record<string, number> = {};
    (photos || []).forEach((p: any) => {
      photoCountMap[p.user_id] = (photoCountMap[p.user_id] || 0) + 1;
      storageMBMap[p.user_id] = (storageMBMap[p.user_id] || 0) + ((p.file_size ?? 0) / (1024 * 1024));
    });

    setPhotographers(
      (profiles as any[]).map((p: any) => ({
        ...p,
        event_count: eventMap[p.user_id] || 0,
        photo_count: photoCountMap[p.user_id] || 0,
        storage_used_mb: storageMBMap[p.user_id] || 0,
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const updateProfile = async (userId: string, updates: Record<string, any>) => {
    const { error } = await (supabase.from('profiles').update(updates) as any).eq('user_id', userId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Updated' }); load(); }
  };

  const deletePhotographer = async (p: Photographer) => {
    // Delete photos, events, then profile (cascade handles favorites etc.)
    await (supabase.from('photos').delete() as any).eq('user_id', p.user_id);
    await (supabase.from('events').delete() as any).eq('user_id', p.user_id);
    const { error } = await (supabase.from('profiles').delete() as any).eq('user_id', p.user_id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Photographer deleted' }); setDeleteTarget(null); load(); }
  };

  const loadPhotographerEvents = async (p: Photographer) => {
    setViewEventsTarget(p);
    const { data } = await (supabase.from('events').select('id, name, event_date, photo_count, is_published') as any)
      .eq('user_id', p.user_id)
      .order('created_at', { ascending: false });
    setPhotographerEvents(data || []);
  };

  const filtered = photographers.filter(p => {
    const matchesSearch = !search ||
      p.studio_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.mobile || '').includes(search);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && !p.suspended) ||
      (statusFilter === 'suspended' && p.suspended);
    return matchesSearch && matchesStatus;
  });

  const getInitial = (name: string) => (name?.charAt(0) || '?').toUpperCase();

  const storagePercent = (p: Photographer) => {
    if (!p.storage_limit_mb || p.storage_limit_mb === 0) return 0;
    return Math.min(100, Math.round((p.storage_used_mb / p.storage_limit_mb) * 100));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">Photographer Management</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-1">Manage all registered photographers</p>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-9 h-9 bg-card border-border text-[12px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 text-[11px] border-border bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-[11px] text-muted-foreground/50 mb-4">{filtered.length} photographer{filtered.length !== 1 ? 's' : ''}</p>

      {/* Desktop table */}
      <div className="hidden lg:block border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                {['Photographer', 'Email / Phone', 'Events', 'Photos', 'Storage', 'Joined', 'Plan', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const pct = storagePercent(p);
                const isWarning = pct >= 80;
                return (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-medium text-primary shrink-0">
                          {getInitial(p.studio_name)}
                        </div>
                        <span className="font-medium text-foreground">{p.studio_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-muted-foreground/70">{p.email || '—'}</p>
                      {p.mobile && <p className="text-[10px] text-muted-foreground/40">{p.mobile}</p>}
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.event_count}</td>
                    <td className="px-4 py-3 text-foreground">{p.photo_count}</td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <div className="space-y-1">
                        <p className={`text-[10px] ${isWarning ? 'text-destructive' : 'text-muted-foreground/60'}`}>
                          {formatStorageMB(p.storage_used_mb)} / {p.storage_limit_mb === 0 || !p.storage_limit_mb ? '∞' : formatStorageMB(p.storage_limit_mb)}
                        </p>
                        {p.storage_limit_mb && p.storage_limit_mb > 0 && (
                          <Progress value={pct} className={`h-1 ${isWarning ? '[&>div]:bg-destructive' : ''}`} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground/70 whitespace-nowrap">
                      {format(new Date(p.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={p.plan}
                        onValueChange={(v) => updateProfile(p.user_id, { plan: v })}
                      >
                        <SelectTrigger className="h-7 w-[70px] text-[10px] border-border bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      {p.suspended ? (
                        <Badge variant="destructive" className="text-[9px] px-2 py-0.5">Suspended</Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 hover:bg-emerald-500/15">Active</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Select
                          value={String(p.storage_limit_mb ?? 5120)}
                          onValueChange={(v) => updateProfile(p.user_id, { storage_limit_mb: parseInt(v) })}
                        >
                          <SelectTrigger className="h-7 w-[80px] text-[9px] border-border bg-transparent">
                            <HardDrive className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STORAGE_LIMITS.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="View events"
                          onClick={() => loadPhotographerEvents(p)}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground/60" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title={p.suspended ? 'Reactivate' : 'Suspend'}
                          onClick={() => updateProfile(p.user_id, { suspended: !p.suspended })}
                        >
                          {p.suspended ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Ban className="h-3.5 w-3.5 text-destructive/60" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="Delete photographer"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12px] text-muted-foreground/50">No photographers found</div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden space-y-3">
        {filtered.map((p) => {
          const pct = storagePercent(p);
          const isWarning = pct >= 80;
          return (
            <div key={p.id} className="border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[14px] font-medium text-primary shrink-0">
                  {getInitial(p.studio_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[13px] text-foreground truncate">{p.studio_name}</p>
                  <p className="text-[11px] text-muted-foreground/60 truncate">{p.email || '—'}</p>
                  {p.mobile && <p className="text-[10px] text-muted-foreground/40">{p.mobile}</p>}
                </div>
                {p.suspended ? (
                  <Badge variant="destructive" className="text-[9px] px-2 py-0.5 shrink-0">Suspended</Badge>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 shrink-0 hover:bg-emerald-500/15">Active</Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground/60">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {p.event_count} events</span>
                <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> {p.photo_count} photos</span>
                <span>Joined {format(new Date(p.created_at), 'MMM yyyy')}</span>
              </div>

              {/* Storage bar */}
              <div className="space-y-1">
                <p className={`text-[10px] ${isWarning ? 'text-destructive' : 'text-muted-foreground/50'}`}>
                  Storage: {formatStorageMB(p.storage_used_mb)} / {!p.storage_limit_mb || p.storage_limit_mb === 0 ? '∞' : formatStorageMB(p.storage_limit_mb)}
                </p>
                {p.storage_limit_mb && p.storage_limit_mb > 0 && (
                  <Progress value={pct} className={`h-1 ${isWarning ? '[&>div]:bg-destructive' : ''}`} />
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Select value={p.plan} onValueChange={(v) => updateProfile(p.user_id, { plan: v })}>
                  <SelectTrigger className="h-8 w-[70px] text-[10px] border-border bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={String(p.storage_limit_mb ?? 5120)}
                  onValueChange={(v) => updateProfile(p.user_id, { storage_limit_mb: parseInt(v) })}
                >
                  <SelectTrigger className="h-8 w-[90px] text-[10px] border-border bg-transparent">
                    <HardDrive className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_LIMITS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => loadPhotographerEvents(p)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={p.suspended ? 'outline' : 'ghost'}
                  className={`h-8 px-3 text-[10px] uppercase ${!p.suspended ? 'text-destructive' : ''}`}
                  onClick={() => updateProfile(p.user_id, { suspended: !p.suspended })}
                >
                  {p.suspended ? 'Activate' : 'Suspend'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => setDeleteTarget(p)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12px] text-muted-foreground/50">No photographers found</div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photographer</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.studio_name}</strong>, including all their events, photos, and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deletePhotographer(deleteTarget)}
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View events dialog */}
      <Dialog open={!!viewEventsTarget} onOpenChange={() => setViewEventsTarget(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{viewEventsTarget?.studio_name}'s Events</DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-border">
            {photographerEvents.map(e => (
              <div key={e.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-foreground">{e.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{format(new Date(e.event_date), 'MMM d, yyyy')} · {e.photo_count} photos</p>
                </div>
                {e.is_published ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] hover:bg-emerald-500/15">Published</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px]">Draft</Badge>
                )}
              </div>
            ))}
            {photographerEvents.length === 0 && (
              <p className="py-8 text-center text-[11px] text-muted-foreground/40">No events</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
