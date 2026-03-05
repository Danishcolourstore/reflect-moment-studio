import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Play, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface FeedEvent {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
}

const DashboardFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase
        .from('events')
        .select('id, name, slug, cover_url') as any)
        .eq('user_id', user.id)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false });

      const evts = (data || []) as FeedEvent[];
      setEvents(evts);

      const noCover = evts.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const covers: Record<string, string> = {};
        for (const ev of noCover) {
          const { data: p } = await (supabase
            .from('photos')
            .select('url') as any)
            .eq('event_id', ev.id)
            .order('sort_order', { ascending: true, nullsFirst: false })
            .limit(1);
          if (p && p.length > 0) covers[ev.id] = (p as any[])[0].url;
        }
        setCoverPhotos(covers);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="font-sans text-muted-foreground" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
            Photographer Feed
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[3px]">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-none" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-border/60 py-24 text-center rounded-xl">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-lg text-muted-foreground/60">No feed items yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">Publish events and enable "Feed visible" to show them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[3px]">
          {events.map(ev => {
            const coverUrl = ev.cover_url || coverPhotos[ev.id] || null;
            return (
              <div
                key={ev.id}
                className="group relative overflow-hidden cursor-pointer"
                onClick={() => navigate(`/dashboard/events/${ev.id}`)}
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {coverUrl ? (
                    <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
                      <ProgressiveImage src={coverUrl} alt={ev.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-secondary">
                      <Camera className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                    <div className="w-12 h-12 rounded-full border-2 border-white/70 flex items-center justify-center">
                      <Play className="h-4 w-4 text-white/90 ml-0.5" fill="white" fillOpacity={0.85} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="text-[12px] text-white/90 lowercase italic font-serif tracking-wide">
                      {ev.name.toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardFeed;
