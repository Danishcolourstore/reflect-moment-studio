/**
 * Cheetah Camera Setup — three panels rendered inside an active session view.
 *
 *  1. CameraSetupPanel    — collapsible reference card with endpoint, headers,
 *                            cURL, and a downloadable Node bridge script.
 *  2. FtpBridgeSettings   — persists ftp_host / ftp_username / ftp_path on the
 *                            session row so the photographer can record where
 *                            their external bridge runs.
 *  3. LiveFeedStatus      — realtime tail of cheetah_photos for this session,
 *                            with bridge-active heartbeat (60s window).
 *
 * These additions do NOT touch any existing upload / session-creation logic in
 * `useCheetahLive` or `cheetah-camera-upload`. They are pure additive UI on top
 * of data the session already exposes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown, Copy, Check, Download, Server, Activity, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CheetahLiveSession, CheetahLivePhoto } from '@/hooks/use-cheetah-live';

/* ─── shared ─────────────────────────────────────────────── */

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-medium border transition-colors',
        done
          ? 'border-[#C8A97E] text-[#C8A97E] bg-[#C8A97E]/5'
          : 'border-[var(--rule-strong)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:border-[var(--ink)]',
      )}
      aria-label={done ? 'Copied' : label}
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {done ? 'Copied' : label}
    </button>
  );
}

function timeAgo(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatBytes(n: number | null) {
  if (!n || n <= 0) return '—';
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/* ─── 1. Camera Setup Panel ──────────────────────────────── */

function buildBridgeScript(opts: { endpoint: string; sessionCode: string; uploadToken: string }) {
  return `// mirror-bridge.js — watch a folder and forward each new image to MirrorAI Cheetah.
// Usage: 1) npm i chokidar node-fetch form-data
//        2) edit WATCH_DIR below
//        3) node mirror-bridge.js
//
// Drop this on a laptop / mini-PC sitting next to your camera. Camera FTPs into
// WATCH_DIR; this script forwards each new file to Cheetah over HTTPS so it
// shows up in the gallery within seconds.

const fs       = require('fs');
const path     = require('path');
const chokidar = require('chokidar');
const fetch    = require('node-fetch');
const FormData = require('form-data');

const ENDPOINT     = ${JSON.stringify(opts.endpoint)};
const SESSION_CODE = ${JSON.stringify(opts.sessionCode)};
const UPLOAD_TOKEN = ${JSON.stringify(opts.uploadToken)};
const WATCH_DIR    = process.env.WATCH_DIR || './uploads';

const VALID = /\\.(jpe?g|png|heif|heic|tiff?|cr2|cr3|nef|arw|orf|rw2|dng)$/i;

if (!fs.existsSync(WATCH_DIR)) fs.mkdirSync(WATCH_DIR, { recursive: true });

console.log('mirror-bridge → watching', path.resolve(WATCH_DIR));
console.log('forwarding to', ENDPOINT);

async function send(file) {
  const fd = new FormData();
  fd.append('file', fs.createReadStream(file), path.basename(file));
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'x-session-code': SESSION_CODE,
        'x-upload-token': UPLOAD_TOKEN,
        ...fd.getHeaders(),
      },
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      console.error('upload failed', res.status, t);
      return;
    }
    console.log('✓', path.basename(file));
  } catch (err) {
    console.error('network error:', err.message);
  }
}

chokidar
  .watch(WATCH_DIR, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 750 } })
  .on('add', (file) => {
    if (!VALID.test(file)) return;
    send(file);
  });
`;
}

export function CameraSetupPanel({
  session,
  uploadEndpoint,
}: {
  session: CheetahLiveSession;
  uploadEndpoint: string;
}) {
  const [open, setOpen] = useState(true);

  const curl = useMemo(
    () =>
      `curl -X POST "${uploadEndpoint}" \\
  -H "x-session-code: ${session.session_code}" \\
  -H "x-upload-token: ${session.upload_token}" \\
  -F "file=@photo.jpg"`,
    [uploadEndpoint, session.session_code, session.upload_token],
  );

  const downloadBridge = useCallback(() => {
    const script = buildBridgeScript({
      endpoint: uploadEndpoint,
      sessionCode: session.session_code,
      uploadToken: session.upload_token,
    });
    const blob = new Blob([script], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mirror-bridge.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Bridge script downloaded');
  }, [uploadEndpoint, session.session_code, session.upload_token]);

  return (
    <div className="bg-white border border-[var(--rule)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--wash-strong)]/30 transition-colors"
        aria-expanded={open}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] font-medium">
            Camera Setup
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            Endpoint, headers, cURL, and a one-file Node bridge for FTP cameras.
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-[var(--ink-muted)] transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-[var(--rule)] divide-y divide-[var(--rule)]">
          {/* Endpoint */}
          <Row label="Endpoint" value={uploadEndpoint} mono />

          {/* Header rows */}
          <Row label="x-session-code" value={session.session_code} mono />
          <Row label="x-upload-token" value={session.upload_token} mono masked />

          {/* cURL block */}
          <div className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)]">cURL</p>
              <CopyButton value={curl} label="Copy cURL" />
            </div>
            <pre className="text-[11px] font-mono text-[var(--ink)] bg-[var(--wash-strong)] p-3 overflow-x-auto leading-relaxed">
{curl}
            </pre>
          </div>

          {/* Bridge download */}
          <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[12px] text-[var(--ink)] font-medium">Bridge script</p>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                Drops this session's credentials into a ready-to-run Node watcher.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadBridge}
              className="inline-flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em] font-medium border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download Bridge Script
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label, value, mono, masked,
}: { label: string; value: string; mono?: boolean; masked?: boolean }) {
  const display = masked ? value.replace(/.(?=.{4})/g, '•') : value;
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest text-[var(--ink-muted)] mb-1">{label}</p>
        <p className={cn('text-[12px] truncate', mono && 'font-mono', 'text-[var(--ink)]')}>
          {display}
        </p>
      </div>
      <CopyButton value={value} />
    </div>
  );
}

/* ─── 2. FTP Bridge Settings ─────────────────────────────── */

interface FtpBridgeForm {
  ftp_host: string;
  ftp_username: string;
  ftp_path: string;
}

export function FtpBridgeSettings({
  session,
  onUpdated,
}: {
  session: CheetahLiveSession & { ftp_path?: string | null };
  onUpdated?: (patch: Partial<CheetahLiveSession>) => void;
}) {
  const [form, setForm] = useState<FtpBridgeForm>({
    ftp_host: session.ftp_host ?? '',
    ftp_username: session.ftp_username ?? '',
    ftp_path: (session as any).ftp_path ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-sync if user switches sessions
  useEffect(() => {
    setForm({
      ftp_host: session.ftp_host ?? '',
      ftp_username: session.ftp_username ?? '',
      ftp_path: (session as any).ftp_path ?? '',
    });
    setError(null);
  }, [session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const configured = !!session.ftp_host;

  const save = async () => {
    const host = form.ftp_host.trim();
    const user = form.ftp_username.trim();
    const path = form.ftp_path.trim();
    if (!host || !user || !path) {
      setError('All fields required before enabling relay');
      return;
    }
    if (host.length > 255 || user.length > 120 || path.length > 255) {
      setError('Inputs are too long');
      return;
    }

    setError(null);
    setSaving(true);
    const { error: updErr } = await (supabase
      .from('cheetah_sessions')
      .update({ ftp_host: host, ftp_username: user, ftp_path: path } as any) as any)
      .eq('id', session.id);
    setSaving(false);

    if (updErr) {
      toast.error('Failed to save bridge settings');
      return;
    }
    toast.success('Bridge settings saved');
    onUpdated?.({ ftp_host: host, ftp_username: user, ...( { ftp_path: path } as any ) });
  };

  const inputClass =
    'w-full bg-white border border-[var(--rule-strong)] px-3 py-2 text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--ink)] transition-colors';

  return (
    <div className="bg-white border border-[var(--rule)]">
      <div className="px-5 py-4 border-b border-[var(--rule)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] font-medium">
              FTP Bridge Settings
            </p>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Where your external FTP relay lives. Cheetah doesn't connect to your
            FTP — these values are reference for your bridge script.
          </p>
        </div>
        <span
          className={cn(
            'text-[9px] uppercase tracking-[0.18em] px-2 py-1 border whitespace-nowrap',
            configured
              ? 'border-[#C8A97E] text-[#C8A97E] bg-[#C8A97E]/5'
              : 'border-[var(--rule-strong)] text-[var(--ink-muted)]',
          )}
        >
          {configured ? 'Bridge Settings Saved' : 'Bridge Not Configured'}
        </span>
      </div>

      <div className="p-5 space-y-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--ink-muted)] mb-1.5">
            FTP Host
          </label>
          <input
            type="text"
            value={form.ftp_host}
            maxLength={255}
            onChange={(e) => setForm((f) => ({ ...f, ftp_host: e.target.value }))}
            placeholder="bridge.studio.local"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--ink-muted)] mb-1.5">
            FTP Username
          </label>
          <input
            type="text"
            value={form.ftp_username}
            maxLength={120}
            onChange={(e) => setForm((f) => ({ ...f, ftp_username: e.target.value }))}
            placeholder="camera"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest text-[var(--ink-muted)] mb-1.5">
            FTP Watch Path
          </label>
          <input
            type="text"
            value={form.ftp_path}
            maxLength={255}
            onChange={(e) => setForm((f) => ({ ...f, ftp_path: e.target.value }))}
            placeholder="/uploads"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-1">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-medium border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Live Upload Status Feed ─────────────────────────── */

interface FeedRow {
  id: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

export function LiveFeedStatus({ session }: { session: CheetahLiveSession }) {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [tick, setTick] = useState(0);
  const channelRef = useRef<any>(null);

  // Initial load — most recent 25 photos
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase
        .from('cheetah_photos')
        .select('id, file_name, file_size, created_at') as any)
        .eq('session_id', session.id)
        .order('created_at', { ascending: false })
        .limit(25);
      if (!alive) return;
      setRows((data || []) as FeedRow[]);
    })();
    return () => { alive = false; };
  }, [session.id]);

  // Realtime subscription
  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    const ch = supabase
      .channel(`cheetah-feed-${session.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cheetah_photos', filter: `session_id=eq.${session.id}` },
        (payload) => {
          const p = payload.new as CheetahLivePhoto;
          setRows((prev) =>
            prev.some((x) => x.id === p.id)
              ? prev
              : [{ id: p.id, file_name: p.file_name, file_size: p.file_size, created_at: p.created_at }, ...prev].slice(0, 25),
          );
        },
      )
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [session.id]);

  // Re-tick every 15s so "X mins ago" stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const latest = rows[0];
  const lastIso = latest?.created_at ?? session.last_upload_at ?? null;
  const lastAgo = timeAgo(lastIso);
  const bridgeActive = !!lastIso && Date.now() - new Date(lastIso).getTime() < 60_000;

  // tick is consumed — silence linter
  void tick;

  return (
    <div className="bg-white border border-[var(--rule)]">
      <div className="px-5 py-4 border-b border-[var(--rule)] flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] font-medium">
              Live Feed Status
            </p>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-1">
            Last upload: <span className="text-[var(--ink)] font-mono">{lastAgo ?? '—'}</span>
          </p>
        </div>
        <div
          className={cn(
            'inline-flex items-center gap-2 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] font-medium border',
            bridgeActive
              ? 'border-[#C8A97E] text-[#C8A97E] bg-[#C8A97E]/5'
              : 'border-[var(--rule-strong)] text-[var(--ink-muted)]',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              bridgeActive ? 'bg-[#C8A97E] animate-pulse' : 'bg-[var(--ink-whisper)]',
            )}
          />
          {bridgeActive ? 'Bridge Active' : 'Idle'}
        </div>
      </div>

      <div className="max-h-[280px] overflow-y-auto">
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-[12px] text-[var(--ink-muted)] italic">
            Waiting for uploads…
          </div>
        ) : (
          <ul className="divide-y divide-[var(--rule)]/60">
            {rows.map((r) => (
              <li key={r.id} className="px-5 py-2.5 flex items-center gap-3 text-[11px]">
                <span className="flex-1 min-w-0 truncate text-[var(--ink)]">{r.file_name}</span>
                <span className="text-[10px] text-[var(--ink-muted)] font-mono shrink-0">
                  {formatBytes(r.file_size)}
                </span>
                <span className="text-[10px] text-[var(--ink-muted)] font-mono shrink-0">
                  {timeAgo(r.created_at)}
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 border border-[#C8A97E] text-[#C8A97E] bg-[#C8A97E]/5 shrink-0">
                  Received
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
