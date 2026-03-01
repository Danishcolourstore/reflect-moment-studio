import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Image, Globe } from 'lucide-react';
import { format } from 'date-fns';

interface StudioProfile {
  display_name: string | null;
  username: string;
  bio: string | null;
  website: string | null;
  instagram: string | null;
  cover_url: string | null;
  user_id: string;
}

interface PortfolioEvent {
  id: string;
  name: string;
  event_date: string;
  cover_url: string | null;
  slug: string;
}

const StudioPortfolioPage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    const fetch = async () => {
      const { data } = await (supabase
        .from('studio_profiles' as any)
        .select('*') as any)
        .eq('username', username)
        .maybeSingle();

      if (!data) { setNotFound(true); setLoading(false); return; }

      const p = data as any as StudioProfile;
      setProfile(p);
      document.title = `${p.display_name || username} — MirrorAI`;

      const { data: evts } = await (supabase
        .from('events')
        .select('id, name, event_date, cover_url, slug') as any)
        .eq('user_id', p.user_id)
        .eq('is_published', true)
        .order('event_date', { ascending: false });

      if (evts) setEvents(evts as PortfolioEvent[]);
      setLoading(false);
    };
    fetch();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground/50 text-sm">Loading...</p></div>;
  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="font-serif text-3xl font-semibold text-foreground mb-2">Studio not found</h1>
      <p className="text-[12px] text-muted-foreground/50">This studio page doesn't exist.</p>
    </div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background page-fade-in">
      {profile.cover_url && (
        <div className="h-[40vh] overflow-hidden relative">
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover ken-burns" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      <div className="max-w-4xl mx-auto px-6 py-10 text-center">
        <h1 className="font-display italic text-3xl font-medium text-foreground">{profile.display_name || username}</h1>
        {profile.bio && <p className="mt-3 text-[13px] text-muted-foreground/70 max-w-lg mx-auto">{profile.bio}</p>}
        <div className="flex items-center justify-center gap-4 mt-4">
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary text-[11px] flex items-center gap-1 hover:underline">
              <Globe className="h-3 w-3" /> Website
            </a>
          )}
          {profile.instagram && (
            <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-primary text-[11px] hover:underline">
              @{profile.instagram}
            </a>
          )}
        </div>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {events.map(e => (
            <a key={e.id} href={`/event/${e.slug}`} className="group">
              <div className="aspect-square overflow-hidden bg-secondary relative">
                {e.cover_url ? (
                  <img src={e.cover_url} alt={e.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Image className="h-8 w-8 text-muted-foreground/15" /></div>
                )}
              </div>
              <p className="font-serif text-[13px] font-medium text-foreground mt-1.5 truncate">{e.name}</p>
              <p className="text-[10px] text-muted-foreground/50">{format(new Date(e.event_date), 'MMM yyyy')}</p>
            </a>
          ))}
        </div>
        {events.length === 0 && (
          <div className="py-20 text-center">
            <Image className="mx-auto h-10 w-10 text-muted-foreground/15" />
            <p className="mt-3 font-serif text-sm text-muted-foreground/50">No published events yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudioPortfolioPage;
