import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileArchive, Search, Check, Image as ImageIcon, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import browserImageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
}

interface Props {
  albumId: string;
  eventId: string | null;
  onEventLinked: (eventId: string) => void;
  placedPhotoUrls: Set<string>;
  placedPhotoCounts: Map<string, number>;
  onDragStart: (photo: Photo) => void;
}

type Filter = 'all' | 'unused';

interface EventOption {
  id: string;
  name: string;
  photo_count: number;
}

export default function AlbumPhotoPanel({ albumId, eventId, onEventLinked, placedPhotoUrls, placedPhotoCounts, onDragStart }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [events, setEvents] = useState<EventOption[]>([]);
  const [showLinkGallery, setShowLinkGallery] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  // Fetch available events for linking
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('events').select('id, name, photo_count')
        .eq('user_id', user.id).order('event_date', { ascending: false });
      setEvents((data || []) as EventOption[]);
    })();
  }, [user]);

  // Fetch photos: from linked event OR album-specific uploads
  const fetchPhotos = useCallback(async () => {
    if (!user) { setPhotos([]); setLoading(false); return; }
    setLoading(true);

    if (eventId) {
      // Load photos from the linked event
      const { data, error } = await supabase.from('photos').select('id, url, file_name')
        .eq('event_id', eventId).order('sort_order', { ascending: true });
      if (!error) setPhotos(data || []);
    } else {
      // No event linked — load photos uploaded directly to this album's storage folder
      const { data: storageFiles } = await supabase.storage.from('gallery-photos').list(`album-${albumId}`, {
        limit: 1000, sortBy: { column: 'created_at', order: 'asc' },
      });
      if (storageFiles && storageFiles.length > 0) {
        const albumPhotos: Photo[] = storageFiles
          .filter(f => /\.(jpe?g|png|webp)$/i.test(f.name))
          .map(f => {
            const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(`album-${albumId}/${f.name}`);
            return { id: f.id || f.name, url: publicUrl, file_name: f.name };
          });
        setPhotos(albumPhotos);
      } else {
        setPhotos([]);
      }
    }
    setLoading(false);
  }, [eventId, albumId, user]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  // Upload files — to event if linked, or to album-specific storage folder
  const uploadFiles = async (files: File[]) => {
    if (!user) return;
    setUploading(true);
    let done = 0;
    for (const file of files) {
      setUploadProgress(`Uploading ${++done} of ${files.length}…`);
      try {
        const compressed = await browserImageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 4096, useWebWorker: true });
        
        if (eventId) {
          // Upload to event folder and save photo record
          const path = `${eventId}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from('gallery-photos').upload(path, compressed);
          if (upErr) throw upErr;
          const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
          await supabase.from('photos').insert({ event_id: eventId, user_id: user.id, url: publicUrl, file_name: file.name } as any);
        } else {
          // Upload to album-specific folder (no event linked)
          const path = `album-${albumId}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from('gallery-photos').upload(path, compressed);
          if (upErr) throw upErr;
        }
      } catch (e) { console.error('Upload failed:', file.name, e); }
    }
    setUploading(false);
    setUploadProgress('');
    toast.success(`${done} photos uploaded`);
    fetchPhotos();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => /\.(jpe?g|png|webp)$/i.test(f.name));
    if (files.length) uploadFiles(files);
    e.target.value = '';
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    setUploadProgress('Extracting ZIP…');
    try {
      const zip = await JSZip.loadAsync(file);
      const imageFiles: File[] = [];
      const entries = Object.values(zip.files).filter(f => !f.dir && /\.(jpe?g|png|webp)$/i.test(f.name));
      for (const entry of entries) {
        const blob = await entry.async('blob');
        imageFiles.push(new File([blob], entry.name.split('/').pop() || entry.name, { type: blob.type || 'image/jpeg' }));
      }
      if (imageFiles.length === 0) { toast.error('No images found in ZIP'); setUploading(false); return; }
      await uploadFiles(imageFiles);
    } catch (err) {
      toast.error('Failed to process ZIP');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleLinkEvent = async (selectedEventId: string) => {
    // Save event_id to album
    await (supabase.from('albums' as any).update({ event_id: selectedEventId } as any).eq('id', albumId) as any);
    onEventLinked(selectedEventId);
    setShowLinkGallery(false);
    toast.success('Gallery linked! Photos loading…');
  };

  const getPhotoCount = (photo: Photo) => placedPhotoCounts.get(photo.url) || 0;

  const filtered = photos.filter(p => {
    if (filter === 'unused' && placedPhotoUrls.has(p.url)) return false;
    if (search && p.file_name && !p.file_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getThumbnail = (url: string) => {
    if (url.includes('supabase')) return url + '?width=300&quality=60';
    return url;
  };

  return (
    <div className="w-64 xl:w-72 border-r border-border bg-card flex flex-col shrink-0 h-full overflow-hidden">
      {/* Upload buttons */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5" /> Photos
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8" onClick={() => zipRef.current?.click()} disabled={uploading}>
            <FileArchive className="h-3.5 w-3.5" /> ZIP
          </Button>
        </div>

        {/* Link Gallery button */}
        {!eventId && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowLinkGallery(!showLinkGallery)}
          >
            <Link2 className="h-3.5 w-3.5" /> Link Existing Gallery
          </Button>
        )}

        {showLinkGallery && !eventId && (
          <Select onValueChange={handleLinkEvent}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select a gallery…" />
            </SelectTrigger>
            <SelectContent>
              {events.map(ev => (
                <SelectItem key={ev.id} value={ev.id} className="text-xs">
                  {ev.name} ({ev.photo_count} photos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {eventId && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
            <Link2 className="h-3 w-3" />
            <span>Gallery linked • {photos.length} photos</span>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={handleFileUpload} />
        <input ref={zipRef} type="file" accept=".zip" className="sr-only" onChange={handleZipUpload} />
        {uploading && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{uploadProgress}</div>
        )}
      </div>

      {/* Search + filter */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
        </div>
        <div className="flex gap-1">
          {(['all', 'unused'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium transition-all',
                filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{filtered.length}</span>
        </div>
      </div>

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center px-4">
            <ImageIcon className="h-8 w-8 mb-3 opacity-30" />
            <span className="text-xs font-medium mb-1">Upload photos to get started</span>
            <span className="text-[10px] opacity-60">
              {eventId ? 'No photos in this gallery yet' : 'Or link an existing gallery below'}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {filtered.map(photo => {
              const count = getPhotoCount(photo);
              return (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/album-photo', JSON.stringify(photo));
                    onDragStart(photo);
                  }}
                  className="relative aspect-square rounded-md overflow-hidden cursor-grab active:cursor-grabbing group border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <img src={getThumbnail(photo.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {count > 0 && (
                    <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                      {count === 1 ? (
                        <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </span>
                      ) : (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                          {count}×
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
