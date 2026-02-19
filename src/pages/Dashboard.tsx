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
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">{greeting()}, {studioName}</h1>
      </div>

      <div className="grid grid-cols-2 gap-px sm:grid-cols-4 mb-10 border border-border overflow-hidden">
        <StatCard label="Total Events" value={events.length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard label="Total Photos" value={totalPhotos} icon={<Image className="h-5 w-5" />} />
        <StatCard label="Storage Used" value="—" icon={<HardDrive className="h-5 w-5" />} />
        <StatCard label="Gallery Views" value={totalViews} icon={<Eye className="h-5 w-5" />} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-semibold text-foreground">Recent Events</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-primary hover:bg-gold-hover text-primary-foreground text-xs h-8">
          <Plus className="mr-1.5 h-3.5 w-3.5" />New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Image className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 font-serif text-lg text-muted-foreground">No events yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
