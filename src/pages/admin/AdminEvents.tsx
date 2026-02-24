import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
      <h1 className="text-xl font-bold mb-6">All Events</h1>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Event</th>
              <th className="text-left px-4 py-2.5 font-medium">Photographer</th>
              <th className="text-left px-4 py-2.5 font-medium">Date</th>
              <th className="text-left px-4 py-2.5 font-medium">Photos</th>
              <th className="text-left px-4 py-2.5 font-medium">Published</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-medium">{e.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.photographer_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {format(new Date(e.event_date), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-2.5">{e.photo_count}</td>
                <td className="px-4 py-2.5">
                  {e.is_published ? (
                    <span className="text-green-600 dark:text-green-400">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right space-x-1">
                  {e.is_published && (
                    <Button size="sm" variant="ghost" className="text-[11px] h-7" onClick={() => unpublish(e.id)}>
                      Unpublish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] h-7 text-destructive"
                    onClick={() => deleteEvent(e.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
