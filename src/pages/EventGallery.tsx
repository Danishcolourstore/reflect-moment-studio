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

    // Update photo count
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
      {/* Banner */}
      {event.cover_url && (
        <div className="relative -mx-4 -mt-8 mb-8 h-48 overflow-hidden sm:-mx-6 lg:-mx-8">
          <img src={event.cover_url} alt={event.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">{event.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(event.event_date), 'MMMM d, yyyy')} · {event.photo_count} photos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button variant="outline" onClick={() => setShareOpen(true)} className="text-gold border-gold hover:bg-gold/10">
              <Share2 className="mr-2 h-4 w-4" />Share
            </Button>
          )}
        </div>
      </div>

      {/* Face Search Card */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-medium text-foreground">Find Your Photos Instantly</h3>
            <p className="mt-1 text-xs text-muted-foreground">AI-powered face recognition coming soon</p>
          </div>
          <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">
            <Search className="mr-2 h-4 w-4" />Upload Selfie
          </Button>
        </div>
      </div>

      {/* Upload zone */}
      {isOwner && (
        <label className="mb-8 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gold/40 bg-muted/30 p-8 transition-colors hover:border-gold/70">
          <Upload className="h-8 w-8 text-gold/60 mb-2" />
          <p className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Drag photos here or click to upload'}</p>
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files)} disabled={uploading} />
        </label>
      )}

      {/* Photo Grid — Masonry style */}
      {photos.length === 0 ? (
        <div className="py-16 text-center">
          <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground/20" />
          <p className="mt-4 font-serif text-lg text-muted-foreground">No photos yet</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-1.5">
          {photos.map(photo => (
            <div key={photo.id} className="group relative mb-1.5 break-inside-avoid overflow-hidden">
              <img src={photo.url} alt="" className="w-full" loading="lazy" />
              <div className="absolute inset-0 flex items-end justify-center gap-2 bg-foreground/0 p-2 opacity-0 transition-all group-hover:bg-foreground/30 group-hover:opacity-100">
                <button onClick={() => toggleFavorite(photo)} className={`rounded-full p-2 ${photo.is_favorite ? 'bg-destructive text-destructive-foreground' : 'bg-card/80 text-foreground'}`}>
                  <Heart className="h-4 w-4" fill={photo.is_favorite ? 'currentColor' : 'none'} />
                </button>
                <a href={photo.url} download className="rounded-full bg-card/80 p-2 text-foreground">
                  <Download className="h-4 w-4" />
                </a>
                {isOwner && (
                  <button onClick={() => deletePhoto(photo)} className="rounded-full bg-card/80 p-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
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
