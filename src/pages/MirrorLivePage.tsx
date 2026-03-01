import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Radio, Copy, Zap } from 'lucide-react';

interface EventOption { id: string; name: string; livesync_enabled: boolean; }

const MirrorLivePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [liveEnabled, setLiveEnabled] = useState(false);

  useEffect(() => { document.title = 'MirrorAI — MirrorLive'; }, []);

  useEffect(() => {
    if (!user) return;
    (supabase.from('events').select('id, name, livesync_enabled') as any)
      .eq('user_id', user.id).order('event_date', { ascending: false })
      .then(({ data }: any) => { if (data) setEvents(data as EventOption[]); });
  }, [user]);

  useEffect(() => {
    const ev = events.find(e => e.id === selectedEvent);
    if (ev) setLiveEnabled(ev.livesync_enabled);
  }, [selectedEvent, events]);

  const toggleLive = async (val: boolean) => {
    if (!selectedEvent) return;
    setLiveEnabled(val);
    await supabase.from('events').update({ livesync_enabled: val } as any).eq('id', selectedEvent);
    toast({ title: val ? 'MirrorLive enabled' : 'MirrorLive disabled' });
  };

  const liveUrl = selectedEvent ? `${window.location.origin}/event/${events.find(e => e.id === selectedEvent)?.name?.toLowerCase().replace(/\s+/g, '-') || selectedEvent}/live` : '';

  return (
    <DashboardLayout>
      <div className="page-fade-in max-w-lg">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl font-semibold text-foreground">MirrorLive</h1>
        </div>
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-[0.12em] mb-8">Real-time camera tethering for live events</p>

        <div className="bg-card border border-border p-6 space-y-6 mb-6">
          <div className="space-y-3">
            <Zap className="h-8 w-8 text-primary/30" />
            <h3 className="font-serif text-lg font-semibold text-foreground">How it works</h3>
            <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
              Enable MirrorLive on an event, then share the live session URL with your phone.
              Photos uploaded will appear in the guest gallery in real time — perfect for wedding receptions, corporate events, and live shows.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-9 text-[12px]"><SelectValue placeholder="Choose an event" /></SelectTrigger>
              <SelectContent>
                {events.map(e => <SelectItem key={e.id} value={e.id} className="text-[12px]">{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-[12px] text-foreground/80 font-normal">Enable Live Mode</Label>
                <Switch checked={liveEnabled} onCheckedChange={toggleLive} />
              </div>

              {liveEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Live Session URL</Label>
                  <div className="flex gap-1.5">
                    <Input value={liveUrl} readOnly className="bg-background h-9 text-[11px] font-mono" />
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(liveUrl); toast({ title: 'Link copied' }); }} className="h-9 w-9 shrink-0">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MirrorLivePage;
