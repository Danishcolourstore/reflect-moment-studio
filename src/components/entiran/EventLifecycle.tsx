import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Check } from 'lucide-react';

type LifecycleStage = {
  label: string;
  completed: boolean;
  current: boolean;
};

type EventLifecycleData = {
  id: string;
  name: string;
  event_date: string;
  stages: LifecycleStage[];
  nextAction: string;
  nextRoute: string;
};

const STAGE_LABELS = [
  'Created', 'Uploaded', 'Shared', 'Viewing', 'Selected', 'Building', 'Complete', 'Delivered',
];

export function EventLifecycle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<EventLifecycleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: rawEvents } = await supabase
        .from('events')
        .select('id, name, event_date, photo_count, is_published')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(5) as any;

      if (!rawEvents || rawEvents.length === 0) { setLoading(false); return; }

      const results: EventLifecycleData[] = [];

      for (const evt of rawEvents) {
        const hasPhotos = evt.photo_count > 0;

        const { count: viewCount } = await supabase
          .from('event_views')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', evt.id) as any;

        const clientViewed = (viewCount || 0) > 0;

        const { count: favCount } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', evt.id) as any;

        const hasSelections = (favCount || 0) > 0;

        const { data: albums } = await supabase
          .from('albums')
          .select('id, status')
          .eq('event_id', evt.id)
          .eq('user_id', user.id)
          .limit(1) as any;

        const hasAlbum = albums && albums.length > 0;
        const albumComplete = hasAlbum && albums[0].status === 'completed';

        // Determine stages
        const stages: LifecycleStage[] = [
          { label: 'Created', completed: true, current: false },
          { label: 'Uploaded', completed: hasPhotos, current: !hasPhotos },
          { label: 'Shared', completed: evt.is_published && hasPhotos, current: hasPhotos && !evt.is_published },
          { label: 'Viewing', completed: clientViewed, current: evt.is_published && !clientViewed },
          { label: 'Selected', completed: hasSelections, current: clientViewed && !hasSelections },
          { label: 'Building', completed: hasAlbum, current: hasSelections && !hasAlbum },
          { label: 'Complete', completed: albumComplete, current: hasAlbum && !albumComplete },
          { label: 'Delivered', completed: false, current: albumComplete },
        ];

        // Find current stage
        let currentIdx = stages.findIndex(s => s.current);
        if (currentIdx === -1) currentIdx = stages.filter(s => s.completed).length;

        // Reset current flags and set the right one
        stages.forEach((s, i) => { s.current = i === currentIdx; });

        let nextAction = '';
        let nextRoute = `/dashboard/gallery/${evt.id}`;
        if (!hasPhotos) { nextAction = 'Upload photos'; }
        else if (!evt.is_published) { nextAction = 'Publish gallery'; }
        else if (!clientViewed) { nextAction = 'Share with client'; }
        else if (!hasSelections) { nextAction = 'Waiting for selections'; }
        else if (!hasAlbum) { nextAction = 'Build album'; nextRoute = `/dashboard/album-designer?event=${evt.id}`; }
        else if (!albumComplete) { nextAction = 'Finish album'; nextRoute = `/dashboard/album-editor/${albums[0].id}`; }
        else { nextAction = 'Export for delivery'; nextRoute = `/dashboard/album-editor/${albums[0].id}`; }

        results.push({ id: evt.id, name: evt.name, event_date: evt.event_date, stages, nextAction, nextRoute });
      }

      setEvents(results);
      setLoading(false);
    };
    const timer = setTimeout(load, 1000);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading || events.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
        Event Progress
      </h3>
      <div className={isMobile ? 'space-y-3' : 'flex gap-3 overflow-x-auto pb-2'}>
        {events.map(evt => (
          <div
            key={evt.id}
            onClick={() => navigate(evt.nextRoute)}
            className={`cursor-pointer border rounded-xl p-4 hover:shadow-sm transition-all ${isMobile ? 'w-full' : 'min-w-[220px] flex-shrink-0'}`}
            style={{ borderColor: '#E8E0D4', backgroundColor: 'white' }}
          >
            <p className="text-sm font-semibold truncate" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1A1A1A' }}>
              {evt.name}
            </p>
            <p className="text-[10px] mb-3" style={{ color: '#1A1A1A', opacity: 0.5 }}>
              {new Date(evt.event_date).toLocaleDateString()}
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-1 mb-2">
              {evt.stages.map((stage, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`rounded-full flex items-center justify-center ${stage.current ? 'motion-safe:animate-pulse' : ''}`}
                    style={{
                      width: stage.current ? 14 : 10,
                      height: stage.current ? 14 : 10,
                      backgroundColor: stage.completed ? '#C9A96E' : stage.current ? '#C9A96E' : '#D1D5DB',
                    }}
                    title={stage.label}
                  >
                    {stage.completed && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
                  </div>
                  {i < evt.stages.length - 1 && (
                    <div className="w-2 h-px" style={{ backgroundColor: stage.completed ? '#C9A96E' : '#D1D5DB' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Current stage label */}
            <p className="text-[10px]" style={{ color: '#8B7335' }}>
              {evt.nextAction}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('/dashboard/events')}
        className="text-[10px] mt-2 hover:underline"
        style={{ color: '#8B7335' }}
      >
        View All Events →
      </button>
    </div>
  );
}
