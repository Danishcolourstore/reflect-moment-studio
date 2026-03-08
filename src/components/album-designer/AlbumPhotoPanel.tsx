import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileArchive, Search, Check, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import browserImageCompression from 'browser-image-compression';
import JSZip from 'jszip';

interface Photo {
  id: string;
  url: string;
  file_name: string | null;
}

interface Props {
  eventId: string | null;
  placedPhotoUrls: Set<string>;
  placedPhotoCounts: Map<string, number>;
  onDragStart: (photo: Photo) => void;
}

type Filter = 'all' | 'unused' | 'favorites';

export default function AlbumPhotoPanel({ eventId, placedPhotoUrls, placedPhotoCounts, onDragStart }: Props) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    if (!eventId) { setPhotos([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('photos').select('id, url, file_name')
      .eq('event_id', eventId).order('sort_order', { ascending: true });
    if (!error) setPhotos(data || []);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const uploadFiles = async (files: File[]) => {
    if (!user || !eventId) return;
    setUploading(true);
    let done = 0;
    for (const file of files) {
      setUploadProgress(`Uploading ${++done} of ${files.length}…`);
      try {
        const compressed = await browserImageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 4096, useWebWorker: true });
        const path = `${eventId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('gallery-photos').upload(path, compressed);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from('gallery-photos').getPublicUrl(path);
        await supabase.from('photos').insert({ event_id: eventId, user_id: user.id, url: publicUrl, file_name: file.name } as any);
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

  // Match photos by URL since we track by URL in cells
  const isPhotoPlaced = (photo: Photo) => placedPhotoUrls.has(photo.url);
  const getPhotoCount = (photo: Photo) => placedPhotoCounts.get(photo.url) || 0;

  const filtered = photos.filter(p => {
    if (filter === 'unused' && isPhotoPlaced(p)) return false;
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
          {(['all', 'unused', 'favorites'] as Filter[]).map(f => (
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
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
            <span className="text-xs">{eventId ? 'No photos found' : 'No event linked'}</span>
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
