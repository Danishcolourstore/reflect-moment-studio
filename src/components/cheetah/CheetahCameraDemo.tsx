import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Camera, Copy, Check, Zap, Radio, Image, Loader2, Plus, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DemoPhoto {
  id: string;
  file_name: string;
  url: string;
  status: 'receiving' | 'ready';
  created_at: string;
}

interface CameraCredentials {
  host: string;
  port: string;
  username: string;
  password: string;
  sessionId: string;
  uploadToken: string;
  httpEndpoint: string;
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <code className="text-xs text-foreground font-mono truncate flex-1">{value}</code>
          <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo images for simulate shot
const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
];

export default function CheetahCameraDemo() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<CameraCredentials | null>(null);
  const [photos, setPhotos] = useState<DemoPhoto[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const demoIndexRef = useRef(0);

  // Generate credentials = create a cheetah session
  const initDemo = useCallback(async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const { data: session, error } = await (supabase.from('cheetah_sessions').insert({
        user_id: user.id,
        title: `Camera Demo — ${new Date().toLocaleTimeString()}`,
        status: 'active',
        total_photos: 0,
      }) as any).select('id').single();

      if (error || !session) throw error || new Error('Failed');

      const token = generateToken();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      setSessionId(session.id);
      setCredentials({
        host: `${projectId}.supabase.co`,
        port: '443',
        username: `demo-${user.id.slice(0, 8)}`,
        password: token,
        sessionId: session.id,
        uploadToken: token,
        httpEndpoint: `https://${projectId}.supabase.co/functions/v1/cheetah-camera-upload`,
      });
      setPhotos([]);
      toast.success('Demo session created');
    } catch (err) {
      toast.error('Failed to create session');
    }
    setIsCreating(false);
  }, [user]);

  // Subscribe to realtime photo inserts
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`camera-demo-${sessionId}`)
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
              {
                id: p.id,
                file_name: p.file_name,
                url: p.original_url || p.thumbnail_url,
                status: 'receiving',
                created_at: p.created_at,
              },
              ...prev,
            ];
          });
          // Transition to ready after brief delay
          setTimeout(() => {
            setPhotos((prev) =>
              prev.map((x) => (x.id === p.id ? { ...x, status: 'ready' } : x))
            );
          }, 800);
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // Simulate a camera shot (uploads a demo image via the edge function)
  const simulateShot = useCallback(async () => {
    if (!credentials || simulating) return;
    setSimulating(true);
    try {
      const imgUrl = DEMO_IMAGES[demoIndexRef.current % DEMO_IMAGES.length];
      demoIndexRef.current++;

      // Fetch the image as blob
      const resp = await fetch(imgUrl);
      const blob = await resp.blob();

      const formData = new FormData();
      formData.append('file', blob, `camera-shot-${Date.now()}.jpg`);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session: authSession } } = await supabase.auth.getSession();

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/cheetah-camera-upload`,
        {
          method: 'POST',
          headers: {
            'x-session-id': credentials.sessionId,
            'x-upload-token': credentials.uploadToken,
            Authorization: `Bearer ${authSession?.access_token || ''}`,
          },
          body: formData,
        }
      );
    } catch (err) {
      console.error('Simulate shot failed:', err);
      toast.error('Simulate failed — check connection');
    }
    setSimulating(false);
  }, [credentials, simulating]);

  if (!credentials) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Camera className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Camera Upload Demo</h3>
        <p className="text-xs text-muted-foreground max-w-xs mb-5">
          Connect your camera and see photos appear instantly in Mirror AI. Perfect for live events.
        </p>
        <Button onClick={initDemo} disabled={isCreating} className="gap-2">
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Start Demo Session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Demo Mode Banner */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-accent" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Camera Connected</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-accent/40 text-accent">
                Demo Mode
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Use JPEG for fastest performance · Uploads may be temporary</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold font-serif text-foreground">{photos.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Images Received</p>
          </div>
          <Button size="sm" onClick={simulateShot} disabled={simulating} className="gap-1.5 text-xs">
            {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Simulate Shot
          </Button>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { step: 1, title: 'Copy Credentials', desc: 'Copy the connection details below' },
          { step: 2, title: 'Add to Camera', desc: 'Enter in your camera\'s FTP/WiFi settings' },
          { step: 3, title: 'Start Shooting', desc: 'Photos appear here instantly' },
        ].map((s) => (
          <div key={s.step} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{s.step}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{s.title}</p>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Credentials Panel */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Connection Details</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CopyField label="Host" value={credentials.host} />
          <CopyField label="Port" value={credentials.port} />
          <CopyField label="Username" value={credentials.username} />
          <CopyField label="Password" value={credentials.password} />
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">HTTP Upload Endpoint (for scripts)</p>
          <CopyField label="Endpoint" value={credentials.httpEndpoint} />
          <div className="mt-2 bg-muted/30 rounded-lg p-3">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">cURL Example</p>
            <code className="text-[10px] text-foreground/80 font-mono leading-relaxed block whitespace-pre-wrap break-all">
{`curl -X POST "${credentials.httpEndpoint}" \\
  -H "x-session-id: ${credentials.sessionId}" \\
  -H "x-upload-token: ${credentials.uploadToken}" \\
  -F "file=@photo.jpg"`}
            </code>
          </div>
        </div>
      </div>

      {/* Live Photo Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Live Feed</h4>
            {photos.some((p) => p.status === 'receiving') && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 animate-pulse border-accent/40 text-accent">
                Receiving…
              </Badge>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl py-12 text-center">
            <Camera className="mx-auto h-8 w-8 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Waiting for photos…</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Click "Simulate Shot" or upload via the endpoint
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  'relative rounded-xl overflow-hidden border transition-all',
                  photo.status === 'receiving'
                    ? 'border-accent/50 ring-1 ring-accent/20'
                    : 'border-border'
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

      {/* Warning note */}
      <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 pt-2">
        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
        <span>
          Demo mode — photos are uploaded to temporary storage and may be cleared periodically.
          For production use, connect via the standard Cheetah ingest pipeline.
        </span>
      </div>
    </div>
  );
}
