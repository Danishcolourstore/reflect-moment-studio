import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Camera } from 'lucide-react';

const WidgetPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const theme = searchParams.get('theme') || 'light';
  const showCount = searchParams.get('showCount') !== 'false';
  const showDate = searchParams.get('showDate') !== 'false';

  const [event, setEvent] = useState<any>(null);
  const [studio, setStudio] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await (supabase.from('events').select('*') as any).eq('slug', slug).eq('is_published', true).maybeSingle();
      if (data) {
        setEvent(data);
        const { data: p } = await (supabase.from('profiles').select('studio_name, studio_logo_url') as any).eq('user_id', data.user_id).maybeSingle();
        if (p) setStudio(p);
      }
    })();
  }, [slug]);

  if (!event) return <div className="flex items-center justify-center h-screen bg-background"><Camera className="h-8 w-8 text-muted-foreground/20 skeleton-block" /></div>;

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';

  return (
    <div className={`${bg} h-screen overflow-hidden flex flex-col`} style={{ fontFamily: "'Cormorant Garamond', serif" }}>
      <div className="aspect-[3/2] overflow-hidden shrink-0">
        {event.cover_url ? (
          <img src={event.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Camera className="h-10 w-10 opacity-20" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        {studio?.studio_logo_url && (
          <div className="flex items-center gap-2 mb-2">
            <img src={studio.studio_logo_url} alt="" className="h-6 object-contain" />
            <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{studio.studio_name}</span>
          </div>
        )}
        <h1 className="text-lg font-bold leading-tight">{event.name}</h1>
        {showDate && <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.event_date}</p>}
        {showCount && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{event.photo_count} photos</p>}
        <a href={`${window.location.origin}/event/${slug}/gallery`} target="_blank" rel="noopener noreferrer"
          className="mt-auto block w-full text-center py-2 rounded-lg text-sm font-medium bg-[hsl(29,42%,59%)] text-white">
          View Gallery
        </a>
      </div>
    </div>
  );
};

export default WidgetPage;
