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

/* ───────────────────────── Setup Card ─────────────────────────
 * HTTPS is the primary path (works natively on Canon R5/R6, Fuji X-T5,
 * Sony α1/α7R V firmware 2.0+, Nikon Z9). FTP is demoted to "Legacy /
 * Bridge" with an honest disclaimer — Mirror does not currently host
 * an FTP relay; photographers must run a small bridge at the venue.
 * The DB columns are scaffolded so when/if a managed FTP relay ships,
 * the credentials are already there and the camera-side config doesn't
 * change.
 * ─────────────────────────────────────────────────────────────── */

function lastPing(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function SetupCard({ session, uploadEndpoint }: { session: CheetahLiveSession; uploadEndpoint: string }) {
  const [tab, setTab] = useState<'https' | 'ftp' | 'curl'>('https');
  const liveUrl = `${window.location.origin}/live/${session.session_code}`;
  const lastUpload = lastPing(session.last_upload_at);

  const curlCmd = `curl -X POST "${uploadEndpoint}" \\
  -H "x-session-code: ${session.session_code}" \\
  -H "x-upload-token: ${session.upload_token}" \\
  -F "file=@photo.jpg"`;

  const ftpInstructions = `# Mirror does not currently host a managed FTP relay.
# To use FTP, run this small bridge on a laptop at the venue.
# Camera FTPs to laptop → laptop forwards each photo to Mirror over HTTPS.

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
a.add_user("${session.ftp_username || 'camera'}", "${session.ftp_password || 'mirror2024'}", "./uploads", perm="elradfmw")
H.authorizer = a
H.passive_ports = range(60000, 60100)
FTPServer(("0.0.0.0", 2121), H).serve_forever()
EOF

python3 bridge.py
# In your camera FTP settings:
#   host: <laptop-ip>      port: 2121
#   user: ${session.ftp_username || 'camera'}      pass: ${session.ftp_password || 'mirror2024'}`;

  return (
    <div className="bg-white border border-[var(--rule)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--rule)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] font-medium">Camera Setup</p>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            HTTPS is the primary path. Most cameras sold since 2022 support it natively.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0">
          <a href={liveUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Guest view
          </a>
        </Button>
      </div>

      {/* Quick credentials + telemetry */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-[var(--rule)]">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Session Code</p>
          <CopyChip value={session.session_code} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Upload Token</p>
          <CopyChip value={session.upload_token} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Last upload</p>
          <p className="text-[11px] font-mono text-[var(--ink)] flex items-center gap-1.5">
            <span className={cn(
              'h-1.5 w-1.5 rounded-full',
              lastUpload ? 'bg-emerald-500' : 'bg-[var(--ink-whisper)]',
            )} />
            {lastUpload ?? 'awaiting first photo'}
          </p>
        </div>
      </div>

      {/* Method tabs */}
      <div className="flex border-b border-[var(--rule)]">
        {[
          { key: 'https' as const, label: 'HTTPS Direct', icon: Wifi, badge: 'Primary' },
          { key: 'ftp' as const,   label: 'FTP Bridge',   icon: Server, badge: 'Legacy' },
          { key: 'curl' as const,  label: 'cURL · Script', icon: Sparkles, badge: null },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 px-4 py-3 text-[11px] uppercase tracking-widest font-medium flex items-center justify-center gap-2 transition-colors border-b-2',
              tab === t.key ? 'border-[var(--ink)] text-[var(--ink)]' : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
            {t.badge && (
              <span className={cn(
                'text-[8px] tracking-[0.12em] px-1.5 py-0.5 border',
                t.badge === 'Primary'
                  ? 'border-[var(--ink)] text-[var(--ink)]'
                  : 'border-[var(--rule-strong)] text-[var(--ink-whisper)]',
              )}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === 'https' && (
          <div className="space-y-4">
            <p className="text-[12px] text-[var(--ink)] leading-relaxed">
              Set your camera's HTTPS upload URL to the endpoint below and add the two headers.
              Tested on Canon R5 / R5 II / R6 II, Fujifilm X-T5 / X-H2, Sony α1 / α7R V (firmware 2.0+),
              Nikon Z9. First photo appears here the moment you press the shutter.
            </p>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="bg-[var(--wash-strong)] px-3 py-2 flex items-center justify-between gap-3">
                <span className="truncate"><span className="text-[var(--ink-muted)]">URL  </span>{uploadEndpoint}</span>
                <CopyChip value={uploadEndpoint} />
              </div>
              <div className="bg-[var(--wash-strong)] px-3 py-2 flex items-center justify-between gap-3">
                <span className="truncate"><span className="text-[var(--ink-muted)]">Header  </span>x-session-code: {session.session_code}</span>
              </div>
              <div className="bg-[var(--wash-strong)] px-3 py-2 flex items-center justify-between gap-3">
                <span className="truncate"><span className="text-[var(--ink-muted)]">Header  </span>x-upload-token: {session.upload_token}</span>
              </div>
              <div className="bg-[var(--wash-strong)] px-3 py-2">
                <span className="text-[var(--ink-muted)]">Body  </span>multipart/form-data, field name "file"
              </div>
            </div>
          </div>
        )}

        {tab === 'ftp' && (
          <div className="space-y-4">
            <div className="border-l-2 border-[var(--ink)] pl-3 py-1">
              <p className="text-[11px] text-[var(--ink)] leading-relaxed">
                <strong className="font-medium">Mirror does not currently host an FTP server.</strong>{' '}
                Older bodies (Sony α7 III, Canon 1DX II, Nikon D850) push only via FTP — for those,
                run the bridge below on a venue laptop. It accepts FTP from your camera and forwards
                each photo to Mirror over HTTPS.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="bg-[var(--wash-strong)] px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Bridge user</p>
                <CopyChip value={session.ftp_username || 'camera'} />
              </div>
              <div className="bg-[var(--wash-strong)] px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Bridge pass</p>
                <CopyChip value={session.ftp_password || 'mirror2024'} />
              </div>
              <div className="bg-[var(--wash-strong)] px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Local port</p>
                <span className="text-[var(--ink)]">2121</span>
              </div>
              <div className="bg-[var(--wash-strong)] px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">Mode</p>
                <span className="text-[var(--ink)]">Passive</span>
              </div>
            </div>

            <pre className="text-[10px] font-mono leading-relaxed bg-[var(--wash-strong)] p-3 overflow-x-auto whitespace-pre max-h-[260px]">
{ftpInstructions}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(ftpInstructions); toast.success('Bridge script copied'); }}
              className="text-[11px] text-[var(--ink)] underline underline-offset-2 hover:opacity-70 inline-flex items-center gap-1"
            >
              <Copy className="h-3 w-3" /> Copy bridge script
            </button>
          </div>
        )}

        {tab === 'curl' && (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--ink)] leading-relaxed">
              For scripts, watchers, or terminal pushes — single photo into the live session.
            </p>
            <pre className="text-[11px] font-mono bg-[var(--wash-strong)] p-3 overflow-x-auto whitespace-pre">
{curlCmd}
            </pre>
            <button
              onClick={() => { navigator.clipboard.writeText(curlCmd); toast.success('cURL copied'); }}
              className="text-[11px] text-[var(--ink)] underline underline-offset-2 hover:opacity-70 inline-flex items-center gap-1"
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
