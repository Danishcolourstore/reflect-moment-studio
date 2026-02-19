import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ShareModal } from '@/components/ShareModal';
import { Button } from '@/components/ui/button';
import { Heart, Download, Trash2, Share2, Upload, Search, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

const EventGallery = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const toggleFavorite = async (photo: Photo) => {
    await supabase.from('photos').update({ is_favorite: !photo.is_favorite }).eq('id', photo.id);
    fetchPhotos();
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

  if (!event) return <DashboardLayout><p className="text-muted-foreground">Loading...</p></DashboardLayout>;

  const isOwner = user?.id === event.user_id;

  return (
    <DashboardLayout>
      {/* Minimal banner — Pic-Time style thin strip */}
      {event.cover_url && (
        <div className="relative -mx-4 -mt-8 mb-6 h-36 sm:h-44 overflow-hidden sm:-mx-6 lg:-mx-8">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        </div>
      )}

      {/* Header — clean, minimal chrome */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground leading-tight">{event.name}</h1>
          <p className="mt-0.5 text-[12px] text-muted-foreground tracking-wide">
            {format(new Date(event.event_date), 'MMMM d, yyyy')} · {event.photo_count} photos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} className="text-gold hover:bg-gold/10 text-xs h-8">
                <Share2 className="mr-1.5 h-3.5 w-3.5" />Share
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted text-xs h-8">
                <Search className="mr-1.5 h-3.5 w-3.5" />Face Search
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Upload zone — compact */}
      {isOwner && (
        <label className="mb-6 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 bg-transparent py-4 px-6 transition-colors hover:border-gold/60 hover:bg-muted/20">
          <Upload className="h-4 w-4 text-gold/50" />
          <p className="text-xs text-muted-foreground">{uploading ? 'Uploading...' : 'Drop photos here or click to upload'}</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading} />
        </label>
      )}

      {/* Photo Grid — tight justified masonry, no borders, no rounded corners */}
      {photos.length === 0 ? (
        <div className="py-20 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-3 font-serif text-base text-muted-foreground">No photos yet</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-1">
          {photos.map(photo => (
            <div key={photo.id} className="group relative mb-1 break-inside-avoid">
              <img src={photo.url} alt="" className="w-full block" loading="lazy" />
              {/* Minimal hover — small icons bottom-right, Pixieset style */}
              <div className="absolute inset-0 bg-foreground/0 transition-colors duration-200 group-hover:bg-foreground/20">
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button onClick={() => toggleFavorite(photo)} className={`rounded-full p-1.5 backdrop-blur-sm ${photo.is_favorite ? 'bg-destructive/90 text-destructive-foreground' : 'bg-card/80 text-foreground'}`}>
                    <Heart className="h-3.5 w-3.5" fill={photo.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  <a href={photo.url} download className="rounded-full bg-card/80 backdrop-blur-sm p-1.5 text-foreground">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {isOwner && (
                    <button onClick={() => deletePhoto(photo)} className="rounded-full bg-card/80 backdrop-blur-sm p-1.5 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {event && (
        <ShareModal open={shareOpen} onOpenChange={setShareOpen} eventId={event.id} eventName={event.name} pin={event.gallery_pin} />
      )}
    </DashboardLayout>
  );
};

export default EventGallery;
