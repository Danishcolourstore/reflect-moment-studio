import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Download, Camera, Share2 } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SECTIONS = ['All', 'Highlights', 'Ceremony', 'Reception', 'Candids'] as const;

const ClientEventView = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>('All');

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const { data: client } = await (supabase.from('clients').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (!client) { setLoading(false); return; }
      setClientId(client.id);

      const { data: access } = await (supabase.from('client_events').select('id') as any)
        .eq('client_id', client.id).eq('event_id', id).maybeSingle();
      if (!access) { navigate('/client/events'); return; }

      const { data: evt } = await (supabase.from('events').select('*') as any).eq('id', id).maybeSingle();
      if (!evt) return;
      setEvent(evt);

      const { data: ph } = await (supabase.from('photos').select('id, url, file_name, section, created_at') as any)
        .eq('event_id', id).order('sort_order', { ascending: true });
      if (ph) setPhotos(ph);

      const { data: favs } = await (supabase.from('client_favorites').select('photo_id') as any).eq('client_id', client.id);
      if (favs) setFavoriteIds(new Set(favs.map((f: any) => f.photo_id)));

      setLoading(false);
    };
    load();
  }, [user, id]);

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

  const downloadPhoto = async (photo: any) => {
    if (!clientId) return;
    await supabase.from('client_downloads').insert({ client_id: clientId, photo_id: photo.id } as any);
    try {
      const res = await fetch(photo.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name || 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch {
      toast.error('Download failed');
    }
  };

  const filteredPhotos = useMemo(() => {
    if (activeSection === 'All') return photos;
    return photos.filter(p => p.section === activeSection);
  }, [photos, activeSection]);

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-10">
          <div className="text-center mb-10 space-y-3">
            <Skeleton className="h-10 w-56 mx-auto" style={{ background: '#F5F3F0' }} />
            <Skeleton className="h-4 w-40 mx-auto" style={{ background: '#F5F3F0' }} />
          </div>
          <Skeleton className="w-full aspect-[21/9] mb-3" style={{ background: '#F5F3F0' }} />
          <div className="columns-2 md:columns-3 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="mb-3" style={{ background: '#F5F3F0', height: `${180 + (i % 3) * 60}px` }} />
            ))}
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!event) {
    return (
      <ClientDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: '#CCCCCC', fontStyle: 'italic' }}>
            Event not found
          </p>
        </div>
      </ClientDashboardLayout>
    );
  }

  const coupleName = event.hero_couple_name || event.name;
  const heroPhoto = filteredPhotos[0];

  return (
    <ClientDashboardLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Back */}
        <button
          onClick={() => navigate('/client/events')}
          className="flex items-center gap-1.5 mt-6 mb-2 transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#BBBBBB', letterSpacing: '0.08em' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1A1A1A')}
          onMouseLeave={e => (e.currentTarget.style.color = '#BBBBBB')}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        {/* Event header */}
        <div className="text-center pt-6 pb-8">
          <h1
            className="text-3xl sm:text-4xl mb-2"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 400,
              fontStyle: 'italic',
              color: '#1A1A1A',
              letterSpacing: '0.02em',
            }}
          >
            {coupleName}
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AAAAAA', letterSpacing: '0.1em' }}>
            {format(new Date(event.event_date), 'MMMM d, yyyy')}{event.location ? ` · ${event.location}` : ''}
          </p>
          <p className="mt-1.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#CCCCCC' }}>
            {photos.length} photos
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex justify-center gap-4 sm:gap-6 mb-8" style={{ borderBottom: '1px solid #F0EDE8' }}>
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
                borderBottom: activeSection === section ? '2px solid #1A1A1A' : '2px solid transparent',
                fontWeight: activeSection === section ? 500 : 400,
              }}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Gallery */}
        {filteredPhotos.length === 0 ? (
          <div className="py-20 text-center">
            <Camera className="h-10 w-10 mx-auto mb-4" style={{ color: '#E8E4DD' }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: '#CCCCCC', fontStyle: 'italic' }}>
              No photos in this section
            </p>
          </div>
        ) : (
          <div>
            {/* Hero */}
            {activeSection === 'All' && heroPhoto && (
              <div className="relative mb-3 overflow-hidden group cursor-pointer" onClick={() => setLightboxIdx(0)}>
                <img
                  src={heroPhoto.url}
                  alt=""
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ maxHeight: '60vh' }}
                  loading="eager"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={e => { e.stopPropagation(); toggleFavorite(heroPhoto.id); }}
                    className="p-2.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
                  >
                    <Heart className="h-5 w-5" style={favoriteIds.has(heroPhoto.id) ? { color: '#1A1A1A', fill: '#1A1A1A' } : { color: 'white' }} />
                  </button>
                  {event.downloads_enabled && (
                    <button
                      onClick={e => { e.stopPropagation(); downloadPhoto(heroPhoto); }}
                      className="p-2.5 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)' }}
                    >
                      <Download className="h-5 w-5" style={{ color: 'white' }} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Masonry */}
            <div style={{ columns: 'var(--gallery-cols)', columnGap: 12 }}>
              <style>{`
                :root { --gallery-cols: 2; }
                @media (min-width: 768px) { :root { --gallery-cols: 3; } }
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
                    <img src={photo.url} alt="" className="w-full block transition-transform duration-500 group-hover:scale-[1.02]" loading="lazy" />
                    {/* Heart */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(photo.id); }}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
                    >
                      <Heart className="h-4 w-4" style={isFav ? { color: '#1A1A1A', fill: '#1A1A1A' } : { color: 'rgba(255,255,255,0.9)' }} />
                    </button>
                    {/* Download on hover */}
                    {event.downloads_enabled && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadPhoto(photo); }}
                        className="absolute bottom-3 right-3 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}
                      >
                        <Download className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.9)' }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && filteredPhotos[lightboxIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={() => setLightboxIdx(null)}>
          <img src={filteredPhotos[lightboxIdx].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" loading="lazy" decoding="async" />
          {lightboxIdx > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-4xl transition-colors" onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>‹</button>
          )}
          {lightboxIdx < filteredPhotos.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-4xl transition-colors" onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>›</button>
          )}
          <button className="absolute top-5 right-5 text-white/40 hover:text-white text-xl transition-colors" onClick={() => setLightboxIdx(null)}>×</button>
          <div className="absolute bottom-6 flex gap-3">
            <button
              onClick={e => { e.stopPropagation(); toggleFavorite(filteredPhotos[lightboxIdx!].id); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: favoriteIds.has(filteredPhotos[lightboxIdx!].id) ? '#1A1A1A' : 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
            >
              <Heart className="h-4 w-4" style={favoriteIds.has(filteredPhotos[lightboxIdx!].id) ? { fill: '#1A1A1A', color: '#1A1A1A' } : {}} />
              {favoriteIds.has(filteredPhotos[lightboxIdx!].id) ? 'Saved' : 'Save'}
            </button>
            {event?.downloads_enabled && (
              <button
                onClick={e => { e.stopPropagation(); downloadPhoto(filteredPhotos[lightboxIdx!]); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
              >
                <Download className="h-4 w-4" /> Download
              </button>
            )}
          </div>
        </div>
      )}
    </ClientDashboardLayout>
  );
};

export default ClientEventView;
