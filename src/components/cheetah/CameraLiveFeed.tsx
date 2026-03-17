import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Image, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LivePhoto {
  id: string;
  file_name: string;
  url: string;
  status: 'receiving' | 'ready';
  created_at: string;
}

interface Props {
  sessionId: string;
  credentials: { sessionId: string; uploadToken: string; httpEndpoint: string };
}

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
];

export default function CameraLiveFeed({ sessionId, credentials }: Props) {
  const [photos, setPhotos] = useState<LivePhoto[]>([]);
  const [simulating, setSimulating] = useState(false);
  const demoIdx = useRef(0);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`camera-live-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cheetah_photos',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          const p = payload.new;
          setPhotos((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            return [
              { id: p.id, file_name: p.file_name, url: p.original_url || p.thumbnail_url, status: 'receiving', created_at: p.created_at },
              ...prev,
            ];
          });
          setTimeout(() => {
            setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'ready' } : x)));
          }, 800);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Manual file upload from browser
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const { data: { session: authSession } } = await supabase.auth.getSession();

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file, file.name);
      try {
        await fetch(credentials.httpEndpoint, {
          method: 'POST',
          headers: {
            'x-session-id': credentials.sessionId,
            'x-upload-token': credentials.uploadToken,
            Authorization: `Bearer ${authSession?.access_token || ''}`,
          },
          body: formData,
        });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    e.target.value = '';
  }, [credentials]);

  // Simulate shot (test fallback)
  const simulateShot = useCallback(async () => {
    if (simulating) return;
    setSimulating(true);
    try {
      const imgUrl = DEMO_IMAGES[demoIdx.current % DEMO_IMAGES.length];
      demoIdx.current++;
      const resp = await fetch(imgUrl);
      const blob = await resp.blob();
      const formData = new FormData();
      formData.append('file', blob, `test-shot-${Date.now()}.jpg`);
      const { data: { session: authSession } } = await supabase.auth.getSession();
      await fetch(credentials.httpEndpoint, {
        method: 'POST',
        headers: {
          'x-session-id': credentials.sessionId,
          'x-upload-token': credentials.uploadToken,
          Authorization: `Bearer ${authSession?.access_token || ''}`,
        },
        body: formData,
      });
    } catch {
      toast.error('Test shot failed');
    }
    setSimulating(false);
  }, [credentials, simulating]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Live Feed</h4>
          <Badge variant="secondary" className="text-[10px]">{photos.length} photos</Badge>
          {photos.some((p) => p.status === 'receiving') && (
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 animate-pulse border-accent/40 text-accent">
              Receiving…
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            <Button size="sm" variant="outline" className="gap-1.5 text-xs pointer-events-none" asChild>
              <span><Upload className="h-3.5 w-3.5" /> Upload Files</span>
            </Button>
          </label>
          <Button size="sm" variant="ghost" onClick={simulateShot} disabled={simulating} className="gap-1.5 text-xs text-muted-foreground">
            {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Test Shot
          </Button>
        </div>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-12 text-center">
          <Camera className="mx-auto h-8 w-8 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Waiting for photos…</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Upload via camera, cURL, FTP bridge, or use "Test Shot"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={cn(
                'relative rounded-xl overflow-hidden border transition-all',
                photo.status === 'receiving' ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border'
              )}
            >
              <div className="aspect-square bg-muted relative">
                <img
                  src={photo.url}
                  alt={photo.file_name}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-500',
                    photo.status === 'receiving' ? 'opacity-60' : 'opacity-100'
                  )}
                  loading="lazy"
                />
                {photo.status === 'receiving' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      <span className="text-[9px] font-medium text-accent">Receiving…</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 left-1 right-1">
                <p className="text-[8px] text-foreground/70 bg-background/60 backdrop-blur-sm rounded px-1 py-0.5 truncate">
                  {photo.file_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
