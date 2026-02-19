import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Image, HardDrive, Eye, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { EventCard } from '@/components/EventCard';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  cover_url: string | null;
  photo_count: number;
  views: number;
  gallery_pin: string | null;
}

const Dashboard = () => {
  const { studioName } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) setEvents(data as Event[]);
  };

  useEffect(() => { fetchEvents(); }, []);

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else fetchEvents();
  };

  const totalPhotos = events.reduce((s, e) => s + e.photo_count, 0);
  const totalViews = events.reduce((s, e) => s + e.views, 0);

  return (
    <DashboardLayout>
      {/* Greeting — editorial, understated */}
      <div className="mb-5">
        <h1 className="font-serif text-[22px] font-semibold text-foreground">{greeting()}, {studioName}</h1>
      </div>

      {/* Stats strip — flush grid, Pixieset dashboard style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-border divide-x divide-border overflow-hidden mb-8">
        <StatCard label="Events" value={events.length} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard label="Photos" value={totalPhotos} icon={<Image className="h-4 w-4" />} />
        <StatCard label="Storage" value="—" icon={<HardDrive className="h-4 w-4" />} />
        <StatCard label="Views" value={totalViews} icon={<Eye className="h-4 w-4" />} />
      </div>

      {/* Recent events header */}
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif text-lg font-medium text-foreground">Recent Events</h2>
        <Button
          onClick={() => setCreateOpen(true)}
          variant="ghost"
          size="sm"
          className="text-gold hover:bg-gold/10 text-[11px] h-7 px-3 uppercase tracking-[0.06em] font-medium"
        >
          <Plus className="mr-1 h-3 w-3" />New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <Image className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 font-serif text-sm text-muted-foreground">No events yet</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 6).map((event) => (
            <EventCard
              key={event.id}
              id={event.id}
              name={event.name}
              date={event.event_date}
              photoCount={event.photo_count}
              coverUrl={event.cover_url}
              onShare={() => setShareEvent(event)}
              onEdit={() => navigate(`/events/${event.id}`)}
              onDelete={() => deleteEvent(event.id)}
              onClick={() => navigate(`/events/${event.id}`)}
            />
          ))}
        </div>
      )}

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchEvents} />
      {shareEvent && (
        <ShareModal
          open={!!shareEvent}
          onOpenChange={() => setShareEvent(null)}
          eventId={shareEvent.id}
          eventName={shareEvent.name}
          pin={shareEvent.gallery_pin}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
