/**
 * Cheetah Live — real-time photo ingest hub for the photographer.
 * - Create a Live Session per shoot, optionally tied to an event.
 * - Get FTP / HTTPS credentials to point your camera or bridge at.
 * - Photos stream in as they're shot; guests watch via /live/:code.
 * No culling, no AI — pure live delivery.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useCheetahLive, type CheetahLiveSession } from '@/hooks/use-cheetah-live';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Radio, Camera, Copy, Check, ExternalLink, Power, Trash2,
  ImageIcon, Eye, ChevronRight, Server, Wifi, Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ───────────────────────── helpers ───────────────────────── */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

function CopyChip({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-foreground/80 bg-secondary/60 hover:bg-secondary px-2 py-1 rounded transition-colors"
    >
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span className="truncate max-w-[160px]">{value}</span>
      {done ? <Check className="h-3 w-3 text-emerald-500 shrink-0" /> : <Copy className="h-3 w-3 shrink-0 opacity-60" />}
    </button>
  );
}

/* ───────────────────────── New Session Modal ───────────────────────── */

function NewSessionDialog({
  open, onOpenChange, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (opts: { title: string; eventId: string | null }) => Promise<void>;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState<string>('none');
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await (supabase
        .from('events')
        .select('id, name') as any)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setEvents((data || []) as any);
    })();
  }, [open, user]);

  const submit = async () => {
    setCreating(true);
    await onCreate({
      title: title.trim() || `Live Session — ${new Date().toLocaleString()}`,
      eventId: eventId === 'none' ? null : eventId,
    });
    setCreating(false);
    setTitle('');
    setEventId('none');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Start Live Session</DialogTitle>
          <DialogDescription>
            Photos shot during this session will stream into Mirror AI in real time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Session name</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Anjali & Rahul — Sangeet"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Attach to event (optional)</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Standalone session —</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={creating} className="gap-2">
            <Radio className="h-4 w-4" />
            Go Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Setup Card ───────────────────────── */

function SetupCard({ session, uploadEndpoint }: { session: CheetahLiveSession; uploadEndpoint: string }) {
  const [tab, setTab] = useState<'http' | 'ftp' | 'curl'>('http');
  const liveUrl = `${window.location.origin}/live/${session.session_code}`;

  const curlCmd = `curl -X POST "${uploadEndpoint}" \\
  -H "x-session-code: ${session.session_code}" \\
  -H "x-upload-token: ${session.upload_token}" \\
  -F "file=@photo.jpg"`;

  const ftpInstructions = `# Run this Python bridge on a laptop / VPS
# (camera FTPs to bridge → bridge HTTPS-uploads to Mirror AI)

pip install pyftpdlib requests

cat > bridge.py <<'EOF'
import os, requests
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from pyftpdlib.authorizers import DummyAuthorizer

ENDPOINT = "${uploadEndpoint}"
CODE     = "${session.session_code}"
TOKEN    = "${session.upload_token}"

class H(FTPHandler):
    def on_file_received(self, path):
        try:
            with open(path,"rb") as f:
                requests.post(ENDPOINT, headers={
                    "x-session-code": CODE,
                    "x-upload-token": TOKEN,
                }, files={"file": (os.path.basename(path), f)}, timeout=30)
            os.remove(path)
        except Exception as e:
            print("upload failed:", e)

a = DummyAuthorizer()
os.makedirs("./uploads", exist_ok=True)
a.add_user("camera", "mirror2024", "./uploads", perm="elradfmw")
H.authorizer = a
H.passive_ports = range(60000, 60100)
FTPServer(("0.0.0.0", 2121), H).serve_forever()
EOF

python3 bridge.py
# In your camera FTP settings → host: <laptop-ip>, port 2121, user: camera, pass: mirror2024`;

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-medium">Camera Setup</p>
          <p className="text-xs text-muted-foreground mt-0.5">Point any camera or FTP bridge at the credentials below.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <a href={liveUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Open guest view
          </a>
        </Button>
      </div>

      {/* Quick-glance credentials */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-border">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Session Code</p>
          <CopyChip value={session.session_code} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Upload Token</p>
          <CopyChip value={session.upload_token} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Live Guest Link</p>
          <CopyChip value={liveUrl} />
        </div>
      </div>

      {/* Method tabs */}
      <div className="flex border-b border-border">
        {[
          { key: 'http' as const, label: 'HTTPS Direct', icon: Wifi },
          { key: 'ftp' as const,  label: 'FTP Bridge',   icon: Server },
          { key: 'curl' as const, label: 'cURL / Script', icon: Sparkles },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 px-4 py-3 text-[11px] uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors border-b-2',
              tab === t.key ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'http' && (
          <div className="space-y-3">
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              Cameras with HTTP/WiFi transfer (Canon R5/R6, Fujifilm X-T5, etc.) can POST directly. Set the camera's
              upload URL to the endpoint and add the headers shown.
            </p>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="bg-muted/40 px-3 py-2 rounded flex items-center justify-between">
                <span className="truncate"><span className="text-muted-foreground">URL  </span>{uploadEndpoint}</span>
                <CopyChip value={uploadEndpoint} />
              </div>
              <div className="bg-muted/40 px-3 py-2 rounded flex items-center justify-between">
                <span className="truncate"><span className="text-muted-foreground">Header  </span>x-session-code: {session.session_code}</span>
              </div>
              <div className="bg-muted/40 px-3 py-2 rounded flex items-center justify-between">
                <span className="truncate"><span className="text-muted-foreground">Header  </span>x-upload-token: {session.upload_token}</span>
              </div>
              <div className="bg-muted/40 px-3 py-2 rounded">
                <span className="text-muted-foreground">Body  </span>multipart/form-data, field name "file"
              </div>
            </div>
          </div>
        )}

        {tab === 'ftp' && (
          <div className="space-y-3">
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              Most pro cameras (Sony α, Nikon Z, Canon 1DX) push via FTP. Run this small bridge on a laptop at the venue —
              it accepts FTP from your camera and forwards each photo to Mirror AI over HTTPS.
            </p>
            <pre className="text-[10px] font-mono leading-relaxed bg-muted/40 p-3 rounded overflow-x-auto whitespace-pre">
{ftpInstructions}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(ftpInstructions); toast.success('Bridge script copied'); }}
              className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Copy bridge script
            </button>
          </div>
        )}

        {tab === 'curl' && (
          <div className="space-y-3">
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              Use this from any script, watcher, or terminal to push a single photo into the live session.
            </p>
            <pre className="text-[11px] font-mono bg-muted/40 p-3 rounded overflow-x-auto whitespace-pre">
{curlCmd}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(curlCmd); toast.success('cURL copied'); }}
              className="text-[11px] text-accent hover:underline inline-flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Copy cURL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Live Monitor (photographer) ───────────────────────── */

function LiveMonitor({
  session, photos,
}: {
  session: CheetahLiveSession;
  photos: { id: string; file_name: string; thumbnail_url: string | null; preview_url: string | null; original_url: string; created_at: string }[];
}) {
  return (
    <div className="bg-card border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              'h-2 w-2 rounded-full',
              session.is_live ? 'bg-emerald-500' : 'bg-muted-foreground/40',
            )} />
            {session.is_live && (
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-60" />
            )}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-accent font-medium">Live Monitor</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {photos.length} photo{photos.length === 1 ? '' : 's'} received · {session.public_view_count} guest view{session.public_view_count === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="py-16 px-5 text-center">
          <Camera className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-foreground font-medium">Waiting for the first photo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your camera with the credentials above. Photos will appear here the second they're shot.
          </p>
        </div>
      ) : (
        <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {photos.map((p) => (
            <a
              key={p.id}
              href={p.original_url}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden bg-muted"
            >
              <img
                src={p.thumbnail_url || p.preview_url || p.original_url}
                alt={p.file_name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-white/90 truncate">{timeAgo(p.created_at)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Sessions sidebar ───────────────────────── */

function SessionRow({
  session, isActive, onSelect, onEnd, onDelete,
}: {
  session: CheetahLiveSession;
  isActive: boolean;
  onSelect: () => void;
  onEnd: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-3 border-l-2 transition-all flex items-center gap-3',
        isActive
          ? 'border-accent bg-accent/5'
          : 'border-transparent hover:bg-secondary/30',
      )}
    >
      <div className={cn(
        'h-2 w-2 rounded-full shrink-0',
        session.is_live ? 'bg-emerald-500 skeleton-block' : 'bg-muted-foreground/30',
      )} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground truncate font-medium">{session.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {session.total_photos} photo{session.total_photos === 1 ? '' : 's'} · {timeAgo(session.created_at)}
        </p>
      </div>
      <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-opacity', isActive ? 'opacity-60' : 'opacity-0')} />
    </button>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function CheetahLivePage() {
  const {
    sessions, activeSession, activeSessionId, setActiveSessionId,
    photos, loading, createSession, endSession, deleteSession, uploadEndpoint,
  } = useCheetahLive();
  const [showNew, setShowNew] = useState(false);
  const [params] = useSearchParams();

  // Auto-prompt new session if URL has ?new=1
  useEffect(() => {
    if (params.get('new') === '1') setShowNew(true);
  }, [params]);

  const liveCount = useMemo(() => sessions.filter((s) => s.is_live).length, [sessions]);

  return (
    <DashboardLayout>
      {/* Hero */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="h-4 w-4 text-accent" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-accent font-medium">Cheetah · Live Ingest</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground" style={{ fontWeight: 300 }}>
            Real-time delivery
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
            Stream photos straight from your camera to Mirror AI. Guests watch the gallery fill up in real time.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Session</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-muted-foreground text-sm">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="bg-card border border-dashed border-border py-20 px-6 text-center">
          <Radio className="mx-auto h-10 w-10 text-muted-foreground/30 mb-4" />
          <h2 className="font-serif text-xl text-foreground mb-2">No live sessions yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            Start a Cheetah session to get camera credentials. Each photo you shoot will appear here and in the public guest gallery within seconds.
          </p>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Start your first session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-5">
          {/* Sessions list */}
          <aside className="bg-card border border-border max-h-[70vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Sessions · {sessions.length}
              </span>
              {liveCount > 0 && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 skeleton-block" />
                  {liveCount} live
                </span>
              )}
            </div>
            <div className="divide-y divide-border/40">
              {sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  isActive={s.id === activeSessionId}
                  onSelect={() => setActiveSessionId(s.id)}
                  onEnd={() => endSession(s.id)}
                  onDelete={() => deleteSession(s.id)}
                />
              ))}
            </div>
          </aside>

          {/* Active session */}
          <div className="space-y-5 min-w-0">
            {activeSession ? (
              <>
                {/* Title + actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl text-foreground truncate" style={{ fontWeight: 300 }}>
                      {activeSession.title}
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>Code <span className="font-mono text-foreground">{activeSession.session_code}</span></span>
                      <span>·</span>
                      <span>{activeSession.is_live ? 'Live' : 'Ended'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeSession.is_live && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => endSession(activeSession.id)}
                        className="gap-1.5"
                      >
                        <Power className="h-3.5 w-3.5" /> End
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete session "${activeSession.title}" and all ${activeSession.total_photos} photos?`)) {
                          deleteSession(activeSession.id);
                        }
                      }}
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {activeSession.is_live && (
                  <SetupCard session={activeSession} uploadEndpoint={uploadEndpoint} />
                )}

                <LiveMonitor session={activeSession} photos={photos} />
              </>
            ) : (
              <div className="bg-card border border-border py-16 px-6 text-center text-sm text-muted-foreground">
                Select a session from the left.
              </div>
            )}
          </div>
        </div>
      )}

      <NewSessionDialog
        open={showNew}
        onOpenChange={setShowNew}
        onCreate={async (opts) => { await createSession(opts); }}
      />
    </DashboardLayout>
  );
}
