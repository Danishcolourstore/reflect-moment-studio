import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Image, Upload, Star, AlertTriangle, Eye, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LivePhoto {
  id: string;
  file_name: string;
  url: string;
  status: 'receiving' | 'ready';
  ai_status: string;
  ai_score: number | null;
  cull_status: string;
  sharpness: number | null;
  eyes_open: boolean | null;
  exposure: string | null;
  ai_recommendation: string | null;
  created_at: string;
}

type FilterMode = 'all' | 'best' | 'good' | 'reject';

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

function CullBadge({ cullStatus, aiScore, aiStatus }: { cullStatus: string; aiScore: number | null; aiStatus: string }) {
  if (aiStatus === 'pending' || aiStatus === 'processing') {
    return (
      <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-muted/80 backdrop-blur-sm text-muted-foreground">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Analyzing…
      </span>
    );
  }

  if (aiStatus === 'failed') {
    return (
      <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-muted/80 backdrop-blur-sm text-muted-foreground">
        <AlertTriangle className="h-2.5 w-2.5" />
      </span>
    );
  }

  if (cullStatus === 'pick') {
    return (
      <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 backdrop-blur-sm text-green-400 border border-green-500/30">
        <Star className="h-2.5 w-2.5 fill-current" />
        Best {aiScore !== null && <span className="ml-0.5 opacity-70">{aiScore}</span>}
      </span>
    );
  }

  if (cullStatus === 'reject') {
    return (
      <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 backdrop-blur-sm text-red-400 border border-red-500/30">
        <AlertTriangle className="h-2.5 w-2.5" />
        Reject {aiScore !== null && <span className="ml-0.5 opacity-70">{aiScore}</span>}
      </span>
    );
  }

  // Good / unreviewed with score
  if (aiScore !== null) {
    return (
      <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 backdrop-blur-sm text-yellow-400 border border-yellow-500/30">
        <Eye className="h-2.5 w-2.5" />
        Good {aiScore}
      </span>
    );
  }

  return null;
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-muted-foreground w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[8px] font-mono text-muted-foreground w-5 text-right">{value}</span>
    </div>
  );
}

export default function CameraLiveFeed({ sessionId, credentials }: Props) {
  const [photos, setPhotos] = useState<LivePhoto[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const demoIdx = useRef(0);

  // Realtime: INSERT + UPDATE
  useEffect(() => {
    const channel = supabase
      .channel(`camera-live-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cheetah_photos', filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          const p = payload.new;
          setPhotos((prev) => {
            if (prev.some((x) => x.id === p.id)) return prev;
            return [
              {
                id: p.id,
                file_name: p.file_name,
                url: p.original_url || p.thumbnail_url,
                status: 'receiving',
                ai_status: p.ai_status || 'pending',
                ai_score: p.ai_score,
                cull_status: p.cull_status || 'unreviewed',
                sharpness: p.sharpness,
                eyes_open: p.eyes_open,
                exposure: p.exposure,
                ai_recommendation: p.ai_recommendation,
                created_at: p.created_at,
              },
              ...prev,
            ];
          });
          setTimeout(() => {
            setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: 'ready' } : x)));
          }, 800);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cheetah_photos', filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          const p = payload.new;
          setPhotos((prev) =>
            prev.map((x) =>
              x.id === p.id
                ? {
                    ...x,
                    ai_status: p.ai_status,
                    ai_score: p.ai_score,
                    cull_status: p.cull_status,
                    sharpness: p.sharpness,
                    eyes_open: p.eyes_open,
                    exposure: p.exposure,
                    ai_recommendation: p.ai_recommendation,
                  }
                : x
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Browser file upload
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

  // Test shot
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

  // Filter logic
  const filtered = photos.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'best') return p.cull_status === 'pick';
    if (filter === 'reject') return p.cull_status === 'reject';
    if (filter === 'good') return p.ai_status === 'completed' && p.cull_status !== 'pick' && p.cull_status !== 'reject';
    return true;
  });

  const counts = {
    all: photos.length,
    best: photos.filter((p) => p.cull_status === 'pick').length,
    good: photos.filter((p) => p.ai_status === 'completed' && p.cull_status !== 'pick' && p.cull_status !== 'reject').length,
    reject: photos.filter((p) => p.cull_status === 'reject').length,
    analyzing: photos.filter((p) => p.ai_status === 'pending' || p.ai_status === 'processing').length,
  };

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Live Feed</h4>
          {counts.analyzing > 0 && (
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 animate-pulse border-accent/40 text-accent">
              <Loader2 className="h-2.5 w-2.5 animate-spin mr-1" />
              {counts.analyzing} analyzing
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            <Button size="sm" variant="outline" className="gap-1.5 text-xs pointer-events-none" asChild>
              <span><Upload className="h-3.5 w-3.5" /> Upload</span>
            </Button>
          </label>
          <Button size="sm" variant="ghost" onClick={simulateShot} disabled={simulating} className="gap-1.5 text-xs text-muted-foreground">
            {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Test Shot
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {([
          { key: 'all' as const, label: 'All', count: counts.all, color: '' },
          { key: 'best' as const, label: '⭐ Best', count: counts.best, color: 'data-[active=true]:bg-green-500/20 data-[active=true]:text-green-400 data-[active=true]:border-green-500/30' },
          { key: 'good' as const, label: '👍 Good', count: counts.good, color: 'data-[active=true]:bg-yellow-500/20 data-[active=true]:text-yellow-400 data-[active=true]:border-yellow-500/30' },
          { key: 'reject' as const, label: '⚠️ Reject', count: counts.reject, color: 'data-[active=true]:bg-red-500/20 data-[active=true]:text-red-400 data-[active=true]:border-red-500/30' },
        ]).map((f) => (
          <button
            key={f.key}
            data-active={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'text-[10px] px-2.5 py-1 rounded-full border transition-all',
              filter === f.key
                ? 'border-primary/40 bg-primary/10 text-foreground font-semibold'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
              f.color
            )}
          >
            {f.label} <span className="ml-0.5 opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-12 text-center">
          <Camera className="mx-auto h-8 w-8 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">
            {photos.length === 0 ? 'Waiting for photos…' : 'No photos match this filter'}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {photos.length === 0 && 'Upload via camera, cURL, FTP bridge, or use "Test Shot"'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className={cn(
                'relative rounded-xl overflow-hidden border transition-all group',
                photo.status === 'receiving'
                  ? 'border-accent/50 ring-1 ring-accent/20'
                  : photo.cull_status === 'pick'
                  ? 'border-green-500/30'
                  : photo.cull_status === 'reject'
                  ? 'border-red-500/20 opacity-60'
                  : 'border-border'
              )}
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
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

                {/* Receiving overlay */}
                {photo.status === 'receiving' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin text-accent" />
                      <span className="text-[9px] font-medium text-accent">Receiving…</span>
                    </div>
                  </div>
                )}

                {/* AI Badge - top left */}
                <div className="absolute top-1 left-1">
                  <CullBadge cullStatus={photo.cull_status} aiScore={photo.ai_score} aiStatus={photo.ai_status} />
                </div>

                {/* Hover detail card */}
                {hoveredId === photo.id && photo.ai_status === 'completed' && (
                  <div className="absolute inset-x-0 bottom-0 bg-background/90 backdrop-blur-md p-2 space-y-1 transition-all">
                    <ScoreBar label="Sharp" value={photo.sharpness} />
                    <ScoreBar label="Comp" value={photo.ai_score} />
                    <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                      {photo.exposure && <span>📊 {photo.exposure}</span>}
                      {photo.eyes_open !== null && <span>{photo.eyes_open ? '👁️ Open' : '😑 Closed'}</span>}
                    </div>
                    {photo.ai_recommendation && (
                      <p className="text-[8px] text-muted-foreground/80 truncate">{photo.ai_recommendation}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Filename */}
              <div className="absolute bottom-1 left-1 right-1">
                {hoveredId !== photo.id && (
                  <p className="text-[8px] text-foreground/70 bg-background/60 backdrop-blur-sm rounded px-1 py-0.5 truncate">
                    {photo.file_name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
