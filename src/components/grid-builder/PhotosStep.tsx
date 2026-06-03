import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

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
      onPhotosChange([...photos, ...files]);
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
    <div className="flex flex-col gap-4 pb-24">
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleUpload}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="flex min-h-[110px] flex-col items-center justify-center gap-2 border border-grid-border bg-grid-surface"
        >
          <Upload className="h-[22px] w-[22px] text-[#555555]" strokeWidth={1.5} />
          <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-[#888888]">
            Upload photos
          </span>
          <span className="font-sans text-[10px] text-grid-hint">From your device</span>
        </button>

        <div className="flex min-h-[110px] flex-col items-center justify-center gap-2 border border-grid-border bg-grid-surface p-4">
          <ImageIcon className="h-[22px] w-[22px] text-[#555555]" strokeWidth={1.5} />
          <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-[#888888]">
            From event
          </span>
          <span className="font-sans text-[10px] text-grid-hint">Use gallery photos</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-1 w-full border border-grid-border-muted bg-grid-elevated px-3 py-2 font-sans text-xs text-[#888888]"
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
              className="mt-1 font-sans text-[10px] uppercase tracking-[0.08em] text-grid-gold"
            >
              {loadingEvent ? 'Loading…' : 'Add event photos'}
            </button>
          )}
        </div>
      </div>

      {hasPhotos && (
        <p className="font-sans text-[10px] uppercase tracking-[0.08em] text-grid-muted">
          {photos.length} photo{photos.length === 1 ? '' : 's'} selected
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!hasPhotos}
        className={cn(
          'w-full px-6 py-3.5 font-sans text-[11px] uppercase tracking-[0.12em] transition-colors',
          hasPhotos
            ? 'cursor-pointer bg-grid-ivory text-grid-noir'
            : 'pointer-events-none cursor-not-allowed border border-grid-border bg-grid-surface text-[#333333]',
        )}
      >
        Continue to design
      </button>
    </div>
  );
}
