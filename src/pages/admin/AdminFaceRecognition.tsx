import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScanFace, Download } from 'lucide-react';
import { format } from 'date-fns';

interface FREvent {
  id: string;
  name: string;
  photographer_name: string;
  guest_count: number;
  event_date: string;
}

interface GuestRow {
  guest_name: string;
  email: string;
  event_name: string;
  status: string;
  matched_count: number;
  created_at: string;
}

export default function AdminFaceRecognition() {
  const [frEvents, setFrEvents] = useState<FREvent[]>([]);
  const [guests, setGuests] = useState<GuestRow[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [evtRes, profRes, guestRes] = await Promise.all([
      (supabase.from('events').select('id, name, user_id, event_date, face_recognition_enabled') as any),
      supabase.from('profiles').select('user_id, studio_name') as any,
      supabase.from('guest_registrations').select('guest_name, email, event_id, status, matched_photo_ids, created_at') as any,
    ]);

    const nameMap: Record<string, string> = {};
    (profRes.data || []).forEach((p: any) => { nameMap[p.user_id] = p.studio_name; });

    const events = (evtRes.data || []) as any[];
    const eventNameMap: Record<string, string> = {};
    events.forEach((e: any) => { eventNameMap[e.id] = e.name; });

    const guestCountMap: Record<string, number> = {};
    const allGuests = (guestRes.data || []) as any[];
    allGuests.forEach((g: any) => { guestCountMap[g.event_id] = (guestCountMap[g.event_id] || 0) + 1; });

    setFrEvents(
      events
        .filter((e: any) => e.face_recognition_enabled)
        .map((e: any) => ({
          id: e.id,
          name: e.name,
          photographer_name: nameMap[e.user_id] || 'Unknown',
          guest_count: guestCountMap[e.id] || 0,
          event_date: e.event_date,
        }))
    );

    setGuests(
      allGuests.map((g: any) => ({
        guest_name: g.guest_name,
        email: g.email,
        event_name: eventNameMap[g.event_id] || 'Unknown',
        status: g.status,
        matched_count: g.matched_photo_ids?.length || 0,
        created_at: g.created_at,
      }))
    );
  };

  const exportCSV = () => {
    const header = 'Name,Email,Event,Status,Matched Photos,Registered\n';
    const rows = guests.map(g =>
      `"${g.guest_name}","${g.email}","${g.event_name}","${g.status}",${g.matched_count},"${format(new Date(g.created_at), 'yyyy-MM-dd')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-registrations.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">Face Recognition</h1>
        <p className="text-[11px] text-muted-foreground/50 mt-1">Monitor face recognition events and guest registrations</p>
      </div>

      {/* FR-enabled events */}
      <div className="bg-card border border-border mb-6">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <ScanFace className="h-4 w-4 text-primary/60" />
          <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">Events with Face Recognition</h2>
          <Badge className="ml-auto text-[9px]">{frEvents.length}</Badge>
        </div>
        <div className="divide-y divide-border/50">
          {frEvents.map(e => (
            <div key={e.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-foreground">{e.name}</p>
                <p className="text-[10px] text-muted-foreground/50">{e.photographer_name} · {format(new Date(e.event_date), 'MMM d, yyyy')}</p>
              </div>
              <span className="text-[11px] text-foreground">{e.guest_count} guest{e.guest_count !== 1 ? 's' : ''}</span>
            </div>
          ))}
          {frEvents.length === 0 && <p className="py-8 text-center text-[11px] text-muted-foreground/40">No events with face recognition enabled</p>}
        </div>
      </div>

      {/* All registered guests */}
      <div className="bg-card border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[12px] font-medium text-foreground uppercase tracking-[0.08em]">All Registered Guests</h2>
            <Badge className="text-[9px]">{guests.length}</Badge>
          </div>
          {guests.length > 0 && (
            <Button size="sm" variant="ghost" className="text-[10px] h-7 gap-1.5" onClick={exportCSV}>
              <Download className="h-3 w-3" /> Export CSV
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Email', 'Event', 'Status', 'Matches', 'Registered'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((g, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{g.guest_name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground/70">{g.email}</td>
                  <td className="px-4 py-2.5 text-muted-foreground/70">{g.event_name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={g.status === 'notified' ? 'default' : 'secondary'} className="text-[9px]">
                      {g.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{g.matched_count}</td>
                  <td className="px-4 py-2.5 text-muted-foreground/70">{format(new Date(g.created_at), 'MMM d')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {guests.length === 0 && <p className="py-8 text-center text-[11px] text-muted-foreground/40">No guest registrations</p>}
      </div>
    </div>
  );
}
