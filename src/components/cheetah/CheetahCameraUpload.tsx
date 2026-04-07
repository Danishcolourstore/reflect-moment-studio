import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Camera, Copy, Check, Zap, Radio, Image, Loader2, AlertTriangle, Server, Terminal, Upload, Wifi,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CameraLiveFeed from './CameraLiveFeed';
import FtpBridgeGuide from './FtpBridgeGuide';

interface CameraCredentials {
  sessionId: string;
  uploadToken: string;
  httpEndpoint: string;
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function CheetahCameraUpload() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<CameraCredentials | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const { data: session, error } = await (supabase.from('cheetah_sessions').insert({
        user_id: user.id,
        title: `Camera Session — ${new Date().toLocaleTimeString()}`,
        status: 'active',
        total_photos: 0,
      }) as any).select('id').single();

      if (error || !session) throw error || new Error('Failed');

      const token = generateToken();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      setSessionId(session.id);
      setCredentials({
        sessionId: session.id,
        uploadToken: token,
        httpEndpoint: `https://${projectId}.supabase.co/functions/v1/cheetah-camera-upload`,
      });
      toast.success('Session ready');
    } catch {
      toast.error('Could not create session');
    }
    setIsCreating(false);
  }, [user]);

  if (!credentials) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Camera className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Camera Upload</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-5">
          Connect your camera directly to Mirror AI. Photos will appear in real-time as you shoot.
          Supports Canon, Sony, Nikon WiFi/FTP transfer and any HTTP-capable device.
        </p>
        <Button onClick={initSession} disabled={isCreating} className="gap-2">
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Start Camera Session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Session Active Banner */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-5 w-5 text-accent" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">Session Active</span>
            <p className="text-[10px] text-muted-foreground">Listening for camera uploads</p>
          </div>
        </div>
      </div>

      {/* Tabs: Setup / Live Feed */}
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="gap-1.5 text-xs">
            <Wifi className="h-3.5 w-3.5" /> HTTP Direct
          </TabsTrigger>
          <TabsTrigger value="ftp" className="gap-1.5 text-xs">
            <Server className="h-3.5 w-3.5" /> FTP Bridge
          </TabsTrigger>
          <TabsTrigger value="feed" className="gap-1.5 text-xs">
            <Image className="h-3.5 w-3.5" /> Live Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-4">
          <HttpSetupPanel credentials={credentials} />
        </TabsContent>

        <TabsContent value="ftp" className="mt-4">
          <FtpBridgeGuide credentials={credentials} />
        </TabsContent>

        <TabsContent value="feed" className="mt-4">
          <CameraLiveFeed sessionId={sessionId!} credentials={credentials} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── HTTP Direct Setup ── */
function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <code className="text-xs text-foreground font-mono truncate flex-1">{value}</code>
        <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function HttpSetupPanel({ credentials }: { credentials: CameraCredentials }) {
  return (
    <div className="space-y-4">
      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { step: 1, title: 'Copy endpoint', desc: 'Copy the HTTP upload URL below' },
          { step: 2, title: 'Configure camera', desc: 'Set up WiFi transfer or use the cURL command' },
          { step: 3, title: 'Start shooting', desc: 'Photos appear in Live Feed instantly' },
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

      {/* Credentials */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">HTTP Upload Endpoint</h4>
        </div>
        <CopyField label="Endpoint URL" value={credentials.httpEndpoint} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CopyField label="Session ID" value={credentials.sessionId} />
          <CopyField label="Upload Token" value={credentials.uploadToken} />
        </div>

        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">cURL — Upload a photo</p>
          <code className="text-[10px] text-foreground/80 font-mono leading-relaxed block whitespace-pre-wrap break-all">
{`curl -X POST "${credentials.httpEndpoint}" \\
  -H "x-session-id: ${credentials.sessionId}" \\
  -H "x-upload-token: ${credentials.uploadToken}" \\
  -F "file=@/path/to/photo.jpg"`}
          </code>
        </div>
      </div>

      {/* Camera compatibility */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Compatible Cameras</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-muted-foreground">
          {[
            'Canon EOS R5/R6 (HTTP)',
            'Sony α7/α9 (FTP→Bridge)',
            'Nikon Z (FTP→Bridge)',
            'Fujifilm X-T5 (HTTP)',
            'Any WiFi camera (via bridge)',
            'tethered via script',
          ].map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-green-500 shrink-0" />
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
