import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Heart, Download, Trash2, Share2, Upload, Search, Image as ImageIcon, PackageOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useGuestFavorites } from '@/hooks/use-guest-favorites';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Photo {
  id: string;
  url: string;
  is_favorite: boolean;
  file_name: string | null;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  cover_url: string | null;
  photo_count: number;
  gallery_pin: string | null;
  user_id: string;
}

type GalleryFilter = 'all' | 'favorites';

const EventGallery = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const [downloading, setDownloading] = useState(false);

  const { favoriteCount, toggleFavorite: toggleGuestFavorite, isFavorite } = useGuestFavorites(id);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('events').select('*').eq('id', id).single();
    if (data) setEvent(data as Event);
  }, [id]);

  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('photos').select('*').eq('event_id', id).order('created_at', { ascending: false });
    if (data) setPhotos(data as Photo[]);
  }, [id]);

  useEffect(() => { fetchEvent(); fetchPhotos(); }, [fetchEvent, fetchPhotos]);

  const handleUpload = async (files: FileList) => {
    if (!user || !id) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('gallery-photos').upload(path, file);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
        await supabase.from('photos').insert({ event_id: id, user_id: user.id, url: publicUrl, file_name: file.name });
      }
    }
    const { count } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('event_id', id);
    if (count !== null) {
      await supabase.from('events').update({ photo_count: count }).eq('id', id);
    }
    fetchPhotos();
    fetchEvent();
    setUploading(false);
    toast({ title: 'Photos uploaded' });
  };

  const deletePhoto = async (photo: Photo) => {
    await supabase.from('photos').delete().eq('id', photo.id);
    const { count } = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('event_id', id);
    if (count !== null && id) {
      await supabase.from('events').update({ photo_count: count }).eq('id', id);
    }
    fetchPhotos();
    fetchEvent();
  };

  const downloadFavoritesZip = async () => {
    const favPhotos = photos.filter((p) => isFavorite(p.id));
    if (favPhotos.length === 0) {
      toast({ title: 'No favorites selected' });
      return;
    }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(event?.name ?? 'favorites');
      for (let i = 0; i < favPhotos.length; i++) {
        const p = favPhotos[i];
        const res = await fetch(p.url);
        const blob = await res.blob();
        const ext = p.file_name?.split('.').pop() ?? 'jpg';
        folder?.file(`${p.file_name ?? `photo-${i + 1}`}.${p.file_name ? '' : ext}`.replace(/\.\./g, '.'), blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${event?.name ?? 'favorites'}-favorites.zip`);
      toast({ title: `${favPhotos.length} photos downloaded` });
    } catch {
      toast({ title: 'Download failed', description: 'Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  if (!event) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-[11px] text-muted-foreground/50 uppercase tracking-widest">Loading gallery...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isOwner = user?.id === event.user_id;

  const displayPhotos = filter === 'favorites'
    ? photos.filter((p) => isFavorite(p.id))
    : photos;

  return (
    <DashboardLayout>
      {/* Cover banner */}
      {event.cover_url && (
        <div className="relative -mx-5 -mt-6 mb-5 h-32 sm:h-40 overflow-hidden sm:-mx-8 lg:-mx-10">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 gap-2">
        <div>
          <h1 className="font-serif text-xl sm:text-[22px] font-semibold text-foreground leading-tight">{event.name}</h1>
          <p className="text-[11px] text-muted-foreground/60 tracking-wide mt-0.5">
            {format(new Date(event.event_date), 'MMMM d, yyyy')} · {event.photo_count} photos
          </p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} className="text-gold hover:bg-gold/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
              <Share2 className="mr-1 h-3 w-3" />Share
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground/60 hover:bg-muted text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]">
              <Search className="mr-1 h-3 w-3" />Face Search
            </Button>
          </div>
        )}
      </div>

      {/* Gallery utility bar — filter tabs + download */}
      <div className="flex items-center justify-between mb-4 border-b border-border">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            All Photos
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-3 py-2 text-[11px] uppercase tracking-[0.08em] border-b-2 transition-colors flex items-center gap-1.5 ${
              filter === 'favorites'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            <Heart className="h-3 w-3" />
            Favorites
            {favoriteCount > 0 && (
              <span className="text-[10px] bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-px leading-none">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>

        {favoriteCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadFavoritesZip}
            disabled={downloading}
            className="text-gold hover:bg-gold/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em] mb-px"
          >
            {downloading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <PackageOpen className="mr-1 h-3 w-3" />
            )}
            Download Favorites
          </Button>
        )}
      </div>

      {/* Upload strip */}
      {isOwner && (
        <label className="mb-5 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border py-3 px-5 transition-colors hover:border-gold/50 hover:bg-secondary/30">
          <Upload className="h-3.5 w-3.5 text-muted-foreground/40" />
          <p className="text-[11px] text-muted-foreground/50">{uploading ? 'Uploading...' : 'Drop photos here or click to upload'}</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading} />
        </label>
      )}

      {/* Photo Grid */}
      {displayPhotos.length === 0 ? (
        <div className="py-24 text-center">
          {filter === 'favorites' ? (
            <>
              <Heart className="mx-auto h-8 w-8 text-muted-foreground/12" />
              <p className="mt-2 font-serif text-sm text-muted-foreground/50">No favorites yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground/40">Click the heart icon on any photo to add it here</p>
            </>
          ) : (
            <>
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/12" />
              <p className="mt-2 font-serif text-sm text-muted-foreground/50">No photos yet</p>
            </>
          )}
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-[3px]">
          {displayPhotos.map(photo => {
            const fav = isFavorite(photo.id);
            return (
              <div key={photo.id} className="group relative mb-[3px] break-inside-avoid">
                <img src={photo.url} alt="" className="w-full block" loading="lazy" />

                {/* Persistent heart badge when favorited */}
                {fav && (
                  <button
                    onClick={() => toggleGuestFavorite(photo.id)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-destructive/80 text-destructive-foreground p-1 backdrop-blur-sm transition hover:bg-destructive/90 z-10"
                  >
                    <Heart className="h-3 w-3" fill="currentColor" />
                  </button>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 transition-colors duration-200 group-hover:bg-foreground/15">
                  <div className="absolute bottom-1.5 right-1.5 flex gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {!fav && (
                      <button
                        onClick={() => toggleGuestFavorite(photo.id)}
                        className="rounded-full bg-card/70 text-foreground/80 hover:bg-card/90 backdrop-blur-sm p-1 transition"
                      >
                        <Heart className="h-3 w-3" />
                      </button>
                    )}
                    <a href={photo.url} download className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-foreground/80 hover:bg-card/90 transition">
                      <Download className="h-3 w-3" />
                    </a>
                    {isOwner && (
                      <button onClick={() => deletePhoto(photo)} className="rounded-full bg-card/70 backdrop-blur-sm p-1 text-destructive hover:bg-card/90 transition">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {event && (
        <ShareModal open={shareOpen} onOpenChange={setShareOpen} eventId={event.id} eventName={event.name} pin={event.gallery_pin} />
      )}
    </DashboardLayout>
  );
};

export default EventGallery;
