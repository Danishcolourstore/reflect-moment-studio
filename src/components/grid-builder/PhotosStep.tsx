import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 30;

interface EventOption {
  id: string;
  title: string;
}

interface Props {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  onContinue: () => void;
}

async function urlToFile(url: string, name: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

export default function PhotosStep({ photos, onPhotosChange, onContinue }: Props) {
  const { user } = useAuth();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const previews = useMemo(() => {
    return photos.map((file) => URL.createObjectURL(file));
  }, [photos]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase.from('events').select('id, name') as any)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setEvents((data || []).map((e: any) => ({ id: e.id, title: e.name || 'Untitled event' })));
    })();
  }, [user]);

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_PHOTOS} photos per grid`);
        return;
      }
      const next = files.slice(0, remaining);
      if (next.length < files.length) {
        toast.message(`Only ${next.length} photos added (${MAX_PHOTOS} max)`);
      }
      onPhotosChange([...photos, ...next]);
    },
    [onPhotosChange, photos],
  );

  const removePhoto = useCallback(
    (index: number) => {
      onPhotosChange(photos.filter((_, i) => i !== index));
    },
    [onPhotosChange, photos],
  );

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files || []));
      e.target.value = '';
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/'),
      );
      addFiles(files);
    },
    [addFiles],
  );

  const handleEventPhotos = useCallback(async () => {
    if (!selectedEventId || !user) return;
    setLoadingEvent(true);
    try {
      const { data } = await (supabase.from('photos').select('url, filename') as any)
        .eq('event_id', selectedEventId)
        .order('created_at', { ascending: false })
        .limit(20);
      const files: File[] = [];
      for (const [i, row] of (data || []).entries()) {
        const file = await urlToFile(row.url, row.filename || `event-photo-${i}.jpg`);
        if (file) files.push(file);
      }
      addFiles(files);
    } finally {
      setLoadingEvent(false);
    }
  }, [addFiles, selectedEventId, user]);

  const hasPhotos = photos.length > 0;

  return (
    <div
      className="flex flex-col gap-4 pb-24"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleUpload}
      />

      {/* Source cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className={cn(
            'group relative flex min-h-[120px] flex-col items-center justify-center gap-2.5 border bg-grid-surface transition-all duration-200',
            isDragging
              ? 'border-grid-gold bg-grid-gold/5'
              : 'border-grid-border hover:border-[#444444] hover:bg-[#111111]',
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-200',
              isDragging
                ? 'border-grid-gold/50 bg-grid-gold/10'
                : 'border-[#333333] bg-[#1a1a1a] group-hover:border-[#444444]',
            )}
          >
            <Upload
              className={cn(
                'h-4 w-4 transition-colors',
                isDragging ? 'text-grid-gold' : 'text-[#666666] group-hover:text-[#888888]',
              )}
              strokeWidth={1.5}
            />
          </div>
          <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-[#888888]">
            Upload photos
          </span>
          <span className="font-sans text-[10px] text-grid-hint">
            {isDragging ? 'Drop to add' : 'Drag & drop or click'}
          </span>
        </button>

        <div className="group flex min-h-[120px] flex-col items-center justify-center gap-2.5 border border-grid-border bg-grid-surface p-4 transition-colors hover:border-[#444444] hover:bg-[#111111]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333333] bg-[#1a1a1a] transition-colors group-hover:border-[#444444]">
            <ImageIcon className="h-4 w-4 text-[#666666] group-hover:text-[#888888]" strokeWidth={1.5} />
          </div>
          <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-[#888888]">
            From event
          </span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-1 w-full border border-grid-border-muted bg-grid-elevated px-3 py-2 font-sans text-xs text-[#888888] transition-colors focus:border-grid-gold focus:outline-none"
          >
            <option value="">Select an event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          {selectedEventId && (
            <button
              type="button"
              onClick={handleEventPhotos}
              disabled={loadingEvent}
              className="mt-1 font-sans text-[10px] uppercase tracking-[0.08em] text-grid-gold transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {loadingEvent ? 'Loading…' : 'Add event photos'}
            </button>
          )}
        </div>
      </div>

      {/* Photo thumbnails */}
      {hasPhotos && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-grid-muted">
              {photos.length} photo{photos.length === 1 ? '' : 's'} selected
            </p>
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                className="flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.08em] text-grid-gold transition-opacity hover:opacity-80"
              >
                <Plus className="h-3 w-3" />
                Add more
              </button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {previews.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden bg-[#111111]">
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute inset-0 border border-white/0 transition-colors group-hover:border-white/20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue button */}
      <button
        type="button"
        onClick={onContinue}
        disabled={!hasPhotos}
        className={cn(
          'w-full px-6 py-3.5 font-sans text-[11px] uppercase tracking-[0.12em] transition-all duration-200',
          hasPhotos
            ? 'cursor-pointer bg-grid-ivory text-grid-noir hover:bg-white active:scale-[0.99]'
            : 'pointer-events-none cursor-not-allowed border border-grid-border bg-grid-surface text-[#333333]',
        )}
      >
        Continue to design
      </button>
    </div>
  );
}
