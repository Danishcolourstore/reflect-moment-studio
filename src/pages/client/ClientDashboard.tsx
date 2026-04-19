import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Heart, Share2 } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const SECTIONS = ['All', 'Highlights', 'Ceremony', 'Reception', 'Candids'] as const;

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('All');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Determine couple name and event info from first event
  const primaryEvent = events[0] || null;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: client } = await (supabase.from('clients').select('id, name') as any)
        .eq('user_id', user.id).maybeSingle();
      if (!client) { setLoading(false); return; }
      setClientId(client.id);
      setClientName(client.name || '');

      // Get assigned events
      const { data: access } = await (supabase.from('client_events').select('event_id') as any)
        .eq('client_id', client.id);
      if (access && access.length > 0) {
        const eventIds = access.map((a: any) => a.event_id);
        const { data: evts } = await (supabase.from('events').select('id, name, slug, event_date, location, cover_url, photo_count, hero_couple_name') as any)
          .in('id', eventIds).order('event_date', { ascending: false });
        if (evts) {
          setEvents(evts);
          // Load photos from all events
          let allPhotos: any[] = [];
          for (const evt of evts) {
            const { data: ph } = await (supabase.from('photos').select('id, url, file_name, section, created_at') as any)
              .eq('event_id', evt.id).order('sort_order', { ascending: true }).limit(200);
            if (ph) allPhotos = allPhotos.concat(ph.map((p: any) => ({ ...p, event_id: evt.id })));
          }
          setPhotos(allPhotos);
        }
      }

      // Favorites
      const { data: favs } = await (supabase.from('client_favorites').select('photo_id') as any).eq('client_id', client.id);
      if (favs) setFavoriteIds(new Set(favs.map((f: any) => f.photo_id)));

      setLoading(false);
    };
    load();
  }, [user]);

  const toggleFavorite = async (photoId: string) => {
    if (!clientId) return;
    const isFav = favoriteIds.has(photoId);
    if (isFav) {
      await (supabase.from('client_favorites').delete() as any).eq('client_id', clientId).eq('photo_id', photoId);
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(photoId); return n; });
    } else {
      await supabase.from('client_favorites').insert({ client_id: clientId, photo_id: photoId } as any);
      setFavoriteIds(prev => new Set(prev).add(photoId));
    }
  };

  const filteredPhotos = useMemo(() => {
    if (activeSection === 'All') return photos;
    return photos.filter(p => p.section === activeSection);
  }, [photos, activeSection]);

  const coupleName = primaryEvent?.hero_couple_name || clientName || '';
  const eventDate = primaryEvent?.event_date ? format(new Date(primaryEvent.event_date), 'MMMM d, yyyy') : '';
  const eventLocation = primaryEvent?.location || '';
  const photoCount = photos.length;
  const heroPhoto = photos[0];

  // Loading skeleton
  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-12">
          {/* Header skeleton */}
          <div className="text-center mb-12 space-y-4">
            <Skeleton className="h-10 w-64 mx-auto" style={{ background: '#F5F3F0' }} />
            <Skeleton className="h-4 w-48 mx-auto" style={{ background: '#F5F3F0' }} />
          </div>
          {/* Tabs skeleton */}
          <div className="flex justify-center gap-6 mb-10">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 w-16" style={{ background: '#F5F3F0' }} />)}
          </div>
          {/* Hero skeleton */}
          <Skeleton className="w-full aspect-[21/9] mb-3" style={{ background: '#F5F3F0' }} />
          {/* Grid skeleton */}
          <div className="columns-2 md:columns-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="mb-3" style={{ background: '#F5F3F0', height: `${200 + (i % 3) * 80}px` }} />
            ))}
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <Camera className="h-12 w-12 mb-6" style={{ color: '#E0DCD5' }} />
          <h1
            className="text-3xl mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1A1A1A', fontWeight: 400, fontStyle: 'italic' }}
          >
            Your gallery awaits
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#AAAAAA' }}>
            Your photographer will share your photos here
          </p>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Couple header */}
        <div className="text-center pt-10 sm:pt-14 pb-8 sm:pb-10">
          {coupleName && (
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl mb-3"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#1A1A1A',
                lineHeight: 1.2,
                letterSpacing: '0.02em',
              }}
            >
              {coupleName}
            </h1>
          )}
          {(eventDate || eventLocation) && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AAAAAA', letterSpacing: '0.1em' }}>
              {eventDate}{eventDate && eventLocation ? ' · ' : ''}{eventLocation}
            </p>
          )}
          {photoCount > 0 && (
            <p className="mt-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#CCCCCC' }}>
              {photoCount} photos
            </p>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 overflow-x-auto" style={{ borderBottom: '1px solid #F0EDE8' }}>
          {SECTIONS.map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className="pb-3 transition-all duration-200 whitespace-nowrap"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: activeSection === section ? '#1A1A1A' : '#BBBBBB',
                borderBottom: activeSection === section ? '2px solid #B8953F' : '2px solid transparent',
                fontWeight: activeSection === section ? 500 : 400,
              }}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Gallery grid */}
        {filteredPhotos.length === 0 ? (
          <div className="py-20 text-center">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: '#CCCCCC', fontStyle: 'italic' }}>
              No photos in this section
            </p>
          </div>
        ) : (
          <div>
            {/* Hero image — first photo spans full width */}
            {activeSection === 'All' && heroPhoto && (
              <div
                className="relative mb-3 overflow-hidden group cursor-pointer"
                onClick={() => setLightboxIdx(0)}
              >
                <img
                  src={heroPhoto.url}
                  alt=""
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ maxHeight: '65vh' }}
                  loading="eager"
                />
                {/* Favorite on hover */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(heroPhoto.id); }}
                  className="absolute top-4 right-4 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
                >
                  <Heart
                    className="h-5 w-5 transition-all"
                    style={favoriteIds.has(heroPhoto.id)
                      ? { color: '#B8953F', fill: '#B8953F' }
                      : { color: 'white' }
                    }
                  />
                </button>
              </div>
            )}

            {/* Masonry grid */}
            <div
              className="gap-3"
              style={{
                columns: 'var(--gallery-cols)',
                columnGap: 12,
              }}
            >
              <style>{`
                :root {
                  --gallery-cols: 2;
                }
                @media (min-width: 768px) {
                  :root { --gallery-cols: 3; }
                }
              `}</style>
              {(activeSection === 'All' ? filteredPhotos.slice(1) : filteredPhotos).map((photo, idx) => {
                const realIdx = activeSection === 'All' ? idx + 1 : idx;
                const isFav = favoriteIds.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    className="relative break-inside-avoid mb-3 group cursor-pointer overflow-hidden"
                    onClick={() => setLightboxIdx(realIdx)}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full block transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    {/* Heart on hover */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(photo.id); }}
                      className="absolute top-3 right-3 p-2 rounded-full transition-all duration-300"
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(8px)',
                        opacity: isFav ? 1 : undefined,
                      }}
                      // Show on hover via group, always show if favorited
                      {...(!isFav && { className: "absolute top-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300", style: { background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' } })}
                    >
                      <Heart
                        className="h-4 w-4 transition-all"
                        style={isFav
                          ? { color: '#B8953F', fill: '#B8953F' }
                          : { color: 'rgba(255,255,255,0.9)' }
                        }
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && filteredPhotos[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={filteredPhotos[lightboxIdx].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          {/* Nav */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-4xl transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              ‹
            </button>
          )}
          {lightboxIdx < filteredPhotos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-4xl transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              ›
            </button>
          )}
          {/* Close */}
          <button
            className="absolute top-5 right-5 text-white/40 hover:text-white text-xl transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            ×
          </button>
          {/* Bottom actions */}
          <div className="absolute bottom-6 flex gap-3">
            <button
              onClick={e => { e.stopPropagation(); toggleFavorite(filteredPhotos[lightboxIdx!].id); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                color: favoriteIds.has(filteredPhotos[lightboxIdx!].id) ? '#B8953F' : 'rgba(255,255,255,0.7)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
              }}
            >
              <Heart
                className="h-4 w-4"
                style={favoriteIds.has(filteredPhotos[lightboxIdx!].id) ? { fill: '#B8953F', color: '#B8953F' } : {}}
              />
              {favoriteIds.has(filteredPhotos[lightboxIdx!].id) ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </ClientDashboardLayout>
  );
};

export default ClientDashboard;
