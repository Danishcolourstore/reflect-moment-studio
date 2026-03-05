import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, MapPin, Calendar, Instagram, Globe, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface StudioData {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  instagram: string | null;
  website: string | null;
  cover_url: string | null;
  username: string | null;
}

interface ProfileData {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
}

interface FeedEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  location: string | null;
  cover_url: string | null;
  photo_count: number;
  gallery_layout: string;
}

interface FeedPhoto {
  id: string;
  url: string;
  event_id: string;
}

const PhotographerFeed = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [studio, setStudio] = useState<StudioData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, FeedPhoto[]>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    (async () => {
      // Find studio by username
      const { data: studioData } = await (supabase
        .from('studio_profiles')
        .select('user_id, display_name, bio, instagram, website, cover_url, username') as any)
        .eq('username', username)
        .maybeSingle();

      if (!studioData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const sd = studioData as unknown as StudioData;
      setStudio(sd);

      // Fetch profile
      const { data: profileData } = await (supabase
        .from('profiles')
        .select('studio_name, studio_logo_url, studio_accent_color') as any)
        .eq('user_id', sd.user_id)
        .maybeSingle();
      if (profileData) setProfile(profileData as unknown as ProfileData);

      // Fetch feed-visible published events
      const { data: eventsData } = await (supabase
        .from('events')
        .select('id, name, slug, event_date, location, cover_url, photo_count, gallery_layout') as any)
        .eq('user_id', sd.user_id)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false });

      const typedEvents = (eventsData || []) as unknown as FeedEvent[];
      setEvents(typedEvents);

      // Fetch 1 cover photo per event for those without cover_url
      const noCover = typedEvents.filter(e => !e.cover_url);
      if (noCover.length > 0) {
        const photos: Record<string, FeedPhoto[]> = {};
        for (const ev of noCover) {
          const { data: p } = await (supabase
            .from('photos')
            .select('id, url, event_id') as any)
            .eq('event_id', ev.id)
            .order('sort_order', { ascending: true, nullsFirst: false })
            .limit(1);
          if (p && p.length > 0) photos[ev.id] = p as unknown as FeedPhoto[];
        }
        setCoverPhotos(photos);
      }

      setLoading(false);
    })();
  }, [username]);

  const accent = profile?.studio_accent_color || '#C6A77B';

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0C0B08' }}>
        <Skeleton className="h-[50vh] w-full rounded-none" />
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (notFound || !studio) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C0B08' }}>
        <div className="text-center">
          <h1 className="text-3xl font-light" style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}>
            Photographer Not Found
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#A6A197' }}>
            This portfolio link doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const studioName = studio.display_name || profile?.studio_name || 'Photographer';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0C0B08', color: '#EDEAE3', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Hero / Header ── */}
      <div className="relative" style={{ minHeight: '50vh' }}>
        {studio.cover_url ? (
          <>
            <img src={studio.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0C0B08 0%, rgba(12,11,8,0.4) 50%, rgba(12,11,8,0.6) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#131109' }} />
        )}

        <div className="relative z-10 flex flex-col items-center justify-end h-full min-h-[50vh] pb-16 px-6 text-center">
          {profile?.studio_logo_url ? (
            <img src={profile.studio_logo_url} alt="" className="h-16 object-contain mb-6 opacity-90" />
          ) : null}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-[0.02em]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {studioName}
          </h1>

          {studio.bio && (
            <p className="mt-4 max-w-lg text-sm leading-relaxed" style={{ color: '#A6A197' }}>
              {studio.bio}
            </p>
          )}

          <div className="flex items-center gap-4 mt-6">
            {studio.instagram && (
              <a href={`https://instagram.com/${studio.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: accent }}>
                <Instagram className="h-4 w-4" /> {studio.instagram}
              </a>
            )}
            {studio.website && (
              <a href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: accent }}>
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Portfolio Label ── */}
      <div className="text-center py-12">
        <div className="w-8 h-[1px] mx-auto mb-4" style={{ backgroundColor: accent }} />
        <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#A6A197' }}>
          Portfolio · {events.length} {events.length === 1 ? 'shoot' : 'shoots'}
        </p>
      </div>

      {/* ── Feed Grid ── */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <Camera className="mx-auto h-10 w-10 mb-4" style={{ color: '#A6A197', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: '#A6A197' }}>No public shoots yet</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {events.map(ev => {
              const coverUrl = ev.cover_url || coverPhotos[ev.id]?.[0]?.url || null;
              const isHovered = hoveredEvent === ev.id;

              return (
                <a
                  key={ev.id}
                  href={`/event/${ev.slug}`}
                  onClick={(e) => { e.preventDefault(); navigate(`/event/${ev.slug}`); }}
                  className="group relative overflow-hidden cursor-pointer block"
                  style={{ borderRadius: '4px' }}
                  onMouseEnter={() => setHoveredEvent(ev.id)}
                  onMouseLeave={() => setHoveredEvent(null)}
                >
                  <div className="aspect-[4/3] overflow-hidden" style={{ backgroundColor: '#17140D' }}>
                    {coverUrl ? (
                      <div className="h-full w-full transition-transform duration-700 ease-out"
                        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}>
                        <ProgressiveImage src={coverUrl} alt={ev.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Camera className="h-8 w-8" style={{ color: '#A6A197', opacity: 0.2 }} />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(to top, rgba(12,11,8,0.85) 0%, rgba(12,11,8,0.1) 50%, transparent 100%)',
                        opacity: isHovered ? 1 : 0.6,
                      }} />
                  </div>

                  {/* Info overlay */}
                  <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-light tracking-wide"
                      style={{ fontFamily: "'Playfair Display', serif", color: '#EDEAE3' }}>
                      {ev.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] tracking-[0.15em] uppercase flex items-center gap-1"
                        style={{ color: '#A6A197' }}>
                        <Calendar className="h-3 w-3" style={{ color: accent }} />
                        {format(new Date(ev.event_date), 'MMM yyyy')}
                      </span>
                      {ev.location && (
                        <span className="text-[10px] tracking-[0.15em] uppercase flex items-center gap-1"
                          style={{ color: '#A6A197' }}>
                          <MapPin className="h-3 w-3" style={{ color: accent }} />
                          {ev.location}
                        </span>
                      )}
                    </div>
                    {ev.photo_count > 0 && (
                      <p className="mt-2 text-[10px] tracking-[0.2em] uppercase" style={{ color: accent, opacity: 0.7 }}>
                        {ev.photo_count} photos
                      </p>
                    )}
                  </div>

                  {/* View arrow on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ExternalLink className="h-4 w-4" style={{ color: accent }} />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="text-center py-12 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: '#A6A197', opacity: 0.4 }}>
          Powered by MirrorAI
        </p>
      </div>
    </div>
  );
};

export default PhotographerFeed;
