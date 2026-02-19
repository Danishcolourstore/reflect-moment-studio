import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Plus, Image } from 'lucide-react';
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
      <div className="text-center mb-6">
        <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">MirrorAI</h1>
        <p className="mt-0.5 text-[11px] text-muted-foreground tracking-[0.15em] uppercase">Reflections of Your Moments</p>
      </div>

      {/* Pic-Time style underline tabs */}
      <div className="flex items-center justify-center gap-6 mb-6 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-[11px] uppercase tracking-[0.1em] transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-foreground text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-primary hover:bg-gold-hover text-primary-foreground text-xs h-8">
          <Plus className="mr-1.5 h-3.5 w-3.5" />New Event
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No events found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(event => (
            <div
              key={event.id}
              className="group cursor-pointer animate-fade-in"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="relative aspect-square overflow-hidden bg-secondary/50">
                {event.cover_url ? (
                  <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground/15" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
                    <button className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-foreground" onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>
                      View
                    </button>
                    <button className="rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-foreground" onClick={(e) => { e.stopPropagation(); setShareEvent(event); }}>
                      Share
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-2 px-0.5">
                <h3 className="font-serif text-[15px] font-medium text-foreground leading-tight truncate">{event.name}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {format(new Date(event.event_date), 'MMM d, yyyy')} · {event.photo_count} photos
                </p>
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
