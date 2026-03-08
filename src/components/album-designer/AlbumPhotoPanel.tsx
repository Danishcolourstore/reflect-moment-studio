import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileArchive, Search, Check, Image as ImageIcon, Link2, X, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOptimizedUrl } from '@/lib/image-utils';
import JSZip from 'jszip';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

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
  cover_url: string | null;
}

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp';
const IMAGE_MIME_ACCEPT = 'image/jpeg,image/png,image/webp';
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

export default function AlbumPhotoPanel({ albumId, eventId, onEventLinked, placedPhotoUrls, placedPhotoCounts, onDragStart }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [uploadDone, setUploadDone] = useState(0);
  const [uploadFailed, setUploadFailed] = useState<string[]>([]);
  const [uploadPhase, setUploadPhase] = useState('');

  // Link gallery
  const [linkOpen, setLinkOpen] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const uploadPercent = uploadTotal > 0 ? Math.round((uploadDone / uploadTotal) * 100) : 0;

  // Fetch available events for linking
  const loadEvents = useCallback(async () => {
    if (!user) return;
    setEventsLoading(true);
    const { data } = await supabase.from('events').select('id, name, photo_count, cover_url')
      .eq('user_id', user.id).order('event_date', { ascending: false });
    setEvents((data || []) as EventOption[]);
    setEventsLoading(false);
  }, [user]);

  // Fetch photos: from linked event OR album-specific uploads
  const fetchPhotos = useCallback(async () => {
    if (!user) { setPhotos([]); setLoading(false); return; }
    setLoading(true);

    if (eventId) {
      const { data, error } = await supabase.from('photos').select('id, url, file_name')
        .eq('event_id', eventId).order('sort_order', { ascending: true });
      if (!error) setPhotos(data || []);
      else { console.error('Fetch photos error:', error); setPhotos([]); }
    } else {
      // No event linked — load photos uploaded directly to this album's storage folder
      const folderPath = `${user.id}/${albumId}`;
      const { data: storageFiles, error } = await supabase.storage.from('gallery-photos').list(folderPath, {
        limit: 1000, sortBy: { column: 'created_at', order: 'asc' },
      });
      if (error) {
        console.error('Storage list error:', error);
        setPhotos([]);
      } else if (storageFiles && storageFiles.length > 0) {
        const albumPhotos: Photo[] = storageFiles
          .filter(f => IMAGE_RE.test(f.name))
          .map(f => {
            const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(`${folderPath}/${f.name}`);
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

  // Core upload function
  const uploadFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;
    setUploading(true);
    setUploadTotal(files.length);
    setUploadDone(0);
    setUploadFailed([]);
    setUploadPhase('Uploading');

    let done = 0;
    const failed: string[] = [];
    const BATCH = 3;

    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(async (file) => {
          const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

          if (eventId) {
            const path = `${user.id}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage.from('gallery-photos').upload(path, file, { contentType });
            if (upErr) throw new Error(`Storage: ${upErr.message}`);
            const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
            const { error: insertErr } = await supabase.from('photos').insert({
              event_id: eventId, user_id: user.id, url: publicUrl, file_name: file.name,
            } as any);
            if (insertErr) throw new Error(`DB: ${insertErr.message}`);
          } else {
            const path = `${user.id}/${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage.from('gallery-photos').upload(path, file, { contentType });
            if (upErr) throw new Error(`Storage: ${upErr.message}`);
          }
        }),
      );

      results.forEach((r, idx) => {
        done++;
        if (r.status === 'rejected') {
          failed.push(batch[idx].name);
          console.error('Upload failed:', batch[idx].name, r.reason);
        }
      });
      setUploadDone(done);
      setUploadFailed([...failed]);
    }

    setUploading(false);
    setUploadPhase('');

    if (failed.length === 0) {
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded`);
    } else {
      toast.error(`${failed.length} of ${files.length} failed to upload`);
    }
    fetchPhotos();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => IMAGE_RE.test(f.name));
    if (files.length === 0) {
      toast.error('No supported image files selected');
      return;
    }
    uploadFiles(files);
    e.target.value = '';
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setUploadPhase('Reading ZIP file…');
    setUploadTotal(0);
    setUploadDone(0);
    setUploadFailed([]);

    try {
      const zip = await JSZip.loadAsync(file);
      const imageEntries = Object.values(zip.files).filter(f => {
        if (f.dir) return false;
        const segments = f.name.split('/');
        if (segments.some(s => s.startsWith('.') || s.startsWith('__'))) return false;
        return IMAGE_RE.test(f.name);
      });

      if (imageEntries.length === 0) {
        toast.error('No images found in ZIP (supported: jpg, png, webp)');
        setUploading(false);
        setUploadPhase('');
        return;
      }

      setUploadPhase('Extracting images…');
      const imageFiles: File[] = [];
      for (const entry of imageEntries) {
        const blob = await entry.async('blob');
        const name = entry.name.split('/').pop() || entry.name;
        const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
        const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        imageFiles.push(new File([blob], name, { type }));
      }

      setUploadPhase('Uploading');
      await uploadFiles(imageFiles);
    } catch (err) {
      console.error('ZIP processing error:', err);
      toast.error('Failed to process ZIP file');
      setUploading(false);
      setUploadPhase('');
    }
  };

  const handleLinkEvent = async (selectedEventId: string) => {
    const { error } = await (supabase.from('albums' as any).update({ event_id: selectedEventId } as any).eq('id', albumId) as any);
    if (error) {
      toast.error('Failed to link gallery');
      return;
    }
    onEventLinked(selectedEventId);
    setLinkOpen(false);
    toast.success('Gallery linked! Loading photos…');
  };

  const getPhotoCount = (photo: Photo) => placedPhotoCounts.get(photo.url) || 0;

  const filtered = photos.filter(p => {
    if (filter === 'unused' && placedPhotoUrls.has(p.url)) return false;
    if (search && p.file_name && !p.file_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getThumbnail = (url: string) => getOptimizedUrl(url, 'thumbnail');

  return (
    <div className="w-64 xl:w-72 border-r border-border bg-card flex flex-col shrink-0 h-full overflow-hidden">
      {/* Upload buttons */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-9 min-h-[44px]" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5" /> Photos
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-9 min-h-[44px]" onClick={() => zipRef.current?.click()} disabled={uploading}>
            <FileArchive className="h-3.5 w-3.5" /> ZIP
          </Button>
        </div>

        {/* Link Gallery button */}
        {!eventId && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs gap-1.5 h-9 min-h-[44px] text-muted-foreground hover:text-foreground"
            onClick={() => { setLinkOpen(true); loadEvents(); }}
          >
            <Link2 className="h-3.5 w-3.5" /> Link Existing Gallery
          </Button>
        )}

        {eventId && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1">
            <Link2 className="h-3 w-3" />
            <span>Gallery linked · {photos.length} photos</span>
          </div>
        )}

        <input ref={fileRef} type="file" accept={IMAGE_MIME_ACCEPT} multiple className="sr-only" onChange={handleFileUpload} />
        <input ref={zipRef} type="file" accept=".zip" className="sr-only" onChange={handleZipUpload} />

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-1.5 bg-muted/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
              <span className="text-[11px] text-foreground">
                {uploadPhase === 'Uploading' ? `Uploading ${uploadDone} of ${uploadTotal}…` : uploadPhase}
              </span>
            </div>
            {uploadTotal > 0 && <Progress value={uploadPercent} className="h-1" />}
          </div>
        )}

        {/* Upload results (failed files) */}
        {!uploading && uploadFailed.length > 0 && (
          <div className="bg-destructive/10 rounded-lg px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-destructive font-medium">{uploadFailed.length} failed</span>
              <button onClick={() => setUploadFailed([])} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
            {uploadFailed.slice(0, 5).map(name => (
              <p key={name} className="text-[9px] text-destructive/80 truncate">{name}</p>
            ))}
            {uploadFailed.length > 5 && (
              <p className="text-[9px] text-destructive/60">+{uploadFailed.length - 5} more</p>
            )}
          </div>
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
              className={cn('px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium transition-all cursor-pointer',
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
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center px-4">
            <ImageIcon className="h-8 w-8 mb-3 opacity-30" />
            <span className="text-xs font-medium mb-1">Upload photos to get started</span>
            <span className="text-[10px] opacity-60">
              {eventId ? 'No photos in this gallery yet' : 'Or link an existing gallery'}
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
                  <img
                    src={getThumbnail(photo.url)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      // If optimized URL failed, try original
                      if (target.src !== photo.url) {
                        target.src = photo.url;
                      } else {
                        // Hide broken icon, show grey placeholder
                        target.style.display = 'none';
                        target.parentElement?.classList.add('bg-muted');
                      }
                    }}
                  />
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

      {/* Link Gallery Modal */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Link Existing Gallery</DialogTitle>
          </DialogHeader>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No galleries found. Create an event first.</p>
          ) : (
            <div className="space-y-2">
              {events.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => handleLinkEvent(ev.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer text-left"
                >
                  <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0">
                    {ev.cover_url ? (
                      <img src={ev.cover_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ev.name}</p>
                    <p className="text-[11px] text-muted-foreground">{ev.photo_count} photos</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
