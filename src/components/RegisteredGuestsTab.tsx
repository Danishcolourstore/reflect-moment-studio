import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Users, Loader2 } from 'lucide-react';

interface GuestRegistration {
  id: string;
  guest_name: string;
  email: string;
  status: string;
  matched_photo_ids: string[] | null;
  created_at: string;
}

interface RegisteredGuestsTabProps {
  eventId: string;
}

export function RegisteredGuestsTab({ eventId }: RegisteredGuestsTabProps) {
  const [guests, setGuests] = useState<GuestRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('guest_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false }) as any;
    if (data) setGuests(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const exportCSV = () => {
    const header = 'Name,Email,Status,Photos Found,Registered At\n';
    const rows = guests.map(g =>
      `"${g.guest_name}","${g.email}","${g.status}",${g.matched_photo_ids?.length ?? 0},"${new Date(g.created_at).toLocaleString()}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{guests.length} registered guest{guests.length !== 1 ? 's' : ''}</p>
        </div>
        {guests.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-[10px] h-7 uppercase tracking-[0.06em]">
            <Download className="mr-1 h-3 w-3" /> Export CSV
          </Button>
        )}
      </div>

      {guests.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 text-center py-8">No guests have registered yet. Share the registration QR code at your event.</p>
      ) : (
        <div className="border border-border rounded-md overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Name</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Email</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Photos</th>
                <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 text-[12px] text-foreground">{g.guest_name}</td>
                  <td className="px-3 py-2.5 text-[12px] text-muted-foreground">{g.email}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={g.status === 'notified' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-wider">
                      {g.status === 'notified' ? '✓ Notified' : 'Waiting'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-muted-foreground">{g.matched_photo_ids?.length ?? 0}</td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground/60">
                    {new Date(g.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
