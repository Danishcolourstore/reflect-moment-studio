import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Photographers</h1>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Studio</th>
              <th className="text-left px-4 py-2.5 font-medium">Email</th>
              <th className="text-left px-4 py-2.5 font-medium">Plan</th>
              <th className="text-left px-4 py-2.5 font-medium">Events</th>
              <th className="text-left px-4 py-2.5 font-medium">Photos</th>
              <th className="text-left px-4 py-2.5 font-medium">Joined</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-right px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {photographers.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5">{p.studio_name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.email || '—'}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={p.plan}
                    onChange={(e) => updateProfile(p.user_id, { plan: e.target.value })}
                    className="bg-transparent border border-border rounded px-1.5 py-0.5 text-[12px]"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">{p.event_count}</td>
                <td className="px-4 py-2.5">{p.photo_count}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {format(new Date(p.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-4 py-2.5">
                  {p.suspended ? (
                    <span className="text-destructive text-[11px] font-medium">Suspended</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 text-[11px] font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[11px] h-7"
                    onClick={() => updateProfile(p.user_id, { suspended: !p.suspended })}
                  >
                    {p.suspended ? 'Unsuspend' : 'Suspend'}
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
