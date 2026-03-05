import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProgressiveImage } from '@/components/ProgressiveImage';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Instagram, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface StudioData {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  instagram: string | null;
  website: string | null;
  cover_url: string | null;
  username: string | null;
  whatsapp: string | null;
}

interface ProfileData {
  studio_name: string;
  studio_logo_url: string | null;
  studio_accent_color: string | null;
  email: string | null;
  mobile: string | null;
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

  useEffect(() => {
    if (!username) return;
    (async () => {
      const { data: studioData } = await (supabase
        .from('studio_profiles')
        .select('user_id, display_name, bio, instagram, website, cover_url, username, whatsapp') as any)
        .eq('username', username)
        .maybeSingle();

      if (!studioData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const sd = studioData as unknown as StudioData;
      setStudio(sd);

      const { data: profileData } = await (supabase
        .from('profiles')
        .select('studio_name, studio_logo_url, studio_accent_color, email, mobile') as any)
        .eq('user_id', sd.user_id)
        .maybeSingle();
      if (profileData) setProfile(profileData as unknown as ProfileData);

      const { data: eventsData } = await (supabase
        .from('events')
        .select('id, name, slug, event_date, location, cover_url, photo_count, gallery_layout') as any)
        .eq('user_id', sd.user_id)
        .eq('is_published', true)
        .eq('feed_visible', true)
        .order('event_date', { ascending: false });

      const typedEvents = (eventsData || []) as unknown as FeedEvent[];
      setEvents(typedEvents);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Skeleton className="h-[70vh] w-full rounded-none" />
        <div className="max-w-6xl mx-auto px-6 py-16">
          <Skeleton className="h-6 w-48 mx-auto mb-4" />
          <Skeleton className="h-20 w-full max-w-lg mx-auto" />
        </div>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-3 gap-1">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-none" />)}
        </div>
      </div>
    );
  }

  if (notFound || !studio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Photographer Not Found
          </h1>
          <p className="mt-3 text-sm text-neutral-500">This portfolio link doesn't exist.</p>
        </div>
      </div>
    );
  }

  const studioName = studio.display_name || profile?.studio_name || 'Photographer';

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-8">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80 cursor-pointer hover:text-white transition-colors">
            Home
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80 cursor-pointer hover:text-white transition-colors">
            About
          </span>
        </div>

        {/* Center logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {profile?.studio_logo_url ? (
            <img src={profile.studio_logo_url} alt="" className="h-10 object-contain invert brightness-200" />
          ) : (
            <span className="text-white text-sm tracking-[0.15em] uppercase font-light"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px' }}>
              {studioName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-8">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80 cursor-pointer hover:text-white transition-colors">
            Work
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/80 cursor-pointer hover:text-white transition-colors">
            Contact
          </span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-[75vh] sm:h-[85vh] overflow-hidden">
        {studio.cover_url ? (
          <>
            <img src={studio.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-900" />
        )}
      </section>

      {/* ── About / Bio ── */}
      <section className="bg-white py-20 sm:py-28 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-lg sm:text-xl font-normal text-neutral-800 mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Hi, I'm {studioName.split(' ')[0]}.
          </h2>
          {studio.bio && (
            <p className="text-[13px] sm:text-[14px] leading-[1.9] text-neutral-600 mb-8"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {studio.bio}
            </p>
          )}
          <p className="text-[14px] italic text-neutral-700"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Enjoy!
          </p>
        </div>
      </section>

      {/* ── Portfolio Feed Heading ── */}
      {events.length > 0 && (
        <div className="bg-white pb-4 pt-2 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-white font-medium"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#1a1a1a',
            }}>
            Photographer Feed
          </p>
        </div>
      )}

      {/* ── Portfolio Grid ── */}
      {events.length > 0 && (
        <section className="bg-white pb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2px]">
            {events.map(ev => {
              const coverUrl = ev.cover_url || coverPhotos[ev.id]?.[0]?.url || null;

              return (
                <a
                  key={ev.id}
                  href={`/event/${ev.slug}`}
                  onClick={(e) => { e.preventDefault(); navigate(`/event/${ev.slug}`); }}
                  className="group relative block overflow-hidden cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                    {coverUrl ? (
                      <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
                        <ProgressiveImage src={coverUrl} alt={ev.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-full w-full bg-neutral-200" />
                    )}

                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                      <div className="w-14 h-14 rounded-full border-2 border-white/80 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white/90 ml-0.5" fill="white" fillOpacity={0.9} />
                      </div>
                    </div>

                    {/* Shoot title at bottom-left */}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <p className="text-[11px] tracking-[0.15em] text-white/90 lowercase italic"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '13px' }}>
                        {ev.name.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <section className="bg-white py-20 text-center">
          <p className="text-sm text-neutral-400">No public shoots yet.</p>
        </section>
      )}

      {/* ── Contact / Studio Info ── */}
      <section className="bg-white py-20 sm:py-28 px-6">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-[11px] tracking-[0.3em] uppercase text-neutral-800 mb-10 font-medium"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Contact Us
          </h3>

          <div className="space-y-5 text-[13px] text-neutral-500" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {/* Studio / Photographer Name */}
            <p className="text-neutral-700 text-[15px]">{studioName}</p>

            {profile?.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center justify-center gap-2 hover:text-neutral-800 transition-colors">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile.email}</span>
              </a>
            )}

            {profile?.mobile && (
              <a href={`tel:${profile.mobile}`} className="flex items-center justify-center gap-2 hover:text-neutral-800 transition-colors">
                <Phone className="h-3.5 w-3.5" />
                <span>{profile.mobile}</span>
              </a>
            )}

            {studio.instagram && (
              <a
                href={`https://instagram.com/${studio.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 hover:text-neutral-800 transition-colors"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span>{studio.instagram}</span>
              </a>
            )}

            {studio.website && (
              <a
                href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 hover:text-neutral-800 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1a1a1a] py-12 px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/70 mb-4">
          © {studioName} {new Date().getFullYear()} | All Rights Reserved
        </p>
        <div className="flex items-center justify-center gap-5">
          {studio.instagram && (
            <a href={`https://instagram.com/${studio.instagram.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/80 transition-colors">
              <Instagram className="h-3.5 w-3.5" />
            </a>
          )}
          {studio.website && (
            <a href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
              target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/80 transition-colors">
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <p className="text-[8px] tracking-[0.2em] uppercase text-white/25 mt-6">
          Powered by MirrorAI
        </p>
      </footer>
    </div>
  );
};

export default PhotographerFeed;
