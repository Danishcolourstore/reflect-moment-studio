import { useEffect, useState, useCallback } from 'react';
import { Heart, Download, Loader2, PackageOpen, CheckSquare, Square, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface FavoritedPhoto {
  id: string;
  url: string;
  file_name: string | null;
  fav_count: number;
}

interface GuestFavoritesTabProps {
  eventId: string;
  eventName: string;
}

export function GuestFavoritesTab({ eventId, eventName }: GuestFavoritesTabProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<FavoritedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const fetchFavoritedPhotos = useCallback(async () => {
    setLoading(true);
    try {
      // Query favorites with a join to photos to get photo data in one query
      const { data: favRows, error } = await supabase
        .from('favorites')
        .select('photo_id, photos(id, url, file_name)')
        .eq('event_id', eventId);

      if (error) {
        console.error('Favorites query error:', error);
        setPhotos([]);
        setLoading(false);
        return;
      }

      if (!favRows || favRows.length === 0) {
        setPhotos([]);
        setLoading(false);
        return;
      }

      // Count favorites per photo
      const countMap = new Map<string, number>();
      const photoMap = new Map<string, { id: string; url: string; file_name: string | null }>();

      for (const row of favRows as any[]) {
        const photoId = row.photo_id;
        countMap.set(photoId, (countMap.get(photoId) ?? 0) + 1);
        if (row.photos && !photoMap.has(photoId)) {
          photoMap.set(photoId, {
            id: row.photos.id,
            url: row.photos.url,
            file_name: row.photos.file_name,
          });
        }
      }

      const mapped: FavoritedPhoto[] = [];
      for (const [photoId, count] of countMap) {
        const photo = photoMap.get(photoId);
        if (photo) {
          mapped.push({ ...photo, fav_count: count });
        }
      }

      // Sort by most favorited first
      mapped.sort((a, b) => b.fav_count - a.fav_count);
      setPhotos(mapped);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      setPhotos([]);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { fetchFavoritedPhotos(); }, [fetchFavoritedPhotos]);

  const allSelected = photos.length > 0 && selected.size === photos.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const downloadSinglePhoto = async (photo: FavoritedPhoto) => {
    try {
      const { data: signed } = await supabase.storage.from('gallery-photos').createSignedUrl(photo.url, 60);
      if (!signed?.signedUrl) { toast({ title: 'Download failed' }); return; }
      const res = await fetch(signed.signedUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = photo.file_name ?? 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const downloadSelectedAsZip = async () => {
    const selectedPhotos = photos.filter(p => selected.has(p.id));
    if (selectedPhotos.length === 0) {
      toast({ title: 'No photos selected' });
      return;
    }
    setDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`${eventName} - Guest Favorites`);
      for (let i = 0; i < selectedPhotos.length; i++) {
        setDownloadProgress(`${i + 1} / ${selectedPhotos.length}`);
        const p = selectedPhotos[i];
        const { data: signed } = await supabase.storage.from('gallery-photos').createSignedUrl(p.url, 120);
        if (!signed?.signedUrl) continue;
        const res = await fetch(signed.signedUrl);
        const blob = await res.blob();
        folder?.file(p.file_name ?? `photo-${i + 1}.jpg`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${eventName} - Guest Favorites.zip`);
      toast({ title: `${selectedPhotos.length} photos downloaded` });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    } finally {
      setDownloading(false);
      setDownloadProgress('');
    }
  };

  const downloadAllFavorites = async () => {
    if (photos.length === 0) return;
    setSelected(new Set(photos.map(p => p.id)));
    // Small delay so state updates before triggering
    setTimeout(() => {
      const doDownload = async () => {
        setDownloading(true);
        try {
          const zip = new JSZip();
          const folder = zip.folder(`${eventName} - Guest Favorites`);
          for (let i = 0; i < photos.length; i++) {
            setDownloadProgress(`${i + 1} / ${photos.length}`);
            const p = photos[i];
            const { data: signed } = await supabase.storage.from('gallery-photos').createSignedUrl(p.url, 120);
            if (!signed?.signedUrl) continue;
            const res = await fetch(signed.signedUrl);
            const blob = await res.blob();
            folder?.file(p.file_name ?? `photo-${i + 1}.jpg`, blob);
          }
          const content = await zip.generateAsync({ type: 'blob' });
          saveAs(content, `${eventName} - Guest Favorites.zip`);
          toast({ title: `${photos.length} photos downloaded` });
        } catch {
          toast({ title: 'Download failed', variant: 'destructive' });
        } finally {
          setDownloading(false);
          setDownloadProgress('');
        }
      };
      doDownload();
    }, 0);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="border border-dashed border-border/60 py-20 text-center">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground/15" />
        <p className="mt-4 font-serif text-sm text-muted-foreground/60">
          No client selections yet
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/40">
          Share the selection link with your client to start collecting picks.
        </p>
      </div>
    );
  }

  const exportList = () => {
    const filenames = photos.map(p => p.file_name ?? p.id).join('\n');
    const blob = new Blob([`Client Selections — ${eventName}\n${'─'.repeat(40)}\n${photos.length} photos selected\n\n${filenames}`], { type: 'text/plain' });
    saveAs(blob, `${eventName} - Selections.txt`);
    toast({ title: 'List exported' });
  };

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-3 mb-4 text-[12px] text-muted-foreground/70">
        <span className="font-medium text-foreground">{photos.length} photos selected</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-[0.06em]"
          >
            {allSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selected.size > 0 && (
            <span className="text-[10px] text-muted-foreground/50">{selected.size} selected</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              onClick={downloadSelectedAsZip}
              disabled={downloading}
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]"
            >
              {downloading ? (
                <><Loader2 className="mr-1 h-3 w-3 animate-spin" />{downloadProgress}</>
              ) : (
                <><PackageOpen className="mr-1 h-3 w-3" />Download Selected ({selected.size})</>
              )}
            </Button>
          )}
          <Button
            onClick={downloadAllFavorites}
            disabled={downloading}
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]"
          >
            <PackageOpen className="mr-1 h-3 w-3" />Download All
          </Button>
          <Button
            onClick={exportList}
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 text-[10px] h-7 px-2.5 uppercase tracking-[0.06em]"
          >
            <FileText className="mr-1 h-3 w-3" />Export List
          </Button>
        </div>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[3px]">
        {photos.map(photo => {
          const isSelected = selected.has(photo.id);
          return (
            <div key={photo.id} className="group relative aspect-square overflow-hidden bg-secondary cursor-pointer"
              onClick={() => toggleSelect(photo.id)}>
              <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />

              {/* Selection overlay */}
              <div className={`absolute inset-0 transition-colors duration-150 ${isSelected ? 'bg-primary/20 ring-2 ring-inset ring-primary' : 'group-hover:bg-foreground/10'}`} />

              {/* Checkbox */}
              <div className="absolute top-1.5 left-1.5 z-10">
                <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(photo.id)}
                  className="h-4 w-4 bg-card/70 backdrop-blur-sm border-border" />
              </div>

              {/* Heart count badge */}
              <Badge variant="secondary"
                className="absolute top-1.5 right-1.5 z-10 bg-card/80 backdrop-blur-sm text-foreground border-0 gap-1 px-1.5 py-0.5 text-[10px]">
                <Heart className="h-2.5 w-2.5 text-primary" fill="hsl(var(--primary))" />
                {photo.fav_count}
              </Badge>

              {/* Download button on hover */}
              <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadSinglePhoto(photo); }}
                  className="rounded-full bg-card/70 backdrop-blur-sm p-1.5 text-foreground/80 hover:bg-card/90 transition"
                >
                  <Download className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
