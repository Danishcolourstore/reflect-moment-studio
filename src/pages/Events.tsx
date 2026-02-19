import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Plus, Image, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  cover_url: string | null;
  photo_count: number;
  gallery_pin: string | null;
}

const tabs = ['All', 'Wedding', 'Pre-Wedding', 'Engagement', 'Portrait', 'Family'];

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    if (data) setEvents(data as Event[]);
  };

  useEffect(() => { fetchEvents(); }, []);

  const filtered = activeTab === 'All' ? events : events.filter(e => e.event_type === activeTab);

  return (
    <DashboardLayout>
      <div className="text-center mb-8">
        <h1 className="font-serif text-4xl font-semibold text-foreground">MirrorAI</h1>
        <p className="mt-1 text-sm text-muted-foreground tracking-wide">Reflections of Your Moments</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-6">
        <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-gold-hover text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" />New Event
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No events found.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(event => (
            <div
              key={event.id}
              className="group cursor-pointer animate-fade-in"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {event.cover_url ? (
                  <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-foreground/0 opacity-0 transition-all group-hover:bg-foreground/40 group-hover:opacity-100">
                  <button className="rounded-full bg-card/90 px-4 py-2 text-xs font-medium text-foreground" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>
                    View Gallery
                  </button>
                  <button className="rounded-full bg-card/90 px-4 py-2 text-xs font-medium text-foreground" onClick={(e) => { e.stopPropagation(); setShareEvent(event); }}>
                    Share Link
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-serif text-lg text-foreground">{event.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                  <span>{event.photo_count} photos</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchEvents} />
      {shareEvent && (
        <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventId={shareEvent.id} eventName={shareEvent.name} pin={shareEvent.gallery_pin} />
      )}
    </DashboardLayout>
  );
};

export default Events;
