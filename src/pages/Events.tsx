import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreateEventModal } from '@/components/CreateEventModal';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Plus, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  cover_photo_url: string | null;
  gallery_password: string | null;
  location: string | null;
}

const tabs = ['All'];

const Events = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [shareEvent, setShareEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    if (!user) return;
    const { data } = await (supabase.from('events').select('*') as any).eq('photographer_id', user.id).order('date', { ascending: false });
    if (data) setEvents(data as unknown as Event[]);
  };

  useEffect(() => { fetchEvents(); }, [user]);

  const filtered = events;

  return (
    <DashboardLayout>
      {/* Centered header — Pic-Time collection page style */}
      <div className="text-center mb-5 pt-2">
        <h1 className="font-serif text-[26px] font-semibold text-foreground tracking-tight">MirrorAI</h1>
        <p className="text-[10px] text-muted-foreground/60 tracking-[0.2em] uppercase mt-0.5">Reflections of Your Moments</p>
      </div>

      {/* Underline category tabs — Pic-Time style */}
      <div className="flex items-center justify-center gap-5 sm:gap-7 mb-5 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-[10px] uppercase tracking-[0.12em] transition-colors border-b-[1.5px] -mb-px whitespace-nowrap ${
              activeTab === tab
                ? 'border-foreground text-foreground font-medium'
                : 'border-transparent text-muted-foreground/60 hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* New event — right-aligned, ghost */}
      <div className="flex justify-end mb-3">
        <Button
          onClick={() => setCreateOpen(true)}
          variant="ghost"
          size="sm"
          className="text-gold hover:bg-gold/10 text-[11px] h-7 px-3 uppercase tracking-[0.06em] font-medium"
        >
          <Plus className="mr-1 h-3 w-3" />New Event
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Image className="mx-auto h-10 w-10 text-muted-foreground/15" />
          <p className="mt-3 font-serif text-sm text-muted-foreground">No events found</p>
        </div>
      ) : (
        /* Tight album grid — square covers, minimal gap, Pixieset style */
        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map(event => (
            <div
              key={event.id}
              className="group cursor-pointer animate-fade-in"
              onClick={() => navigate(`/dashboard/events/${event.id}`)}
            >
              <div className="relative aspect-square overflow-hidden bg-secondary">
                {event.cover_photo_url ? (
                  <img
                    src={event.cover_photo_url}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground/12" />
                  </div>
                )}
                {/* Hover overlay — bottom gradient, subtle pill buttons */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute bottom-2.5 left-2.5 flex gap-1">
                    <button
                      className="rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-foreground transition hover:bg-card"
                      onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/events/${event.id}`); }}
                    >
                      View
                    </button>
                    <button
                      className="rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-foreground transition hover:bg-card"
                      onClick={(e) => { e.stopPropagation(); setShareEvent(event); }}
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
              {/* Minimal metadata — name + single line */}
              <div className="mt-1.5 px-px">
                <h3 className="font-serif text-[13px] font-medium text-foreground leading-snug truncate">{event.title}</h3>
                <p className="text-[10px] text-muted-foreground/60 mt-px">
                  {format(new Date(event.date), 'MMM yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateEventModal open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchEvents} />
      {shareEvent && (
        <ShareModal open={!!shareEvent} onOpenChange={() => setShareEvent(null)} eventId={shareEvent.id} eventName={shareEvent.title} pin={shareEvent.gallery_password} />
      )}
    </DashboardLayout>
  );
};

export default Events;
