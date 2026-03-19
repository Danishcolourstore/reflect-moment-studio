import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Download, Camera } from 'lucide-react';
import { ClientDashboardLayout } from '@/components/ClientDashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const { data: client } = await (supabase.from('clients').select('id') as any).eq('user_id', user.id).maybeSingle();
      if (!client) { setLoading(false); return; }
      setClientId(client.id);

      // Verify access
      const { data: access } = await (supabase.from('client_events').select('id') as any)
        .eq('client_id', client.id).eq('event_id', id).maybeSingle();
      if (!access) { navigate('/client/events'); return; }

      // Load event
      const { data: evt } = await (supabase.from('events').select('*') as any).eq('id', id).single();
      if (evt) setEvent(evt);

      // Load photos
      const { data: ph } = await (supabase.from('photos').select('id, url, file_name, file_size') as any)
        .eq('event_id', id).order('sort_order', { ascending: true });
      if (ph) setPhotos(ph);

      // Load favorites
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
    // Log download
    await supabase.from('client_downloads').insert({ client_id: clientId, photo_id: photo.id } as any);
    // Trigger download
    const a = document.createElement('a');
    a.href = photo.url;
    a.download = photo.file_name || 'photo.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started');
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96" />
      </ClientDashboardLayout>
    );
  }

  if (!event) {
    return (
      <ClientDashboardLayout>
        <p className="text-muted-foreground">Event not found.</p>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout>
      <button onClick={() => navigate('/client/events')} className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Events
      </button>

      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">{event.name}</h1>
        <p className="text-[12px] text-muted-foreground mt-1">
          {format(new Date(event.event_date), 'MMMM d, yyyy')}{event.location ? ` · ${event.location}` : ''}
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="border border-dashed border-border/60 py-20 text-center rounded-xl">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground/15" />
          <p className="mt-4 font-serif text-sm text-muted-foreground/60">No photos yet</p>
        </div>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-4">{photos.length} photos · {favoriteIds.size} favorited</p>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="relative group break-inside-avoid">
                <img
                  src={photo.url}
                  alt={photo.file_name || ''}
                  className="w-full rounded-lg cursor-pointer"
                  loading="lazy"
                  onClick={() => setLightboxIdx(idx)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1.5">
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}>
                      <Heart className={`h-4 w-4 ${favoriteIds.has(photo.id) ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                    </Button>
                    {event.downloads_enabled && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 bg-card/90 backdrop-blur-sm hover:bg-card"
                        onClick={(e) => { e.stopPropagation(); downloadPhoto(photo); }}>
                        <Download className="h-4 w-4 text-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                {favoriteIds.has(photo.id) && (
                  <div className="absolute top-2 right-2">
                    <Heart className="h-4 w-4 fill-destructive text-destructive" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Simple lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <img src={photos[lightboxIdx].url} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
          <div className="absolute bottom-6 flex gap-3">
            <Button size="sm" variant="ghost" className="bg-card/20 text-white hover:bg-card/40"
              onClick={(e) => { e.stopPropagation(); toggleFavorite(photos[lightboxIdx!].id); }}>
              <Heart className={`h-4 w-4 mr-1 ${favoriteIds.has(photos[lightboxIdx!].id) ? 'fill-destructive text-destructive' : ''}`} />
              {favoriteIds.has(photos[lightboxIdx!].id) ? 'Unfavorite' : 'Favorite'}
            </Button>
            {event.downloads_enabled && (
              <Button size="sm" variant="ghost" className="bg-card/20 text-white hover:bg-card/40"
                onClick={(e) => { e.stopPropagation(); downloadPhoto(photos[lightboxIdx!]); }}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            )}
          </div>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl" onClick={() => setLightboxIdx(null)}>×</button>
          {lightboxIdx > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}>‹</button>
          )}
          {lightboxIdx < photos.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}>›</button>
          )}
        </div>
      )}
    </ClientDashboardLayout>
  );
};

export default ClientEventView;
