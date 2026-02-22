import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, Camera, Users, Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminEvent {
  id: string;
  name: string;
  event_date: string;
  is_published: boolean;
  photo_count: number;
  user_id: string;
  photographer_name: string;
  face_recognition_enabled: boolean;
  guest_count: number;
  views: number;
}

export default function AdminEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [photographerFilter, setPhotographerFilter] = useState('all');
  const [photographers, setPhotographers] = useState<{ user_id: string; studio_name: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminEvent | null>(null);

  const load = async () => {
    const [evtRes, profileRes, guestRes] = await Promise.all([
      (supabase.from('events').select('id, name, event_date, is_published, photo_count, user_id, face_recognition_enabled, views') as any)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, studio_name') as any,
      supabase.from('guest_registrations').select('event_id') as any,
    ]);

    const nameMap: Record<string, string> = {};
    const profs = (profileRes.data || []) as any[];
    profs.forEach((p: any) => { nameMap[p.user_id] = p.studio_name; });
    setPhotographers(profs);

    const guestMap: Record<string, number> = {};
    (guestRes.data || []).forEach((g: any) => { guestMap[g.event_id] = (guestMap[g.event_id] || 0) + 1; });

    setEvents(
      (evtRes.data || []).map((e: any) => ({
        ...e,
        photographer_name: nameMap[e.user_id] || 'Unknown',
        guest_count: guestMap[e.id] || 0,
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await (supabase.from('events').update({ is_published: !current }) as any).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: current ? 'Unpublished' : 'Published' }); load(); }
  };

  const deleteEvent = async (id: string) => {
    await (supabase.from('photos').delete() as any).eq('event_id', id);
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Event deleted' }); setDeleteTarget(null); load(); }
  };

  const filtered = events.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.photographer_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'published' && e.is_published) || (statusFilter === 'draft' && !e.is_published);
    const matchPhotographer = photographerFilter === 'all' || e.user_id === photographerFilter;
    return matchSearch && matchStatus && matchPhotographer;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">Event Management</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-1">View and manage all platform events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" className="pl-9 h-9 bg-card border-border text-[12px]" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-[130px] h-9 text-[11px] border-border bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={photographerFilter} onValueChange={setPhotographerFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-[11px] border-border bg-card"><SelectValue placeholder="All photographers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Photographers</SelectItem>
            {photographers.map(p => (
              <SelectItem key={p.user_id} value={p.user_id}>{p.studio_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-[11px] text-muted-foreground/50 mb-4">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>

      {/* Desktop table */}
      <div className="hidden md:block border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                {['Event', 'Photographer', 'Date', 'Photos', 'Views', 'Guests', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{e.name}</p>
                    {e.face_recognition_enabled && (
                      <span className="text-[9px] text-primary/60">Face Recognition ON</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground/70">{e.photographer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground/70 whitespace-nowrap">{format(new Date(e.event_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-foreground">{e.photo_count}</td>
                  <td className="px-4 py-3 text-foreground">{e.views}</td>
                  <td className="px-4 py-3 text-foreground">
                    {e.guest_count > 0 && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground/40" />{e.guest_count}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.is_published ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 hover:bg-emerald-500/15">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] px-2 py-0.5">Draft</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={e.is_published ? 'Unpublish' : 'Publish'} onClick={() => togglePublish(e.id, e.is_published)}>
                        {e.is_published ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground/60" /> : <Eye className="h-3.5 w-3.5 text-emerald-600" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Delete" onClick={() => setDeleteTarget(e)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[12px] text-muted-foreground/50">No events found</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(e => (
          <div key={e.id} className="border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-medium text-[13px] text-foreground truncate">{e.name}</p>
                <p className="text-[11px] text-muted-foreground/60">{e.photographer_name}</p>
              </div>
              {e.is_published ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 shrink-0 hover:bg-emerald-500/15">Published</Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 shrink-0">Draft</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground/60">
              <span>{format(new Date(e.event_date), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1"><Camera className="h-3 w-3" />{e.photo_count}</span>
              {e.guest_count > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.guest_count} guests</span>}
              <span>{e.views} views</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" variant="outline" className="text-[10px] h-8 px-3 flex-1 border-border" onClick={() => togglePublish(e.id, e.is_published)}>
                {e.is_published ? 'Unpublish' : 'Publish'}
              </Button>
              <Button size="sm" variant="ghost" className="text-[10px] h-8 px-3 text-destructive flex-1" onClick={() => setDeleteTarget(e)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all its photos. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteEvent(deleteTarget.id)}>
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
