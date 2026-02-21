import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Camera } from 'lucide-react';

interface AdminEvent {
  id: string;
  name: string;
  event_date: string;
  is_published: boolean;
  photo_count: number;
  user_id: string;
  photographer_name: string;
}

export default function AdminEvents() {
  const { toast } = useToast();
  const [events, setEvents] = useState<AdminEvent[]>([]);

  const load = async () => {
    const { data: evts } = await (supabase
      .from('events')
      .select('id, name, event_date, is_published, photo_count, user_id') as any)
      .order('created_at', { ascending: false });

    const { data: profiles } = await (supabase
      .from('profiles')
      .select('user_id, studio_name') as any);

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => {
      nameMap[p.user_id] = p.studio_name;
    });

    setEvents(
      (evts || []).map((e: any) => ({
        ...e,
        photographer_name: nameMap[e.user_id] || 'Unknown',
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const unpublish = async (id: string) => {
    const { error } = await (supabase.from('events').update({ is_published: false }) as any).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Unpublished' }); load(); }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); load(); }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display italic text-[24px] font-medium text-foreground tracking-tight">All Events</h1>
        <div className="w-10 h-[1.5px] bg-primary mt-2" />
      </div>

      <p className="text-[11px] text-muted-foreground/50 mb-4">{events.length} event{events.length !== 1 ? 's' : ''}</p>

      {/* Desktop table */}
      <div className="hidden md:block border border-border overflow-hidden bg-card">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Event</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Photographer</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Photos</th>
              <th className="text-left px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-foreground/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{e.name}</td>
                <td className="px-4 py-3 text-muted-foreground/70">{e.photographer_name}</td>
                <td className="px-4 py-3 text-muted-foreground/70">
                  {format(new Date(e.event_date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-3 text-foreground">{e.photo_count}</td>
                <td className="px-4 py-3">
                  {e.is_published ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 hover:bg-emerald-500/15">Published</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-2 py-0.5">Draft</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  {e.is_published && (
                    <Button size="sm" variant="ghost" className="text-[10px] h-7 px-3 uppercase tracking-[0.04em]" onClick={() => unpublish(e.id)}>
                      Unpublish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[10px] h-7 px-3 text-destructive hover:bg-destructive/10 uppercase tracking-[0.04em]"
                    onClick={() => deleteEvent(e.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <div className="py-12 text-center text-[12px] text-muted-foreground/50">No events found</div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {events.map((e) => (
          <div key={e.id} className="border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-[13px] text-foreground">{e.name}</p>
                <p className="text-[11px] text-muted-foreground/60">{e.photographer_name}</p>
              </div>
              {e.is_published ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-[9px] px-2 py-0.5 shrink-0 hover:bg-emerald-500/15">Published</Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 shrink-0">Draft</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
              <span>{format(new Date(e.event_date), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> {e.photo_count}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {e.is_published && (
                <Button size="sm" variant="outline" className="text-[10px] h-8 min-h-[44px] px-3 uppercase tracking-[0.04em] border-border flex-1" onClick={() => unpublish(e.id)}>
                  Unpublish
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-[10px] h-8 min-h-[44px] px-3 text-destructive hover:bg-destructive/10 uppercase tracking-[0.04em] flex-1"
                onClick={() => deleteEvent(e.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
