import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

async function logActivity(action: string, target: string) {
  await (supabase.from('admin_activity_log' as any).insert({ action, performed_by: 'Admin', target } as any) as any);
}

interface AdminEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  is_published: boolean;
  photo_count: number;
  views: number;
  cover_url: string | null;
  user_id: string;
  created_at: string;
  photographer: string;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const perPage = 20;

  const load = async () => {
    const { data: evts } = await (supabase.from('events').select('*').order('created_at', { ascending: false }) as any);
    const { data: profiles } = await (supabase.from('profiles').select('user_id, studio_name') as any);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.studio_name; });
    setEvents((evts || []).map((e: any) => ({ ...e, photographer: nameMap[e.user_id] || 'Unknown' })));
  };

  useEffect(() => { load(); }, []);

  const unpublish = async (e: AdminEvent) => {
    await (supabase.from('events').update({ is_published: false } as any) as any).eq('id', e.id);
    toast.success('Event unpublished');
    await logActivity('Event unpublished', e.name);
    load();
  };

  const deleteEvent = async (e: AdminEvent) => {
    await supabase.from('photos').delete().eq('event_id', e.id);
    await supabase.from('events').delete().eq('id', e.id);
    toast.success('Event deleted');
    await logActivity('Event deleted', e.name);
    load();
  };

  let filtered = events;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e => e.name.toLowerCase().includes(q) || e.photographer.toLowerCase().includes(q));
  }
  if (statusFilter === 'published') filtered = filtered.filter(e => e.is_published);
  if (statusFilter === 'draft') filtered = filtered.filter(e => !e.is_published);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-foreground">Events</h1>

      <div className="flex items-center gap-3">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search events or photographer…" className="max-w-xs bg-background" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-secondary/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium w-12"></th>
                <th className="text-left px-4 py-2.5 font-medium">Event</th>
                <th className="text-left px-4 py-2.5 font-medium">Photographer</th>
                <th className="text-left px-4 py-2.5 font-medium">Photos</th>
                <th className="text-left px-4 py-2.5 font-medium">Views</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Created</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt="" className="h-8 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-12 rounded bg-secondary" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{e.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.photographer}</td>
                  <td className="px-4 py-2.5">{e.photo_count}</td>
                  <td className="px-4 py-2.5">{e.views}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${e.is_published ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                      {e.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{format(new Date(e.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2.5 text-right space-x-1">
                    {e.is_published && (
                      <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => unpublish(e)}>Unpublish</Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-[11px] h-7"
                      onClick={() => window.open(`/event/${e.slug}/gallery`, '_blank')}>View</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-[11px] h-7 text-destructive">Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete "{e.name}" and all its photos. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEvent(e)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No events found</td></tr>
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
